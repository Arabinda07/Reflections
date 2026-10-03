export type ChoiceQuestion<T extends string = string> = {
  type: 'choice';
  instructions: string | Record<string, unknown>;
  criteria: Record<T, string | null>;
};

export type NoulQuestion = {
  type: 'noul';
  instructions: string | Record<string, unknown>;
  criteria?: {
    true?: string | Record<string, unknown>;
    false?: string | Record<string, unknown>;
  };
};

export type ScoreQuestion = {
  type: 'score';
  instructions: string | Record<string, unknown>;
  criteria: Array<string | Record<string, unknown>>;
};

export type SystemOneQuestion = ChoiceQuestion | NoulQuestion | ScoreQuestion;

export type ChoiceAnswer<T extends string = string> = {
  selected: T;
  probabilities: Record<T, number>;
  confidence: number;
};

export type NoulAnswer = {
  probability: number;
};

export type ScoreAnswer = {
  score: number;
  probabilities: number[];
  confidence: number;
};

export type SystemOneAnswer = ChoiceAnswer | NoulAnswer | ScoreAnswer;

export interface SystemOneRequest<
  Q extends Record<string, SystemOneQuestion> = Record<string, SystemOneQuestion>,
> {
  state: unknown;
  model: 'jev-latest' | string;
  questions: Q;
}

export interface SystemOneResponse<
  A extends Record<string, SystemOneAnswer> = Record<string, SystemOneAnswer>,
> {
  model: string;
  answers: A;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export const isChoiceAnswer = (answer: unknown): answer is ChoiceAnswer => {
  return (
    typeof answer === 'object' &&
    answer !== null &&
    'selected' in answer &&
    'probabilities' in answer &&
    'confidence' in answer
  );
};

export const isNoulAnswer = (answer: unknown): answer is NoulAnswer => {
  return (
    typeof answer === 'object' &&
    answer !== null &&
    'probability' in answer &&
    !('selected' in answer) &&
    !('score' in answer)
  );
};

export const isScoreAnswer = (answer: unknown): answer is ScoreAnswer => {
  return (
    typeof answer === 'object' &&
    answer !== null &&
    'score' in answer &&
    'probabilities' in answer &&
    'confidence' in answer
  );
};
