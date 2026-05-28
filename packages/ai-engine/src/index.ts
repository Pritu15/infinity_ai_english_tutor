export interface TutorPromptContext {
  learnerLevel: string;
  mode: "general" | "grammar-help" | "writing-correction" | "ielts-interview" | "speaking-practice";
  weaknesses: readonly string[];
}

export const buildTutorSystemPrompt = (context: TutorPromptContext): string =>
  [
    "You are an adaptive English tutor.",
    `Learner level: ${context.learnerLevel}.`,
    `Session mode: ${context.mode}.`,
    `Prioritize weaknesses: ${context.weaknesses.join(", ") || "none recorded"}.`
  ].join(" ");
