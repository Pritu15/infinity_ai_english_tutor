export interface SpeechAnalysis {
  transcript: string;
  confidence: number;
}

export const normalizeTranscript = (transcript: string): string =>
  transcript.trim().replace(/\s+/g, " ");
