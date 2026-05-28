export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const LEARNING_SKILLS = [
  "grammar",
  "vocabulary",
  "reading",
  "listening",
  "writing",
  "speaking"
] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];
export type LearningSkill = (typeof LEARNING_SKILLS)[number];

export interface ApiEnvelope<TData> {
  data: TData;
  requestId: string;
}
