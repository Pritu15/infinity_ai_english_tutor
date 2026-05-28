import { environment } from "../config/environment.js";
import type { AssessmentAnswerInput } from "../schemas/assessment.schemas.js";

export type AssessmentQuestionType = "mcq" | "short_text" | "writing_prompt";
export type AssessmentSkill =
  | "grammar"
  | "vocabulary"
  | "reading"
  | "listening"
  | "writing"
  | "speaking";

export interface AssessmentQuestion {
  choices?: string[];
  difficulty: string;
  id: string;
  prompt: string;
  skill: AssessmentSkill;
  type: AssessmentQuestionType;
}

export interface AssessmentScores {
  grammar: number;
  listening: number;
  reading: number;
  speaking: number;
  vocabulary: number;
  writing: number;
}

export interface ProfileInference {
  learningGoal: string;
  learningStyle: string;
  nativeLanguage: string;
  preferredSkills: string[];
  targetLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
}

export interface AssessmentScoreResult {
  scores: AssessmentScores;
  strengths: string[];
  weaknesses: string[];
}

export interface AssessmentAiProvider {
  generateQuestions(difficulty: string): Promise<AssessmentQuestion[]>;
  inferProfile(result: AssessmentScoreResult): Promise<ProfileInference>;
  scoreAnswers(answers: AssessmentAnswerInput[]): Promise<AssessmentScoreResult>;
}

const skillCycle: AssessmentSkill[] = [
  "grammar",
  "vocabulary",
  "reading",
  "writing",
  "listening",
  "speaking"
];

export class OpenAIAssessmentProvider implements AssessmentAiProvider {
  async generateQuestions(difficulty: string): Promise<AssessmentQuestion[]> {
    if (!environment.openAiApiKey) {
      return this.generateDeterministicQuestions(difficulty);
    }

    const content = await this.callOpenAi([
      {
        content:
          "Generate exactly 20 adaptive English assessment questions as JSON array. Include id, skill, type, prompt, difficulty, and choices for mcq.",
        role: "system"
      },
      {
        content: `Target difficulty: ${difficulty}. Cover grammar, vocabulary, reading comprehension, listening, writing, and speaking.`,
        role: "user"
      }
    ]);

    return JSON.parse(content) as AssessmentQuestion[];
  }

  async scoreAnswers(answers: AssessmentAnswerInput[]): Promise<AssessmentScoreResult> {
    if (!environment.openAiApiKey) {
      return this.scoreDeterministically(answers);
    }

    const content = await this.callOpenAi([
      {
        content:
          "Score this English diagnostic test. Return JSON with scores {grammar,vocabulary,reading,listening,writing,speaking}, weaknesses[], strengths[]. Scores are 0-100.",
        role: "system"
      },
      {
        content: JSON.stringify(answers),
        role: "user"
      }
    ]);

    return JSON.parse(content) as AssessmentScoreResult;
  }

  async inferProfile(result: AssessmentScoreResult): Promise<ProfileInference> {
    const average =
      Object.values(result.scores).reduce((total, score) => total + score, 0) /
      Object.values(result.scores).length;

    return {
      learningGoal: result.weaknesses.includes("speaking")
        ? "Build confident spoken English for study and work"
        : "Improve balanced English fluency",
      learningStyle: result.weaknesses.includes("listening") ? "audio-first" : "adaptive-practice",
      nativeLanguage: "unknown",
      preferredSkills: result.weaknesses.length > 0 ? result.weaknesses : ["grammar", "speaking"],
      targetLevel: average >= 85 ? "C1" : average >= 75 ? "B2" : average >= 60 ? "B1" : "A2"
    };
  }

  private async callOpenAi(messages: Array<{ content: string; role: "system" | "user" }>): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      body: JSON.stringify({
        messages,
        model: "gpt-4o",
        response_format: { type: "json_object" },
        temperature: 0.2
      }),
      headers: {
        Authorization: `Bearer ${environment.openAiApiKey}`,
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    if (!response.ok) {
      throw new Error(`OpenAI assessment request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI assessment response did not include content");
    }

    return content;
  }

  private generateDeterministicQuestions(difficulty: string): AssessmentQuestion[] {
    return Array.from({ length: 20 }, (_, index) => {
      const skill = skillCycle[index % skillCycle.length] as AssessmentSkill;
      return {
        choices:
          index % 3 === 0
            ? ["A precise answer", "A partially correct answer", "An unrelated answer", "I am not sure"]
            : undefined,
        difficulty,
        id: `diagnostic-${index + 1}`,
        prompt: `Answer this ${skill} question at ${difficulty} level: item ${index + 1}.`,
        skill,
        type: index % 3 === 0 ? "mcq" : index % 3 === 1 ? "short_text" : "writing_prompt"
      };
    });
  }

  private scoreDeterministically(answers: AssessmentAnswerInput[]): AssessmentScoreResult {
    const grouped = new Map<AssessmentSkill, number[]>();

    for (const answer of answers) {
      const score = Math.min(100, Math.max(20, answer.answer.trim().length * 5));
      grouped.set(answer.skill, [...(grouped.get(answer.skill) ?? []), score]);
    }

    const scores = skillCycle.reduce((accumulator, skill) => {
      const values = grouped.get(skill) ?? [0];
      accumulator[skill] = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
      return accumulator;
    }, {} as AssessmentScores);
    const weaknesses = Object.entries(scores)
      .filter(([, score]) => score < 60)
      .map(([skill]) => skill);
    const strengths = Object.entries(scores)
      .filter(([, score]) => score >= 75)
      .map(([skill]) => skill);

    return { scores, strengths, weaknesses };
  }
}
