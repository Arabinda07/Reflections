import { GoogleGenAI } from "@google/genai";
import { Note, LifeTheme } from '../types';
import { wikiService } from './wikiService';

export const aiService = {
  /**
   * The "Ingest" Flow: Reads a new note, looks at existing themes, and incrementally 
   * builds the user's persistent LLM Wiki.
   */
  processNoteIntoWiki: async (newNote: Note) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    
    // Fetch the current themes automatically so the frontend doesn't need to block on it
    const currentThemes = await wikiService.getAllThemes();
    
    // Create an index of current themes to help the LLM decide
    const themeIndex = currentThemes.map(t => `- ID: ${t.id} | Title: ${t.title}`).join('\n');
    
    // Step 1: Decision making
    const decisionPrompt = `You are a personal cognitive librarian. The user has just saved a new journal entry.
    
Your job is to decide whether this note should be integrated into one of their existing Life Themes, OR if a brand new Life Theme should be created.

Current Life Themes:
${themeIndex || "(None yet)"}

New Journal Entry:
Title: ${newNote.title}
Content: ${newNote.content.replace(/<[^>]*>/g, '')}
Mood: ${newNote.mood || 'None'}

Return ONLY a valid JSON object in this exact format:
{
  "action": "append" | "create" | "skip",
  "themeId": "ID of theme if action is append",
  "newThemeTitle": "Title of theme if action is create",
  "reasoning": "brief reason"
}
If the note is generic and provides no deep life insights, return "skip".
`;

    try {
      const decisionResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: decisionPrompt,
      });

      let responseText = decisionResponse.text || "";
      // Strip markdown code block if hallucinated
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const decision = JSON.parse(responseText);

      if (decision.action === 'skip') {
        return; // Nothing profound to record
      }

      let targetThemeId = decision.themeId;

      if (decision.action === 'create' && decision.newThemeTitle) {
        // Create the new empty theme
        const newTheme = await wikiService.createTheme(decision.newThemeTitle, "Initializing...");
        targetThemeId = newTheme.id;
      }

      if (targetThemeId) {
        // Step 2: Synthesis
        // Fetch the current contents
        const theme = await wikiService.getThemeById(targetThemeId);
        if (!theme) throw new Error("Theme not found during synthesis.");

        const synthesisPrompt = `You are a careful cognitive synthesizer maintaining the user's personal Wiki.
        
You are updating the life theme titled: "${theme.title}".

Here is the CURRENT state of this life theme:
${theme.content === 'Initializing...' ? '(This is a brand new theme. Start fresh.)' : theme.content}

---
Here is the NEW journal entry you must ingest:
Title: ${newNote.title}
Date: ${new Date(newNote.createdAt).toLocaleDateString()}
Content: ${newNote.content.replace(/<[^>]*>/g, '')}
Mood: ${newNote.mood || 'None'}
---

Task: Write the completely updated Markdown for this Life Theme.
Rules:
1. Integrate the new information smoothly. Note how their thoughts are evolving.
2. If new info contradicts old info, note the shift in perspective (e.g., "Earlier they felt X, but today they realized Y...").
3. Use clean markdown (headings, bullet points) for readability.
4. Do NOT output a wrapper like \`\`\`markdown, just the raw text.`;

        const synthesisResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: synthesisPrompt,
        });

        if (synthesisResponse.text) {
           await wikiService.updateThemeContent(targetThemeId, synthesisResponse.text.trim());
           // Add the citation so we know this note contributed!
           await wikiService.addCitation(targetThemeId, newNote.id);
        }
      }

    } catch (error) {
      console.error("AI Wiki Ingestion Error:", error);
      // Suppress errors during ingestion to prevent breaking the save flow
    }
  }
};
