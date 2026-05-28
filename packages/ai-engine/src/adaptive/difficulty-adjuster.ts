export interface Sm2State {
  easinessFactor: number;
  intervalDays: number;
  repetitions: number;
}

export interface Sm2Result extends Sm2State {
  nextReviewAt: Date;
}

const DAY_MS = 86_400_000;

export class DifficultyAdjuster {
  calculateSm2(quality: number, previous: Sm2State, reviewedAt = new Date()): Sm2Result {
    const normalizedQuality = Math.min(5, Math.max(0, Math.round(quality)));
    let repetitions = previous.repetitions;
    let intervalDays = previous.intervalDays;
    let easinessFactor =
      previous.easinessFactor +
      (0.1 - (5 - normalizedQuality) * (0.08 + (5 - normalizedQuality) * 0.02));

    easinessFactor = Math.max(1.3, Number(easinessFactor.toFixed(2)));

    if (normalizedQuality < 3) {
      repetitions = 0;
      intervalDays = 1;
    } else {
      repetitions += 1;
      if (repetitions === 1) {
        intervalDays = 1;
      } else if (repetitions === 2) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round(previous.intervalDays * easinessFactor);
      }
    }

    return {
      easinessFactor,
      intervalDays,
      nextReviewAt: new Date(reviewedAt.getTime() + intervalDays * DAY_MS),
      repetitions
    };
  }

  nextDifficulty(currentDifficulty: number, submissionScore: number): number {
    if (submissionScore >= 85) return Math.min(6, currentDifficulty + 1);
    if (submissionScore < 55) return Math.max(1, currentDifficulty - 1);
    return currentDifficulty;
  }
}
