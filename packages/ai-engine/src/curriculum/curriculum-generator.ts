import type { CefrLevel, LearningSkill } from "../types.js";

export interface LearnerProfileInput {
  learningGoal: string;
  learningStyle: string;
  nativeLanguage: string;
  preferredSkills: LearningSkill[];
  targetLevel: CefrLevel;
  userId: string;
}

export interface GeneratedExercise {
  expectedAnswer?: string;
  maxScore: number;
  prompt: string;
  rubric: Record<string, unknown>;
  type: string;
}

export interface GeneratedLesson {
  contentJson: Record<string, unknown>;
  difficulty: CefrLevel;
  estimatedMinutes: number;
  exercises: GeneratedExercise[];
  skill: LearningSkill;
  title: string;
}

export interface GeneratedLessonPlan {
  generatedBy: string;
  lessons: GeneratedLesson[];
  skillFocus: LearningSkill[];
  weekNumber: number;
}

export interface CurriculumLlm {
  generateLessonPlan(profile: LearnerProfileInput): Promise<GeneratedLessonPlan[]>;
}

export interface CurriculumRepository {
  saveFourWeekPlan(userId: string, plans: GeneratedLessonPlan[]): Promise<GeneratedLessonPlan[]>;
}

export class CurriculumGenerator {
  constructor(
    private readonly llm: CurriculumLlm,
    private readonly repository: CurriculumRepository
  ) {}

  async generate(profile: LearnerProfileInput): Promise<GeneratedLessonPlan[]> {
    const plans = await this.llm.generateLessonPlan(profile);

    if (plans.length !== 4) {
      throw new Error("Curriculum generation must return exactly four weekly lesson plans");
    }

    for (const plan of plans) {
      if (plan.lessons.length === 0 || plan.skillFocus.length === 0) {
        throw new Error(`Generated week ${plan.weekNumber} is incomplete`);
      }
    }

    return this.repository.saveFourWeekPlan(profile.userId, plans);
  }
}
