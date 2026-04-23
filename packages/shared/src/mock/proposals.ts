import type { Proposal, ProposalItem } from '../types';

export const MOCK_PROPOSALS: Proposal[] = [
  // c-001 (눈, comparing) — 3개 제안서
  {
    id: 'p-001', concernId: 'c-001', memberId: 'm-001',
    version: 1, isActive: true, status: 'shortlisted',
    totalPrice: 180, recoveryDays: 5, anesthesiaType: 'sedation',
    hospitalStayDays: 0, availableDateFrom: '2026-05-05', availableDateTo: '2026-05-12',
    consultationNote: '매몰법으로 자연스러운 라인 가능합니다.',
    qualityScore: 85, isFlagged: false, creditsCharged: 3,
    sentAt: '2026-03-18T10:00:00Z', viewedAt: '2026-03-19T08:00:00Z',
    createdAt: '2026-03-18T09:00:00Z', updatedAt: '2026-03-19T08:00:00Z', deletedAt: null,
  },
  {
    id: 'p-002', concernId: 'c-001', memberId: 'm-003',
    version: 1, isActive: true, status: 'shortlisted',
    totalPrice: 220, recoveryDays: 7, anesthesiaType: 'sedation',
    hospitalStayDays: 0, availableDateFrom: '2026-05-03', availableDateTo: '2026-05-10',
    consultationNote: '절개+매몰 병행으로 오래 유지되는 라인을 추천드립니다.',
    qualityScore: 90, isFlagged: false, creditsCharged: 3,
    sentAt: '2026-03-19T14:00:00Z', viewedAt: '2026-03-20T09:00:00Z',
    createdAt: '2026-03-19T13:00:00Z', updatedAt: '2026-03-20T09:00:00Z', deletedAt: null,
  },
  {
    id: 'p-003', concernId: 'c-001', memberId: 'm-004',
    version: 1, isActive: true, status: 'viewed',
    totalPrice: 150, recoveryDays: 3, anesthesiaType: 'local',
    hospitalStayDays: 0, availableDateFrom: '2026-05-01', availableDateTo: '2026-05-15',
    consultationNote: null,
    qualityScore: 70, isFlagged: false, creditsCharged: 3,
    sentAt: '2026-03-20T11:00:00Z', viewedAt: '2026-03-21T07:00:00Z',
    createdAt: '2026-03-20T10:00:00Z', updatedAt: '2026-03-21T07:00:00Z', deletedAt: null,
  },

  // c-002 (눈+코, submitted) — DB 값 curve coverage 용 2개 제안서 (accepted / expired)
  // 실서비스에서 실제로 발생할 상태지만 FO 내부 mock flow 에서는 거의 만들지 않는 값이라
  // real backend 전환 후 집계·UI 렌더가 이들 케이스에서도 무너지지 않도록 샘플을 유지한다.
  {
    id: 'p-004', concernId: 'c-002', memberId: 'm-002',
    version: 1, isActive: true, status: 'accepted',
    totalPrice: 480, recoveryDays: 10, anesthesiaType: 'general',
    hospitalStayDays: 1, availableDateFrom: '2026-06-05', availableDateTo: '2026-06-20',
    consultationNote: '눈+코 복합으로 자연스러운 인상 개선 제안드립니다.',
    qualityScore: 82, isFlagged: false, creditsCharged: 3,
    sentAt: '2026-04-03T10:00:00Z', viewedAt: '2026-04-04T09:30:00Z',
    createdAt: '2026-04-03T09:00:00Z', updatedAt: '2026-04-04T09:30:00Z', deletedAt: null,
  },
  {
    id: 'p-005', concernId: 'c-002', memberId: 'm-004',
    version: 1, isActive: true, status: 'expired',
    totalPrice: 530, recoveryDays: 12, anesthesiaType: 'general',
    hospitalStayDays: 1, availableDateFrom: '2026-05-25', availableDateTo: '2026-06-05',
    consultationNote: null,
    qualityScore: 68, isFlagged: false, creditsCharged: 3,
    sentAt: '2026-04-02T11:00:00Z', viewedAt: null,
    // 14일 경과 후 자동 만료 처리된 이력을 updatedAt 에 기록.
    createdAt: '2026-04-02T10:00:00Z', updatedAt: '2026-04-16T00:00:00Z', deletedAt: null,
  },

  // c-005 (눈밑, hospital_selected) — 2개 제안서
  {
    id: 'p-006', concernId: 'c-005', memberId: 'm-001',
    version: 1, isActive: true, status: 'selected',
    totalPrice: 250, recoveryDays: 7, anesthesiaType: 'sedation',
    hospitalStayDays: 0, availableDateFrom: '2026-04-22', availableDateTo: '2026-04-28',
    consultationNote: '눈밑지방 재배치 + 눈밑 필러 보조를 추천합니다.',
    qualityScore: 88, isFlagged: false, creditsCharged: 3,
    sentAt: '2026-03-05T10:00:00Z', viewedAt: '2026-03-06T09:00:00Z',
    createdAt: '2026-03-05T09:00:00Z', updatedAt: '2026-04-05T12:00:00Z', deletedAt: null,
  },
  {
    id: 'p-007', concernId: 'c-005', memberId: 'm-003',
    version: 1, isActive: true, status: 'rejected',
    totalPrice: 320, recoveryDays: 10, anesthesiaType: 'general',
    hospitalStayDays: 1, availableDateFrom: '2026-04-25', availableDateTo: '2026-04-30',
    consultationNote: null,
    qualityScore: 75, isFlagged: false, creditsCharged: 3,
    sentAt: '2026-03-06T15:00:00Z', viewedAt: '2026-03-07T08:00:00Z',
    createdAt: '2026-03-06T14:00:00Z', updatedAt: '2026-04-05T12:00:00Z', deletedAt: null,
  },
];

