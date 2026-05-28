// BUGFIX: keep ai-engine build isolated from workspace path aliases that pull sibling package source.
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type LearningSkill =
  | "grammar"
  | "vocabulary"
  | "reading"
  | "listening"
  | "writing"
  | "speaking";
