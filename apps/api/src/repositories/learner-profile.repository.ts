import type { CefrLevel, LearnerProfile, PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export interface UpsertLearnerProfileInput {
  learningGoal: string;
  learningStyle: string;
  nativeLanguage: string;
  preferredSkills: string[];
  targetLevel: CefrLevel;
}

export class LearnerProfileRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  upsert(userId: string, input: UpsertLearnerProfileInput): Promise<LearnerProfile> {
    return this.client.learnerProfile.upsert({
      create: {
        learningGoal: input.learningGoal,
        learningStyle: input.learningStyle,
        nativeLanguage: input.nativeLanguage,
        preferredSkills: input.preferredSkills,
        targetLevel: input.targetLevel,
        userId
      },
      update: {
        learningGoal: input.learningGoal,
        learningStyle: input.learningStyle,
        nativeLanguage: input.nativeLanguage,
        preferredSkills: input.preferredSkills,
        targetLevel: input.targetLevel
      },
      where: {
        userId
      }
    });
  }
}
