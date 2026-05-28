import type { LearningSkill } from "../types.js";

export interface SubmissionSummary {
  score: number;
  skill: LearningSkill;
  submittedAt: Date;
}

export class WeaknessDetector {
  detect(submissions: SubmissionSummary[], threshold = 60): LearningSkill[] {
    const recentBySkill = new Map<LearningSkill, SubmissionSummary[]>();

    for (const submission of [...submissions].sort(
      (left, right) => right.submittedAt.getTime() - left.submittedAt.getTime()
    )) {
      const skillSubmissions = recentBySkill.get(submission.skill) ?? [];
      if (skillSubmissions.length < 10) {
        skillSubmissions.push(submission);
        recentBySkill.set(submission.skill, skillSubmissions);
      }
    }

    return [...recentBySkill.entries()]
      .filter(([, skillSubmissions]) => {
        const average =
          skillSubmissions.reduce((total, submission) => total + submission.score, 0) /
          skillSubmissions.length;

        return average < threshold;
      })
      .map(([skill]) => skill);
  }
}
