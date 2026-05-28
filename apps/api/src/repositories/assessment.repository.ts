import type { Assessment, AssessmentType, PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export interface CompleteAssessmentInput {
  grammarScore: number;
  listeningScore: number;
  readingScore: number;
  score: number;
  speakingScore: number;
  strengths: string[];
  vocabularyScore: number;
  weaknesses: string[];
  writingScore: number;
}

export class AssessmentRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  createStarted(userId: string, type: AssessmentType = "DIAGNOSTIC"): Promise<Assessment> {
    return this.client.assessment.create({
      data: {
        strengths: [],
        type,
        userId,
        weaknesses: []
      }
    });
  }

  complete(id: string, userId: string, input: CompleteAssessmentInput): Promise<Assessment> {
    return this.client.assessment.update({
      data: {
        completedAt: new Date(),
        grammarScore: input.grammarScore,
        listeningScore: input.listeningScore,
        readingScore: input.readingScore,
        score: input.score,
        speakingScore: input.speakingScore,
        strengths: input.strengths,
        vocabularyScore: input.vocabularyScore,
        weaknesses: input.weaknesses,
        writingScore: input.writingScore
      },
      where: {
        id,
        userId
      }
    });
  }
}
