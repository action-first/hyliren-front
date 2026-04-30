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

/**
 * i18n key + params 직렬화 — BE/mock 이 한국어 raw 대신 키만 반환하면 FE 가 t() 로
 * viewerLocale 기준으로 번역. "BE 는 번역 안 함, FE 판별" 정책 일치.
 */
export interface I18nMessage {
  key: string;
  params?: Record<string, string | number>;
}

/** Layer 3: Generation output */
export interface GeneratedGuide {
  empathy: I18nMessage;
  education: I18nMessage;
  options: Array<{
    key: string;
    name: string;
    description: string;
    bodyArea: string;
  }>;
  disclaimer: I18nMessage;
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

/** API Response — empathy/education/disclaimer 는 i18n key 형태로 반환 (FE 가 t() 호출). */
export interface AnalysisResponse {
  empathy: I18nMessage;
  education: I18nMessage;
  options: Array<{
    key: string;
    name: string;
    description: string;
    bodyArea: string;
  }>;
  extractedTags: ExtractedTags;
  extractedSummary: ExtractedSummary;
  disclaimer: I18nMessage;
  ruleVersion: string;
}
