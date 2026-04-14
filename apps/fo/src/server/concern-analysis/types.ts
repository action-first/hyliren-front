/* ══════════════════════════════════════
   Concern Analysis — Type Definitions
   Multi-area concern support
   ══════════════════════════════════════ */

/** Layer 1: Extract output */
export interface ExtractedTags {
  symptoms: string[];
  preferences: string[];
  budget: string[];
  timing: string[];
}

export interface ExtractedSummary {
  /** 복수 부위 */
  bodyAreas: string[];
  /** 대표 부위 (UI용) */
  primaryArea: string;
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
  bodyArea: string;
}

export interface RuleMatchResult {
  /** 복수 부위 */
  bodyAreas: string[];
  primaryArea: string;
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
    bodyArea: string;
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
    bodyArea: string;
  }>;
  extractedTags: ExtractedTags;
  extractedSummary: ExtractedSummary;
  disclaimer: string;
  ruleVersion: string;
}
