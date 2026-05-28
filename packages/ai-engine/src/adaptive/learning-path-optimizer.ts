import type { LearningSkill } from "../types.js";

export interface UpcomingLesson {
  difficulty: string;
  id: string;
  skill: LearningSkill;
  title: string;
}

export class LearningPathOptimizer {
  reorder(upcomingLessons: UpcomingLesson[], weaknessFlags: readonly LearningSkill[]): UpcomingLesson[] {
    const weaknessSet = new Set(weaknessFlags);

    return [...upcomingLessons].sort((left, right) => {
      const leftPriority = weaknessSet.has(left.skill) ? 0 : 1;
      const rightPriority = weaknessSet.has(right.skill) ? 0 : 1;

      return leftPriority - rightPriority;
    });
  }
}
