import {
  CurriculumGenerator,
  DifficultyAdjuster,
  ProfilingService,
  WeaknessDetector,
  type CurriculumLlm,
  type CurriculumRepository,
  type GeneratedLessonPlan
} from "../src/index.js";

describe("DifficultyAdjuster", () => {
  it("calculates SM-2 intervals with known quality inputs", () => {
    const adjuster = new DifficultyAdjuster();
    const reviewedAt = new Date("2026-05-28T00:00:00.000Z");

    const first = adjuster.calculateSm2(
      { valueOf: () => 5 } as unknown as number,
      {
        easinessFactor: 2.5,
        intervalDays: 0,
        repetitions: 0
      },
      reviewedAt
    );

    expect(first).toMatchObject({
      easinessFactor: 2.6,
      intervalDays: 1,
      repetitions: 1
    });
    expect(first.nextReviewAt.toISOString()).toBe("2026-05-29T00:00:00.000Z");

    const second = adjuster.calculateSm2(5, first, reviewedAt);

    expect(second).toMatchObject({
      easinessFactor: 2.7,
      intervalDays: 6,
      repetitions: 2
    });
  });
});

describe("WeaknessDetector", () => {
  it("flags skills where the latest submissions average below threshold", () => {
    const detector = new WeaknessDetector();
    const now = new Date("2026-05-28T00:00:00.000Z");
    const weaknesses = detector.detect([
      { score: 45, skill: "speaking", submittedAt: now },
      { score: 55, skill: "speaking", submittedAt: new Date("2026-05-27T00:00:00.000Z") },
      { score: 90, skill: "grammar", submittedAt: now },
      { score: 80, skill: "grammar", submittedAt: new Date("2026-05-27T00:00:00.000Z") }
    ]);

    expect(weaknesses).toEqual(["speaking"]);
  });
});

describe("ProfilingService", () => {
  it("maps assessment scores to CEFR levels", () => {
    const profiling = new ProfilingService();

    expect(
      profiling.mapAssessmentScoresToCefr({
        grammar: 82,
        listening: 80,
        reading: 84,
        speaking: 79,
        vocabulary: 81,
        writing: 80
      })
    ).toBe("C1");
  });
});

describe("CurriculumGenerator", () => {
  it("generates and stores a four-week curriculum with a mocked LLM", async () => {
    const plans: GeneratedLessonPlan[] = [1, 2, 3, 4].map((weekNumber) => ({
      generatedBy: "gpt-4o",
      lessons: [
        {
          contentJson: { markdown: "Practice present perfect in interview answers." },
          difficulty: "B1",
          estimatedMinutes: 25,
          exercises: [
            {
              expectedAnswer: "I have studied English for three years.",
              maxScore: 10,
              prompt: "Write a present perfect sentence.",
              rubric: { grammar: 10 },
              type: "SHORT_ANSWER"
            }
          ],
          skill: "grammar",
          title: `Week ${weekNumber} grammar`
        }
      ],
      skillFocus: ["grammar", "speaking"],
      weekNumber
    }));
    const llm: CurriculumLlm = {
      generateLessonPlan: jest.fn().mockResolvedValue(plans)
    };
    const repository: CurriculumRepository = {
      saveFourWeekPlan: jest.fn().mockResolvedValue(plans)
    };
    const generator = new CurriculumGenerator(llm, repository);

    const result = await generator.generate({
      learningGoal: "IELTS speaking",
      learningStyle: "adaptive-practice",
      nativeLanguage: "Bangla",
      preferredSkills: ["speaking", "grammar"],
      targetLevel: "B1",
      userId: "user_1"
    });

    expect(result).toHaveLength(4);
    expect(llm.generateLessonPlan).toHaveBeenCalledTimes(1);
    expect(repository.saveFourWeekPlan).toHaveBeenCalledWith("user_1", plans);
  });
});
