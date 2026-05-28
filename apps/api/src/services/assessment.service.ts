import type { Assessment, LearnerProfile } from "@prisma/client";
import { AssessmentRepository } from "../repositories/assessment.repository.js";
import { LearnerProfileRepository } from "../repositories/learner-profile.repository.js";
import type { AssessmentSubmitInput } from "../schemas/assessment.schemas.js";
import {
  OpenAIAssessmentProvider,
  type AssessmentAiProvider,
  type AssessmentQuestion
} from "./assessment-ai.provider.js";

export interface StartedAssessment {
  assessmentId: string;
  questions: AssessmentQuestion[];
}

export interface SubmittedAssessment {
  assessment: Assessment;
  profile: LearnerProfile;
}

export class AssessmentService {
  constructor(
    private readonly assessmentRepository = new AssessmentRepository(),
    private readonly profileRepository = new LearnerProfileRepository(),
    private readonly aiProvider: AssessmentAiProvider = new OpenAIAssessmentProvider()
  ) {}

  async start(userId: string, difficulty: string): Promise<StartedAssessment> {
    const assessment = await this.assessmentRepository.createStarted(userId, "DIAGNOSTIC");
    const questions = await this.aiProvider.generateQuestions(difficulty);

    return {
      assessmentId: assessment.id,
      questions
    };
  }

  async submit(userId: string, input: AssessmentSubmitInput): Promise<SubmittedAssessment> {
    const result = await this.aiProvider.scoreAnswers(input.answers);
    const overallScore = Math.round(
      (result.scores.grammar +
        result.scores.vocabulary +
        result.scores.reading +
        result.scores.listening +
        result.scores.writing +
        result.scores.speaking) /
        6
    );
    const assessment = await this.assessmentRepository.complete(input.assessmentId, userId, {
      grammarScore: result.scores.grammar,
      listeningScore: result.scores.listening,
      readingScore: result.scores.reading,
      score: overallScore,
      speakingScore: result.scores.speaking,
      strengths: result.strengths,
      vocabularyScore: result.scores.vocabulary,
      weaknesses: result.weaknesses,
      writingScore: result.scores.writing
    });
    const profileInference = await this.aiProvider.inferProfile(result);
    const profile = await this.profileRepository.upsert(userId, profileInference);

    return {
      assessment,
      profile
    };
  }
}