export const MOCK_PROPOSAL_ITEMS: ProposalItem[] = [
  // p-001
  { id: 'pi-001', proposalId: 'p-001', treatmentName: '매몰쌍꺼풀', treatmentNameZh: '埋没双眼皮', price: 150, description: null, sortOrder: 0, createdAt: '2026-03-18T09:00:00Z' },
  { id: 'pi-002', proposalId: 'p-001', treatmentName: '눈꼬리 교정', treatmentNameZh: '眼角矫正', price: 30, description: '선택 사항', sortOrder: 1, createdAt: '2026-03-18T09:00:00Z' },

  // p-002
  { id: 'pi-003', proposalId: 'p-002', treatmentName: '절개+매몰 쌍꺼풀', treatmentNameZh: '切开+埋没双眼皮', price: 200, description: null, sortOrder: 0, createdAt: '2026-03-19T13:00:00Z' },
  { id: 'pi-004', proposalId: 'p-002', treatmentName: '눈매 교정', treatmentNameZh: '眼型矫正', price: 20, description: null, sortOrder: 1, createdAt: '2026-03-19T13:00:00Z' },

  // p-003
  { id: 'pi-005', proposalId: 'p-003', treatmentName: '매몰쌍꺼풀', treatmentNameZh: '埋没双眼皮', price: 150, description: null, sortOrder: 0, createdAt: '2026-03-20T10:00:00Z' },

  // p-004 (accepted 케이스 샘플)
  { id: 'pi-006', proposalId: 'p-004', treatmentName: '매몰쌍꺼풀', treatmentNameZh: '埋没双眼皮', price: 180, description: null, sortOrder: 0, createdAt: '2026-04-03T09:00:00Z' },
  { id: 'pi-007', proposalId: 'p-004', treatmentName: '코끝 성형', treatmentNameZh: '鼻尖整形', price: 300, description: null, sortOrder: 1, createdAt: '2026-04-03T09:00:00Z' },

  // p-005 (expired 케이스 샘플)
  { id: 'pi-008', proposalId: 'p-005', treatmentName: '쌍꺼풀 절개술', treatmentNameZh: '切开双眼皮', price: 230, description: null, sortOrder: 0, createdAt: '2026-04-02T10:00:00Z' },
  { id: 'pi-009', proposalId: 'p-005', treatmentName: '코 전체 성형', treatmentNameZh: '鼻整形', price: 300, description: null, sortOrder: 1, createdAt: '2026-04-02T10:00:00Z' },

  // p-006
  { id: 'pi-010', proposalId: 'p-006', treatmentName: '눈밑지방 재배치', treatmentNameZh: '下眼脂肪重新分配', price: 200, description: null, sortOrder: 0, createdAt: '2026-03-05T09:00:00Z' },
  { id: 'pi-011', proposalId: 'p-006', treatmentName: '눈밑 필러', treatmentNameZh: '下眼填充', price: 50, description: '보조 시술', sortOrder: 1, createdAt: '2026-03-05T09:00:00Z' },

  // p-007
  { id: 'pi-012', proposalId: 'p-007', treatmentName: '하안검 수술', treatmentNameZh: '下眼睑手术', price: 320, description: null, sortOrder: 0, createdAt: '2026-03-06T14:00:00Z' },
];
