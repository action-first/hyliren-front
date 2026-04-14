import type { ProcedureRule } from '../concern-analysis/types';

/**
 * Procedure Rules — tag → option mapping
 * Deterministic, version controlled, A/B testable
 *
 * Matching logic:
 * 1. requiredTags 모두 충족해야 후보
 * 2. optionalTags 일치 시 가산점 (+10 per tag)
 * 3. excludedTags 일치 시 제외
 * 4. priority로 기본 점수 설정
 */
export const PROCEDURE_RULES: ProcedureRule[] = [
  /* ══ 눈 ══ */
  {
    id: 'eye_01',
    bodyArea: '눈',
    requiredTags: ['눈꺼풀_처짐'],
    optionalTags: ['인상_강함', '자연스러움_선호', '빠른회복_선호'],
    excludedTags: [],
    preferredOptions: ['eye_non_incisional_ptosis', 'forehead_lift'],
    priority: 90,
    rationale: '눈 뜨는 힘과 인상 개선을 함께 고려하는 조합',
  },
  {
    id: 'eye_02',
    bodyArea: '눈',
    requiredTags: ['쌍꺼풀_희망'],
    optionalTags: ['자연스러움_선호', '빠른회복_선호'],
    excludedTags: [],
    preferredOptions: ['eye_buried_suture', 'eye_partial_incision'],
    priority: 85,
    rationale: '자연스러운 쌍꺼풀 라인 형성',
  },
  {
    id: 'eye_03',
    bodyArea: '눈',
    requiredTags: ['쌍꺼풀_희망'],
    optionalTags: ['확실한변화_선호'],
    excludedTags: ['비절개_선호'],
    preferredOptions: ['eye_full_incision', 'eye_partial_incision'],
    priority: 75,
    rationale: '뚜렷한 라인과 높은 유지력',
  },
  {
    id: 'eye_04',
    bodyArea: '눈',
    requiredTags: ['눈밑_문제'],
    optionalTags: ['자연스러움_선호'],
    excludedTags: [],
    preferredOptions: ['under_eye_fat_repositioning', 'lower_blepharoplasty'],
    priority: 85,
    rationale: '눈밑 지방/다크서클 개선',
  },

  /* ══ 코 ══ */
  {
    id: 'nose_01',
    bodyArea: '코',
    requiredTags: ['코끝_둥금'],
    optionalTags: ['자연스러움_선호'],
    excludedTags: [],
    preferredOptions: ['nose_tip', 'nose_autologous_cartilage'],
    priority: 85,
    rationale: '코끝 모양 개선 중심',
  },
  {
    id: 'nose_02',
    bodyArea: '코',
    requiredTags: ['코_낮음'],
    optionalTags: ['자연스러움_선호'],
    excludedTags: [],
    preferredOptions: ['nose_autologous_cartilage', 'nose_bridge_implant'],
    priority: 80,
    rationale: '콧대 높이 개선 중심',
  },
  {
    id: 'nose_03',
    bodyArea: '코',
    requiredTags: ['코_고민'],
    optionalTags: [],
    excludedTags: [],
    preferredOptions: ['nose_tip', 'nose_autologous_cartilage'],
    priority: 70,
    rationale: '코 종합 상담',
  },

  /* ══ 리프팅 ══ */
  {
    id: 'lift_01',
    bodyArea: '리프팅',
    requiredTags: ['주름_깊음'],
    optionalTags: ['빠른회복_선호', '자연스러움_선호'],
    excludedTags: [],
    preferredOptions: ['thread_lift', 'ulthera'],
    priority: 85,
    rationale: '비절개 리프팅으로 주름 개선',
  },
  {
    id: 'lift_02',
    bodyArea: '리프팅',
    requiredTags: ['노화_고민'],
    optionalTags: ['빠른회복_선호'],
    excludedTags: [],
    preferredOptions: ['thread_lift', 'ulthera', 'hifu'],
    priority: 80,
    rationale: '전반적 안티에이징',
  },
  {
    id: 'lift_03',
    bodyArea: '리프팅',
    requiredTags: ['안면윤곽_고민'],
    optionalTags: [],
    excludedTags: ['비절개_선호'],
    preferredOptions: ['facial_contouring', 'thread_lift'],
    priority: 75,
    rationale: '얼굴 라인 교정',
  },

  /* ══ 피부 ══ */
  {
    id: 'skin_01',
    bodyArea: '피부',
    requiredTags: ['피부_문제'],
    optionalTags: ['빠른회복_선호'],
    excludedTags: [],
    preferredOptions: ['laser_toning', 'fraxel'],
    priority: 80,
    rationale: '피부톤/흉터/모공 개선',
  },

  /* ══ 다이어트 ══ */
  {
    id: 'diet_01',
    bodyArea: '다이어트',
    requiredTags: ['지방_고민'],
    optionalTags: [],
    excludedTags: [],
    preferredOptions: ['liposuction'],
    priority: 75,
    rationale: '지방 고민 해결',
  },
];
