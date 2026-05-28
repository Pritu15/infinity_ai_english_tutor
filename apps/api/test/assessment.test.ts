import type { Assessment, LearnerProfile } from "@prisma/client";
import request from "supertest";
import { createApp } from "../src/app.js";
import type {
  AssessmentAiProvider,
  AssessmentQuestion,
  AssessmentScoreResult
} from "../src/services/assessment-ai.provider.js";
import { AssessmentService } from "../src/services/assessment.service.js";
import { TokenService } from "../src/services/token.service.js";

class InMemoryAssessmentRepository {
  public completedAssessment: Assessment | null = null;
  private readonly assessments = new Map<string, Assessment>();

  async createStarted(userId: string): Promise<Assessment> {
    const assessment: Assessment = {
      completedAt: null,
      grammarScore: 0,
      id: "assessment_1",
      listeningScore: 0,
      readingScore: 0,
      score: 0,
      speakingScore: 0,
      strengths: [],
      type: "DIAGNOSTIC",
      userId,
      vocabularyScore: 0,
      weaknesses: [],
      writingScore: 0
    };

    this.assessments.set(assessment.id, assessment);
    return assessment;
  }

  async complete(id: string, userId: string, input: Omit<Assessment, "completedAt" | "id" | "type" | "userId">) {
    const existing = this.assessments.get(id);

    if (!existing || existing.userId !== userId) {
      throw new Error("Assessment not found");
    }

    const assessment: Assessment = {
      ...existing,
      ...input,
      completedAt: new Date()
    };

    this.completedAssessment = assessment;
    this.assessments.set(id, assessment);
    return assessment;
  }
}

class InMemoryLearnerProfileRepository {
  public profile: LearnerProfile | null = null;

  async upsert(userId: string, input: Omit<LearnerProfile, "userId">): Promise<LearnerProfile> {
    this.profile = {
      ...input,
      userId
    };

    return this.profile;
  }
}

class MockAssessmentAiProvider implements AssessmentAiProvider {
  public readonly scoredAnswers: unknown[] = [];

  async generateQuestions(difficulty: string): Promise<AssessmentQuestion[]> {
    return Array.from({ length: 20 }, (_, index) => ({
      choices: index % 2 === 0 ? ["A", "B", "C", "D"] : undefined,
      difficulty,
      id: `q${index + 1}`,
      prompt: `Question ${index + 1}`,
      skill: ["grammar", "vocabulary", "reading", "writing", "listening", "speaking"][
        index % 6
      ] as AssessmentQuestion["skill"],
      type: index % 2 === 0 ? "mcq" : "short_text"
    }));
  }

  async scoreAnswers(answers: Parameters<AssessmentAiProvider["scoreAnswers"]>[0]) {
    this.scoredAnswers.push(...answers);
    return {
      scores: {
        grammar: 90,
        listening: 55,
        reading: 72,
        speaking: 45,
        vocabulary: 80,
        writing: 62
      },
      strengths: ["grammar", "vocabulary"],
      weaknesses: ["speaking", "listening"]
    } satisfies AssessmentScoreResult;
  }

  async inferProfile() {
    return {
      learningGoal: "Speak confidently in academic interviews",
      learningStyle: "audio-first",
      nativeLanguage: "Bangla",
      preferredSkills: ["speaking", "listening"],
      targetLevel: "B1" as const
    };
  }
}

const bearerToken = () => {
  const tokenService = new TokenService();
  const { accessToken } = tokenService.createTokenPair({
    email: "learner@example.com",
    id: "user_assessment",
    role: "LEARNER"
  });

  return `Bearer ${accessToken}`;
};

describe("assessment flow", () => {
  it("starts a diagnostic assessment and submits mocked AI-scored answers", async () => {
    const assessmentRepository = new InMemoryAssessmentRepository();
    const profileRepository = new InMemoryLearnerProfileRepository();
    const aiProvider = new MockAssessmentAiProvider();
    const assessmentService = new AssessmentService(
      assessmentRepository as never,
      profileRepository as never,
      aiProvider
    );
    const app = createApp({ assessmentService });

    const startResponse = await request(app)
      .post("/assessment/start")
      .set("Authorization", bearerToken())
      .send({ difficulty: "B1" })
      .expect(201);

    expect(startResponse.body.assessmentId).toBe("assessment_1");
    expect(startResponse.body.questions).toHaveLength(20);
    expect(startResponse.body.questions[0]).toMatchObject({
      difficulty: "B1",
      id: "q1",
      skill: "grammar"
    });

    const submitResponse = await request(app)
      .post("/assessment/submit")
      .set("Authorization", bearerToken())
      .send({
        answers: startResponse.body.questions.map((question: AssessmentQuestion) => ({
          answer: "confident answer",
          questionId: question.id,
          skill: question.skill
        })),
        assessmentId: startResponse.body.assessmentId
      })
      .expect(200);

    expect(submitResponse.body.assessment).toMatchObject({
      grammarScore: 90,
      listeningScore: 55,
      score: 67,
      speakingScore: 45,
      strengths: ["grammar", "vocabulary"],
      weaknesses: ["speaking", "listening"]
    });
    expect(submitResponse.body.profile).toMatchObject({
      learningGoal: "Speak confidently in academic interviews",
      learningStyle: "audio-first",
      nativeLanguage: "Bangla",
      preferredSkills: ["speaking", "listening"],
      targetLevel: "B1",
      userId: "user_assessment"
    });
    expect(assessmentRepository.completedAssessment?.completedAt).toBeInstanceOf(Date);
    expect(profileRepository.profile?.targetLevel).toBe("B1");
    expect(aiProvider.scoredAnswers).toHaveLength(20);
  });
});
