import { supabase } from '../src/supabaseClient';

export type AiAction =
  | 'prompts'
  | 'reflection'
  | 'tags'
  | 'ingestDecision'
  | 'ingestSynthesis'
  | 'wikiPage'
  | 'index'
  | 'companionQuery';

type AiResponse<T> = {
  ok: true;
  data: T;
};

const AI_ENDPOINT = '/api/ai';

const getAccessToken = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const token = data.session?.access_token;
  if (!token) {
    throw new Error('User not authenticated');
  }

  return token;
};

const callAi = async <T>(action: AiAction, payload: unknown): Promise<T> => {
  const token = await getAccessToken();
  const response = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, payload }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error || `AI request failed with status ${response.status}`
    );
  }

  return (data as AiResponse<T>).data;
};

export const aiClient = {
  requestJson: async <T>(action: AiAction, payload: unknown): Promise<T> => {
    return callAi<T>(action, payload);
  },
  requestText: async (action: AiAction, payload: unknown): Promise<string> => {
    return callAi<string>(action, payload);
  },
};
