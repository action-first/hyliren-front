/* ══════════════════════════════════════
   Concern Analysis — Type Definitions
   ══════════════════════════════════════ */

/** Layer 1: Extract output */
export interface ExtractedTags {
  symptoms: string[];
  preferences: string[];
  budget: string[];
  timing: string[];
}

export interface ExtractedSummary {
  bodyArea?: string;
  bodyAreaDetail?: string;
  desiredOutcome?: string;
  budgetMax?: number | null;
  visitDate?: string | null;
}

export interface ExtractResult {
  tags: ExtractedTags;
  summary: ExtractedSummary;
}

/** Layer 2: Rule engine types */
export interface ProcedureOption {
  key: string;
  name: string;
  bodyArea: string;
  descriptionTemplate: string;
}

export interface ProcedureRule {
  id: string;
  bodyArea: string;
  requiredTags: string[];
  optionalTags: string[];
  excludedTags: string[];
  preferredOptions: string[];
  priority: number;
  rationale: string;
}

export interface MatchedOption {
  key: string;
  name: string;
  description: string;
  score: number;
}

export interface RuleMatchResult {
  bodyArea: string;
  bodyAreaDetail: string;
  matchedOptions: MatchedOption[];
  ruleVersion: string;
}

/** Layer 3: Generation output */
export interface GeneratedGuide {
  empathy: string;
  education: string;
  options: Array<{
    key: string;
    name: string;
    description: string;
  }>;
  disclaimer: string;
}

/** Feedback turn */
export interface FeedbackTurn {
  role: 'user' | 'ai';
  message: string;
}

/** API Request */
export interface AnalysisRequest {
  photos: string[];
  narrative: string;
  feedbackTurns?: FeedbackTurn[];
}

/** API Response */
export interface AnalysisResponse {
  empathy: string;
  education: string;
  options: Array<{
    key: string;
    name: string;
    description: string;
  }>;
  extractedTags: ExtractedTags;
  extractedSummary: ExtractedSummary;
  disclaimer: string;
  ruleVersion: string;
}
