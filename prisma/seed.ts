import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const buildEmbeddingLiteral = (): string =>
  `[${Array.from({ length: 1536 }, () => "0").join(",")}]`;

async function main() {
  const seededEmail = "learner.seed@example.com";

  await prisma.user.deleteMany({
    where: {
      email: seededEmail
    }
  });

  const user = await prisma.user.create({
    data: {
      email: seededEmail,
      passwordHash: "$2b$12$8Gv5xcmSEEDedPasswordHashbXwHE7EJ9dHQkRAVDZsPRt0W",
      role: "LEARNER",
      learnerProfile: {
        create: {
          learningGoal: "Improve IELTS speaking and academic writing",
          learningStyle: "structured",
          nativeLanguage: "Bengali",
          preferredSkills: ["speaking", "writing", "grammar"],
          targetLevel: "B2"
        }
      },
      vocabularyItems: {
        create: [
          {
            definition: "Clear and easy to understand",
            exampleSentence: "Her explanation was lucid and practical.",
            masteryLevel: 2,
            nextReviewAt: new Date(),
            word: "lucid"
          }
        ]
      }
    }
  });

  const assessment = await prisma.assessment.create({
    data: {
      completedAt: new Date(),
      grammarScore: 72,
      listeningScore: 68,
      readingScore: 75,
      score: 70,
      speakingScore: 62,
      strengths: ["reading", "vocabulary"],
      type: "DIAGNOSTIC",
      userId: user.id,
      vocabularyScore: 74,
      weaknesses: ["speaking", "listening"],
      writingScore: 69
    }
  });

  const plan = await prisma.lessonPlan.create({
    data: {
      generatedBy: "seed",
      skillFocus: ["speaking", "grammar"],
      status: "ACTIVE",
      userId: user.id,
      weekNumber: 1
    }
  });

  const lesson = await prisma.lesson.create({
    data: {
      contentJson: {
        blocks: [
          {
            text: "Use the present perfect to connect past experiences with present relevance.",
            type: "paragraph"
          }
        ]
      },
      difficulty: "B1",
      estimatedMinutes: 25,
      planId: plan.id,
      skill: "GRAMMAR",
      title: "Present Perfect for Real Experience",
      exercises: {
        create: [
          {
            expectedAnswer: "I have lived here for three years.",
            maxScore: 10,
            prompt: "Correct this sentence: I live here since three years.",
            rubric: {
              grammar: 6,
              explanation: 4
            },
            type: "GRAMMAR_CORRECTION"
          }
        ]
      }
    },
    include: {
      exercises: true
    }
  });

  const exercise = lesson.exercises[0];

  if (!exercise) {
    throw new Error("Seed exercise was not created.");
  }

  await prisma.submission.create({
    data: {
      aiFeedback: {
        correctedText: "I have lived here for three years.",
        explanation: "Use present perfect with for/since."
      },
      exerciseId: exercise.id,
      response: "I have lived here for three years.",
      score: 9,
      userId: user.id
    }
  });

  await prisma.conversationSession.create({
    data: {
      messagesJson: [
        {
          content: "How can I improve my speaking fluency?",
          role: "user"
        },
        {
          content: "Practice short daily responses and focus on linking words.",
          role: "assistant"
        }
      ],
      mode: "SPEAKING_PRACTICE",
      userId: user.id
    }
  });

  await prisma.progressSnapshot.create({
    data: {
      date: new Date("2026-05-28T00:00:00.000Z"),
      overallScore: assessment.score,
      skillScores: {
        grammar: assessment.grammarScore,
        listening: assessment.listeningScore,
        reading: assessment.readingScore,
        speaking: assessment.speakingScore,
        vocabulary: assessment.vocabularyScore,
        writing: assessment.writingScore
      },
      streakDays: 3,
      userId: user.id
    }
  });

  await prisma.notification.create({
    data: {
      message: "Your diagnostic assessment is complete.",
      type: "ASSESSMENT_COMPLETE",
      userId: user.id
    }
  });

  await prisma.$executeRawUnsafe(
    `INSERT INTO "LessonEmbedding" ("id", "lessonId", "embedding") VALUES ($1, $2, $3::vector)`,
    "seed_lesson_embedding",
    lesson.id,
    buildEmbeddingLiteral()
  );

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.learnerProfile.count(),
    prisma.assessment.count(),
    prisma.lessonPlan.count(),
    prisma.lesson.count(),
    prisma.exercise.count(),
    prisma.submission.count(),
    prisma.conversationSession.count(),
    prisma.vocabularyItem.count(),
    prisma.progressSnapshot.count(),
    prisma.notification.count(),
    prisma.lessonEmbedding.count()
  ]);

  if (counts.some((count) => count < 1)) {
    throw new Error(`Seed verification failed: ${counts.join(", ")}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
