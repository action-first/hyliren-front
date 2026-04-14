/**
 * Mock Data — 실제 시나리오 기반
 *
 * 주의:
 *   - mock는 domain의 소비자이지 core가 아님
 *   - 커지면 packages/mock로 분리 가능하게 작성
 *   - 빈 데이터 금지 — 현실적인 시나리오만
 */

export { MOCK_USERS, MOCK_BUYER_PROFILES } from './users';
export { MOCK_MEMBERS, MOCK_PARTNER_PROFILES } from './members';
export { MOCK_CONCERNS, MOCK_CONCERN_PHOTOS } from './concerns';
export { MOCK_PROPOSALS, MOCK_PROPOSAL_ITEMS } from './proposals';
