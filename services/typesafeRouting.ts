import type { IngestDecision } from './aiContracts.js';
import type {
  ChoiceAnswer,
  ChoiceQuestion,
  SystemOneRequest,
  SystemOneResponse,
} from './typesafeTypes.js';

export const JEV_ROUTING_CONFIDENCE_THRESHOLD = 0.80;

export interface IngestThemeCandidate {
  id: string;
  title: string;
}

export interface IngestNoteCandidate {
  id?: string;
  title?: string;
  content?: string;
  mood?: string;
  createdAt?: string;
}

export const buildJevIngestDecisionRequest = (
  note: IngestNoteCandidate,
  themes: IngestThemeCandidate[],
): SystemOneRequest<{ route_decision: ChoiceQuestion }> => {
  const criteria: Record<string, string> = {
    skip: 'The entry is an ephemeral check-in, daily logistics, routine task, or lacks a durable personal pattern.',
    create_new: 'The entry reveals a distinct, significant personal pattern or recurring theme not covered by existing themes.',
  };

  themes.forEach((theme) => {
    criteria[`append_${theme.id}`] = `The entry fits and continues the established theme: "${theme.title}".`;
  });

  criteria['none_of_these'] = 'Unclear, ambiguous, or borderline entry that cannot be decisively categorized.';

  return {
    state: {
      note_title: note.title || 'Untitled',
      note_content: note.content || '',
      note_mood: note.mood || 'Unspecified',
      existing_themes: themes.map((theme) => ({ id: theme.id, title: theme.title })),
    },
    model: 'jev-latest',
    questions: {
      route_decision: {
        type: 'choice',
        instructions:
          'Decide how this journal entry should be routed in the Life Wiki: append to an existing theme, create a new theme, or skip as low-signal.',
        criteria,
      },
    },
  };
};

export const evaluateJevIngestDecision = (
  response: SystemOneResponse | null | undefined,
  validThemeIds: string[],
): IngestDecision | null => {
  if (!response?.answers?.route_decision) return null;

  const answer = response.answers.route_decision as ChoiceAnswer<string>;
  if (!answer.probabilities || !answer.selected) return null;

  const selectedOption = answer.selected;
  const probability = answer.probabilities[selectedOption] ?? 0;

  if (probability < JEV_ROUTING_CONFIDENCE_THRESHOLD) {
    return null; // Low confidence -> escalate to Gemini
  }

  if (selectedOption === 'skip') {
    return {
      action: 'skip',
      themeId: null,
      newThemeTitle: null,
      reasoning: 'jev_high_confidence_skip',
    };
  }

  if (selectedOption.startsWith('append_')) {
    const themeId = selectedOption.slice('append_'.length);
    if (validThemeIds.includes(themeId)) {
      return {
        action: 'append',
        themeId,
        newThemeTitle: null,
        reasoning: 'jev_high_confidence_append',
      };
    }
  }

  // 'create_new' requires generating a new theme title (text generation) -> escalate to Gemini
  // 'none_of_these' -> escalate to Gemini
  return null;
};
