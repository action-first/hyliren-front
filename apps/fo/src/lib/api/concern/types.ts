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

/**
 * Backend `CreateConcernRequestDto` 와 1:1 매칭. 추가 필드를 보내면
 * `whitelist:true` 정책으로 400. AI 분석 데이터(rawNarrative/aiSummary/
 * feedbackTurns)는 별도 endpoint(`requestAIAnalysis`, `submitAIAnalysisFeedback`)
 * 로 보낸다.
 *
 * 백로그 (backend 한계 — jyjung 의 API 그대로 사용):
 * - createConcern 시점에 rawNarrative 보존을 위해서는 backend DTO 확장이
 *   필요 (현재는 description 만 entity 에 저장). 여기서는 안 보내고 FE
 *   client state 로만 유지.
 */
export interface CreateConcernBody {
  description: string;
  areas?: string[];
  detail?: string;
  budgetMin?: number;
  budgetMax?: number;
  visitDateFrom?: string;
  visitDateTo?: string;
  photos?: string[];
  source?: string;
}

export interface AIAnalysisFeedbackBody {
  /** Backend `AIAnalysisFeedbackRequestDto.message` 와 매칭. role/timestamp 는 server-side 로 생성됨. */
  message: string;
}

/**
 * Backend `AIAnalysisResponseDto` 와 매칭. `getAIAnalysis` 응답.
 * 현재 backend `requestAIAnalysis` / `submitAIAnalysisFeedback` 가 LLM 미통합
 * placeholder 라 이 응답이 채워지지 않음 — getAIAnalysis 호출은 백엔드 LLM
 * 통합 이후 활용 예정 (백로그).
 */
export interface AIAnalysisWire {
  id: string;
  concernId: string;
  aiMessage: string;
  summaryArea: string;
  summaryDetail: string;
  summaryDirection: string;
  summaryBudget: number | null;
  summaryVisitDate: string | null;
  suggestedProcedures: { name: string; description: string }[];
  tags: string[];
  version: number;
  createdAt: string;
}

export interface UpdateConcernBody {
  description?: string;
  budgetMin?: number;
  budgetMax?: number;
  visitDateFrom?: string;
  visitDateTo?: string;
}
