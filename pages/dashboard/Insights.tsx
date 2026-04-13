import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Brain, TrendingUp, Heart, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RoutePath, Note } from '../../types';
import { noteService } from '../../services/noteService';
import { GoogleGenAI } from "@google/genai";

export const Insights: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [reflection, setReflection] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allNotes = await noteService.getAll();
        setNotes(allNotes);
        if (allNotes.length >= 3) {
          generateReflection(allNotes);
        }
      } catch (error) {
        console.error("Failed to fetch notes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const generateReflection = async (allNotes: Note[]) => {
    setGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

      const notesContext = allNotes
        .slice(0, 10) // Last 10 notes for context
        .map(n => `Title: ${n.title}\nContent: ${n.content.replace(/<[^>]*>/g, '')}\nMood: ${n.mood || 'None'}`)
        .join('\n\n---\n\n');

      const prompt = `You are an empathetic journaling assistant. Based on the following recent journal entries, provide a concise, insightful, and grounded reflection (max 3 sentences). Focus on recurring themes, emotional patterns, and offer a gentle word of encouragement. If the entries are too short to provide deep insight, mention that you're starting to see patterns but need more depth.
      
      Entries:
      ${notesContext}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });
      
      setReflection(response.text || "Your journey is unique. Keep writing to discover more about yourself.");
    } catch (error) {
      console.error("Failed to generate reflection:", error);
      setReflection("I'm having trouble reflecting on your journey right now. Let's keep writing and try again later.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl animate-in fade-in duration-700 pb-20 px-4 md:px-10">
      <nav className="sticky top-4 z-50 mb-12 flex items-center justify-between rounded-2xl border-2 border-border bg-white/90 px-4 py-3 shadow-[0_4px_0_0_#E5E5E5] backdrop-blur-2xl transition-all">
        <div className="flex items-center gap-3">
           <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-nav hover:text-gray-text font-bold uppercase text-[12px]">
             <ArrowLeft className="mr-2 h-4 w-4" />
             BACK
           </Button>
           <div className="h-4 w-[2px] bg-border"></div>
           <span className="text-[12px] font-extrabold text-gray-nav uppercase tracking-wider">AI Insights</span>
        </div>
      </nav>

      <div className="space-y-8">
        <header className="text-center mb-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-[24px] bg-blue/10 text-blue mb-6 shadow-3d-gray border-2 border-border">
            <Brain size={32} />
          </div>
          <h1 className="text-4xl font-display text-gray-text lowercase mb-4">Your Emotional Landscape</h1>
          <p className="text-gray-light max-w-lg mx-auto font-medium">
            AI-powered analysis of your journaling patterns to help you understand your journey better.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-2 border-border rounded-[32px] p-8 shadow-[0_8px_0_0_#E5E5E5] liquid-glass">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-green/10 text-green flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-[16px] font-bold text-gray-text uppercase tracking-wider">Mood Trends</h3>
            </div>
            <div className="h-40 flex items-center justify-center border-2 border-dashed border-border rounded-2xl bg-gray-50/50">
              <div className="text-center px-6">
                <p className="text-[13px] font-bold text-gray-nav uppercase tracking-widest opacity-40 mb-2">Visualization Coming Soon</p>
                <p className="text-[11px] font-medium text-gray-light">We're building a beautiful way to see your emotional journey over time.</p>
              </div>
            </div>
            <p className="mt-6 text-[14px] text-gray-light font-medium leading-relaxed">
              Based on your {notes.length} entries, we're identifying recurring emotional cycles and triggers.
            </p>
          </div>

          <div className="bg-white border-2 border-border rounded-[32px] p-8 shadow-[0_8px_0_0_#E5E5E5] liquid-glass">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Heart size={20} />
              </div>
              <h3 className="text-[16px] font-bold text-gray-text uppercase tracking-wider">Self-Care Focus</h3>
            </div>
            <div className="space-y-4">
              {notes.length < 3 ? (
                <div className="p-8 rounded-2xl border-2 border-dashed border-border bg-gray-50/50 text-center">
                  <p className="text-[12px] font-bold text-gray-nav uppercase tracking-widest opacity-40">Write 3 notes to unlock personalized self-care focus</p>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-2xl bg-purple-500/5 border-2 border-purple-500/10">
                    <p className="text-[14px] text-gray-text font-medium italic">"You've mentioned 'peace' more often this week. Consider what activities brought that feeling."</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue/5 border-2 border-blue/10">
                    <p className="text-[14px] text-gray-text font-medium italic">"Your late-night entries tend to be more anxious. Try a 5-minute wind-down routine."</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue to-blue/80 rounded-[32px] p-10 text-white shadow-3d-blue liquid-glass-strong relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Sparkles size={24} />
              </div>
              <h4 className="text-[24px] font-display lowercase">AI Reflection</h4>
            </div>

            {notes.length < 3 ? (
              <div className="mb-8">
                <p className="text-[18px] font-medium leading-relaxed opacity-90 mb-4">
                  "I need a little more context to provide a meaningful reflection. Journaling is a journey, and every entry helps me understand your landscape better."
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-[12px] font-bold uppercase tracking-widest">
                  <MessageSquare size={14} />
                  {3 - notes.length} more entries needed
                </div>
              </div>
            ) : generating ? (
              <div className="flex items-center gap-3 mb-8">
                <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                <p className="text-[18px] font-medium leading-relaxed opacity-60 italic">Synthesizing your thoughts...</p>
              </div>
            ) : (
              <p className="text-[18px] font-medium leading-relaxed opacity-90 mb-8">
                "{reflection || "Your journey is unique. Keep writing to discover more about yourself."}"
              </p>
            )}

            <Button 
              variant="secondary" 
              className="bg-white text-blue font-extrabold uppercase shadow-3d-gray hover:bg-white/90 transition-all"
              onClick={() => navigate(RoutePath.CREATE_NOTE)}
            >
              {notes.length < 3 ? "START WRITING" : "CONTINUE YOUR JOURNEY"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
