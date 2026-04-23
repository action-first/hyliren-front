import type { ConcernStatus, ConcernSource, BodyArea } from '../constants';

/**
 * AI 상담 대화의 한 턴. concern.feedback_turns JSONB 에 누적 저장된다.
 * DB 스키마 docs/schema/final.sql 의 concerns.feedback_turns 컬럼과 매핑.
 */
export interface ConcernFeedbackTurn {
  role: 'user' | 'ai';
  message: string;
}

export interface Concern {
  id: string;
  userId: string;
  status: ConcernStatus;
  source: ConcernSource;
  /** 복수 부위 지원 — 최소 1개 */
  bodyAreas: BodyArea[];
  /** 대표 부위 (UI 표시용) */
  primaryArea: BodyArea;
  /** @deprecated bodyAreas[0]으로 대체 — 하위 호환용 getter */
  bodyArea: BodyArea;
  bodyAreaDetail: string | null;
  description: string;
  /**
   * 고객 최초 입력 원문 (가공 전 narrative).
   * description 이 AI 정제된 본문이라면 rawNarrative 는 편집 전 그대로.
   * DB: concerns.raw_narrative
   */
  rawNarrative: string | null;
  /**
   * AI 분석 구조화 요약 JSON. StepAIProcessing 결과 전체를 보관.
   * DB: concerns.ai_summary (JSONB)
   */
  aiSummary: Record<string, unknown> | null;
  /**
   * AI 상담 대화 턴 히스토리. StepFeedback 에서 누적된 user/ai 메시지.
   * DB: concerns.feedback_turns (JSONB)
   */
  feedbackTurns: ConcernFeedbackTurn[];
  budgetMin: number | null;
  budgetMax: number | null;
  visitDateFrom: string | null;
  visitDateTo: string | null;
  hasPassport: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ConcernPhoto {
  id: string;
  concernId: string;
  url: string;
  sortOrder: number;
  createdAt: string;
}
