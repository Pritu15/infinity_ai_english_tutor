import { z } from "zod";

export const assessmentStartSchema = z.object({
  difficulty: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).default("B1")
});

export const assessmentAnswerSchema = z.object({
  answer: z.string().min(1).max(5000),
  questionId: z.string().min(1),
  skill: z.enum(["grammar", "vocabulary", "reading", "listening", "writing", "speaking"])
});

export const assessmentSubmitSchema = z.object({
  assessmentId: z.string().min(1),
  answers: z.array(assessmentAnswerSchema).min(1).max(20)
});

export type AssessmentAnswerInput = z.infer<typeof assessmentAnswerSchema>;
export type AssessmentStartInput = z.infer<typeof assessmentStartSchema>;
export type AssessmentSubmitInput = z.infer<typeof assessmentSubmitSchema>;
