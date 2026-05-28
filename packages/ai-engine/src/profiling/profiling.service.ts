import type { CefrLevel } from "../types.js";

export interface SkillAssessmentScores {
  grammar: number;
  listening: number;
  reading: number;
  speaking: number;
  vocabulary: number;
  writing: number;
}

export class ProfilingService {
  mapAssessmentScoresToCefr(scores: SkillAssessmentScores): CefrLevel {
    const average =
      (scores.grammar +
        scores.vocabulary +
        scores.reading +
        scores.listening +
        scores.writing +
        scores.speaking) /
      6;

    if (average >= 90) return "C2";
    if (average >= 80) return "C1";
    if (average >= 70) return "B2";
    if (average >= 55) return "B1";
    if (average >= 40) return "A2";
    return "A1";
  }
}
