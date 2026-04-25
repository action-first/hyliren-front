/** 백엔드 wire shape — 필드명은 API 응답 그대로 */

/**
 * AI 상담 대화 한 턴. DB concerns.feedback_turns (JSONB) 의 배열 요소.
 */
export interface ConcernFeedbackTurnWire {
  role: 'user' | 'ai';
  message: string;
}

export interface ConcernWire {
  id: string;
  userId: string;
  status: string;
  source: string;
  description: string;
  /**
   * 고객 최초 입력 원문 (description 이 AI 정제본이면 이 필드가 원본).
   * DB: concerns.raw_narrative
   */
  rawNarrative: string | null;
  primaryArea: string;
  bodyAreas: string[];
  bodyAreaDetail: string | null;
  hasPassport: boolean;
  aiSummary: Record<string, unknown> | null;
  /**
   * AI 상담 대화 턴 히스토리. DB: concerns.feedback_turns
   */
  feedbackTurns: ConcernFeedbackTurnWire[];
  budgetMin: number | null;
  budgetMax: number | null;
  visitDateFrom: string | null;
  visitDateTo: string | null;
  proposalCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  photos: ConcernPhotoWire[];
  selectedHospital: {
    id: string;
    proposalId: string;
    selectedAt: string;
  } | null;
}

export interface ConcernListItemWire {
  id: string;
  status: string;
  source: string;
  description: string;
  primaryArea: string;
  bodyAreas: string[];
  bodyAreaDetail: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  visitDateFrom: string | null;
  visitDateTo: string | null;
  proposalCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConcernListWire {
  concerns: ConcernListItemWire[];
  total: number;
  page: number;
  limit: number;
}

export interface ConcernPhotoWire {
  id: string;
  url: string;
  sortOrder: number;
}

export interface CreateConcernBody {
  description: string;
  /**
   * 고객 최초 입력 원문. description 이 AI 로 정제·요약된 버전이면
   * rawNarrative 는 편집 전 원본을 보존 (DB concerns.raw_narrative).
   * 누락 시 서버는 description 값을 그대로 raw_narrative 로 복사 or null 저장.
   */
  rawNarrative?: string;
  areas?: string[];
  detail?: string;
  budgetMin?: number;
  budgetMax?: number;
  visitDateFrom?: string;
  visitDateTo?: string;
  photos?: string[];
  source?: string;
  /**
   * AI 분석 결과 전체 JSON. StepAIProcessing → StepAIReview → StepConfirm
   * 흐름에서 생성된 analysisResult 를 그대로 포함 (DB concerns.ai_summary).
   */
  aiSummary?: Record<string, unknown>;
  /**
   * 사용자가 StepFeedback 에서 추가한 AI 대화 턴.
   * DB concerns.feedback_turns 에 JSONB 배열로 저장.
   */
  feedbackTurns?: ConcernFeedbackTurnWire[];
}

export interface UpdateConcernBody {
  description?: string;
  budgetMin?: number;
  budgetMax?: number;
  visitDateFrom?: string;
  visitDateTo?: string;
}
