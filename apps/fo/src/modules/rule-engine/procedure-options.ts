import type { ProcedureOption } from '../concern-analysis/types';

/**
 * Procedure Option Catalog
 * 모든 시술 옵션의 마스터 목록
 * 병원명/의사명 금지 — 일반 시술 정보만
 */
export const PROCEDURE_OPTIONS: ProcedureOption[] = [
  /* ── 눈 ── */
  {
    key: 'eye_non_incisional_ptosis',
    name: '비절개 눈매교정',
    bodyArea: '눈',
    descriptionTemplate: '눈 뜨는 힘을 자연스럽게 보완하여 부드러운 눈매를 만드는 접근입니다. 절개 없이 진행되어 회복이 비교적 빠릅니다.',
  },
  {
    key: 'forehead_lift',
    name: '이마 거상술',
    bodyArea: '눈',
    descriptionTemplate: '이마 라인을 올려 눈매를 자연스럽게 개선하는 접근으로, 이마 주름 개선 효과도 함께 기대할 수 있습니다.',
  },
  {
    key: 'eye_buried_suture',
    name: '매몰 쌍꺼풀',
    bodyArea: '눈',
    descriptionTemplate: '절개 없이 실로 라인을 만드는 방식으로, 회복이 빠르고 자연스러운 결과를 기대할 수 있습니다.',
  },
  {
    key: 'eye_partial_incision',
    name: '부분절개',
    bodyArea: '눈',
    descriptionTemplate: '매몰과 절개의 장점을 결합한 방식으로, 적당한 라인의 뚜렷함과 유지력을 제공합니다.',
  },
  {
    key: 'eye_full_incision',
    name: '절개 쌍꺼풀',
    bodyArea: '눈',
    descriptionTemplate: '보다 뚜렷하고 오래 유지되는 라인을 만드는 방식입니다. 피부 두께가 두꺼운 경우 일반적으로 고려됩니다.',
  },
  {
    key: 'under_eye_fat_repositioning',
    name: '눈밑지방 재배치',
    bodyArea: '눈',
    descriptionTemplate: '눈밑 지방을 제거하지 않고 고르게 펴서 다크서클과 꺼짐을 동시에 개선하는 접근입니다.',
  },
  {
    key: 'lower_blepharoplasty',
    name: '하안검',
    bodyArea: '눈',
    descriptionTemplate: '눈밑 피부와 지방을 함께 정리하여 맑고 젊은 인상을 기대할 수 있는 접근입니다.',
  },

  /* ── 코 ── */
  {
    key: 'nose_tip',
    name: '코끝 성형',
    bodyArea: '코',
    descriptionTemplate: '코끝의 모양과 높이를 자연스럽게 조절하는 접근입니다. 전체 코 밸런스에 큰 영향을 줍니다.',
  },
  {
    key: 'nose_autologous_cartilage',
    name: '자가연골 코성형',
    bodyArea: '코',
    descriptionTemplate: '본인의 연골을 활용하여 이물감 없이 자연스러운 코 라인을 만드는 접근입니다.',
  },
  {
    key: 'nose_bridge_implant',
    name: '콧대 보형물',
    bodyArea: '코',
    descriptionTemplate: '실리콘이나 고어텍스를 활용하여 콧대를 높이는 방식으로, 일반적으로 많이 사용됩니다.',
  },

  /* ── 리프팅 ── */
  {
    key: 'thread_lift',
    name: '실리프팅',
    bodyArea: '리프팅',
    descriptionTemplate: '특수 실을 삽입하여 피부를 당기고 콜라겐 생성을 촉진하는 비절개 리프팅입니다. 회복이 빠른 편입니다.',
  },
  {
    key: 'ulthera',
    name: '울쎄라',
    bodyArea: '리프팅',
    descriptionTemplate: '초음파를 이용한 비침습 리프팅으로, 피부 깊은 층의 탄력 개선을 기대할 수 있습니다.',
  },
  {
    key: 'hifu',
    name: 'HIFU',
    bodyArea: '리프팅',
    descriptionTemplate: '고강도 초음파로 피부 탄력을 높이는 비수술 리프팅 옵션입니다.',
  },
  {
    key: 'facial_contouring',
    name: '안면윤곽',
    bodyArea: '리프팅',
    descriptionTemplate: '얼굴 뼈 구조를 조정하여 전체적인 얼굴 라인을 다듬는 수술입니다. 충분한 상담이 필요합니다.',
  },

  /* ── 피부 ── */
  {
    key: 'laser_toning',
    name: '레이저 토닝',
    bodyArea: '피부',
    descriptionTemplate: '피부톤을 고르게 하고 색소침착을 개선하는 레이저 시술입니다.',
  },
  {
    key: 'fraxel',
    name: '프락셀',
    bodyArea: '피부',
    descriptionTemplate: '미세 레이저로 피부 재생을 촉진하여 흉터와 모공 개선을 기대할 수 있습니다.',
  },

  /* ── 다이어트 ── */
  {
    key: 'liposuction',
    name: '지방흡입',
    bodyArea: '다이어트',
    descriptionTemplate: '원하는 부위의 지방을 직접 제거하는 방식입니다. 부위와 양에 따라 접근이 달라집니다.',
  },
];

/** Lookup helper */
export function getOptionByKey(key: string): ProcedureOption | undefined {
  return PROCEDURE_OPTIONS.find(o => o.key === key);
}
