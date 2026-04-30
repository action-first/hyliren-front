import type {
  Procedure, ProcedureVariant, ProcedureBookmark,
} from '../types';

/**
 * Mock 시술 상품 — 10 개 상품 × 총 16 variants.
 * 광고 주체: MOCK_MEMBERS 의 실 memberId 만.
 * sourceLocale 은 전부 'ko', i18n 에 ko + zh-CN 두 개 키 포함.
 * ja·en 은 서비스 확장 시 추가 — 현재는 ko fallback.
 */

const IMG_EYE = 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1200&h=800&fit=crop';
const IMG_NOSE = 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1200&h=800&fit=crop';
const IMG_LIFT = 'https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=1200&h=800&fit=crop';
const IMG_SKIN = 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=1200&h=800&fit=crop';
const IMG_DIET = 'https://images.unsplash.com/photo-1550831107-1553da8c8464?w=1200&h=800&fit=crop';
const IMG_CLINIC = 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=1200&h=800&fit=crop';

export const MOCK_PROCEDURES: Procedure[] = [
  {
    id: 'proc-001',
    memberId: 'm-001',
    slug: 'double-eyelid-gangnam-eye',
    primaryArea: 'eyes',
    procedureType: 'eye_double_eyelid',
    heroImageUrl: IMG_EYE,
    galleryImageUrls: [IMG_EYE, IMG_CLINIC],
    priceMin: 1500000, priceMax: 2500000, currency: 'KRW',
    basePrice: 1500000,
    baseAnesthesia: 'local',
    baseDurationMinutes: 30,
    baseRecoveryDays: 7,
    baseHospitalStayDays: 0,
    status: 'published',
    sourceLocale: 'ko',
    viewCount: 1842, bookmarkCount: 124, consultClickCount: 89,
    i18n: {
      'ko': {
        title: '쌍꺼풀 수술',
        description: '매몰법·부분절개·절개법 중 개인의 눈꺼풀 두께와 지방량에 맞는 방법을 상담을 통해 결정합니다. 자연스러운 인상 변화를 원하시는 분들께 가장 많이 권해드리는 시술 영역입니다.',
        precautions: '회복 기간 동안 음주·흡연 제한, 수술 후 2주간 렌즈 착용 불가. 개인차에 따라 부기·멍이 남을 수 있으며 결과는 의료진 상담을 통해 예상해주세요.',
        indications: ['쌍꺼풀 미형성', '홑꺼풀', '눈 처짐 동반', '답답한 눈매'],
      },
      'zh-CN': {
        title: '双眼皮手术',
        description: '根据个人眼皮厚度和脂肪量通过咨询决定埋线法、部分切开或切开法。适合希望自然改变印象的客户。',
        precautions: '恢复期间禁酒禁烟，术后2周内不可戴隐形眼镜。个人差异可能导致肿胀或淤青，请通过医疗咨询预估结果。',
        indications: ['未形成双眼皮', '单眼皮', '伴随眼睑下垂', '眼神压迫感'],
      },
    },
    publishedAt: '2026-03-10T09:00:00Z',
    createdAt: '2026-03-10T09:00:00Z',
    updatedAt: '2026-04-18T11:00:00Z',
    deletedAt: null,
  },
  {
    id: 'proc-002',
    memberId: 'm-001',
    slug: 'eye-ptosis-correction-gangnam-eye',
    primaryArea: 'eyes',
    procedureType: 'eye_ptosis_correction',
    heroImageUrl: IMG_EYE,
    galleryImageUrls: [IMG_EYE],
    priceMin: 1800000, priceMax: 2800000, currency: 'KRW',
    basePrice: 1800000,
    baseAnesthesia: 'local',
    baseDurationMinutes: 45,
    baseRecoveryDays: 10,
    baseHospitalStayDays: 0,
    status: 'published',
    sourceLocale: 'ko',
    viewCount: 962, bookmarkCount: 58, consultClickCount: 41,
    i18n: {
      'ko': {
        title: '눈매교정',
        description: '눈꺼풀 올림근의 힘이 약해 생긴 처짐을 교정합니다. 쌍꺼풀 수술과 함께 진행되기도 하며, 인상이 또렷해지는 효과가 있습니다.',
        precautions: '과도한 눈 비비기 금지. 회복 중 시야 불편감이 있을 수 있으며 2주 후 안정됩니다.',
        indications: ['안검하수', '졸려 보이는 눈', '인상 답답함', '쌍꺼풀 동시 희망'],
      },
      'zh-CN': {
        title: '眼睑下垂矫正',
        description: '矫正因提眼肌力量不足导致的下垂。常与双眼皮手术同步进行，可使印象更清晰。',
        precautions: '禁止过度揉眼。恢复期间可能有视野不适感，2周后稳定。',
        indications: ['眼睑下垂', '看起来疲倦', '眼神压迫', '与双眼皮同步'],
      },
    },
    publishedAt: '2026-03-14T09:00:00Z',
    createdAt: '2026-03-14T09:00:00Z',
    updatedAt: '2026-04-02T15:00:00Z',
    deletedAt: null,
  },
  {
    id: 'proc-003',
    memberId: 'm-001',
    slug: 'under-eye-fat-gangnam-eye',
    primaryArea: 'eyes',
    procedureType: 'eye_under_eye_fat',
    heroImageUrl: IMG_EYE,
    galleryImageUrls: [IMG_EYE],
    priceMin: 2200000, priceMax: 2200000, currency: 'KRW',
    basePrice: 2200000,
    baseAnesthesia: 'sedation',
    baseDurationMinutes: 60,
    baseRecoveryDays: 7,
    baseHospitalStayDays: 0,
    status: 'published',
    sourceLocale: 'ko',
    viewCount: 584, bookmarkCount: 33, consultClickCount: 27,
    i18n: {
      'ko': {
        title: '눈밑지방 재배치',
        description: '눈밑 지방을 제거하지 않고 고르게 재배치하여 다크서클과 눈밑 꺼짐을 동시에 개선합니다.',
        precautions: '결막 접근법은 흉터가 보이지 않으나, 부기·멍이 1주 정도 지속될 수 있습니다.',
        indications: ['다크서클', '눈밑 꺼짐', '지방 튀어나옴'],
      },
      'zh-CN': {
        title: '眼下脂肪重置',
        description: '不去除眼下脂肪，而是均匀重置以同时改善黑眼圈和眼下凹陷。',
        precautions: '结膜入路无可见瘢痕，但肿胀淤青可能持续约1周。',
        indications: ['黑眼圈', '眼下凹陷', '脂肪突出'],
      },
    },
    publishedAt: '2026-03-20T09:00:00Z',
    createdAt: '2026-03-20T09:00:00Z',
    updatedAt: '2026-03-20T09:00:00Z',
    deletedAt: null,
  },
  {
    id: 'proc-004',
    memberId: 'm-002',
    slug: 'autologous-cartilage-rhinoplasty-beauty-nose',
    primaryArea: 'nose',
    procedureType: 'nose_augmentation',
    heroImageUrl: IMG_NOSE,
    galleryImageUrls: [IMG_NOSE, IMG_CLINIC],
    priceMin: 3800000, priceMax: 5800000, currency: 'KRW',
    basePrice: 3800000,
    baseAnesthesia: 'sedation',
    baseDurationMinutes: 90,
    baseRecoveryDays: 14,
    baseHospitalStayDays: 0,
    status: 'published',
    sourceLocale: 'ko',
    viewCount: 2134, bookmarkCount: 189, consultClickCount: 142,
    i18n: {
      'ko': {
        title: '자가연골 코성형',
        description: '비중격 연골·귀 연골 등 자가 조직을 활용해 코끝과 콧대 라인을 자연스럽게 정돈합니다. 이물감이 적고 장기 안정성이 높은 편입니다.',
        precautions: '3주간 안경 착용 제한, 1개월간 코 접촉·마사지 금지. 개인별 연골 상태에 따라 결과가 다를 수 있습니다.',
        indications: ['코끝 낮음', '콧대 낮음', '코끝 둥금', '자연스러운 라인 희망'],
      },
      'zh-CN': {
        title: '自体软骨鼻整形',
        description: '利用鼻中隔软骨、耳软骨等自体组织自然调整鼻尖和鼻梁线条。异物感少，长期稳定性高。',
        precautions: '3周内限制戴眼镜，1个月内禁止接触或按摩鼻部。因个人软骨状态不同，结果可能有差异。',
        indications: ['鼻尖低', '鼻梁低', '鼻尖圆钝', '希望自然线条'],
      },
    },
    publishedAt: '2026-03-05T09:00:00Z',
    createdAt: '2026-03-05T09:00:00Z',
    updatedAt: '2026-04-15T13:00:00Z',
    deletedAt: null,
  },
  {
    id: 'proc-005',
    memberId: 'm-002',
    slug: 'nose-bridge-implant-beauty-nose',
    primaryArea: 'nose',
    procedureType: 'nose_augmentation',
    heroImageUrl: IMG_NOSE,
    galleryImageUrls: [IMG_NOSE],
    priceMin: 3000000, priceMax: 3000000, currency: 'KRW',
    basePrice: 3000000,
    baseAnesthesia: 'sedation',
    baseDurationMinutes: 60,
    baseRecoveryDays: 10,
    baseHospitalStayDays: 0,
    status: 'published',
    sourceLocale: 'ko',
    viewCount: 745, bookmarkCount: 41, consultClickCount: 32,
    i18n: {
      'ko': {
        title: '콧대 보형물 성형',
        description: '실리콘 또는 고어텍스 보형물로 콧대를 안정적으로 높이는 접근입니다. 자가연골 코끝 성형과 병행해 종합적인 밸런스를 잡는 경우가 많습니다.',
        precautions: '보형물 특성상 과격한 외부 충격 주의. 정기 경과 관찰이 필요합니다.',
        indications: ['콧대 낮음', '안정적 높이 희망'],
      },
      'zh-CN': {
        title: '鼻梁假体整形',
        description: '使用硅胶或膨体假体稳定提升鼻梁。常与自体软骨鼻尖整形并行以取得综合平衡。',
        precautions: '假体特性，注意避免剧烈外部冲击。需定期观察恢复。',
        indications: ['鼻梁低', '希望稳定高度'],
      },
    },
    publishedAt: '2026-03-18T09:00:00Z',
    createdAt: '2026-03-18T09:00:00Z',
    updatedAt: '2026-03-18T09:00:00Z',
    deletedAt: null,
  },
  {
    id: 'proc-006',
    memberId: 'm-002',
    slug: 'nostril-reduction-beauty-nose',
    primaryArea: 'nose',
    procedureType: 'nose_nostril',
    heroImageUrl: IMG_NOSE,
    galleryImageUrls: [IMG_NOSE],
    priceMin: 1200000, priceMax: 1200000, currency: 'KRW',
    basePrice: 1200000,
    baseAnesthesia: 'local',
    baseDurationMinutes: 45,
    baseRecoveryDays: 7,
    baseHospitalStayDays: 0,
    status: 'published',
    sourceLocale: 'ko',
    viewCount: 312, bookmarkCount: 18, consultClickCount: 11,
    i18n: {
      'ko': {
        title: '콧볼 축소',
        description: '넓게 퍼진 콧볼을 축소하여 코 전체 밸런스를 잡는 시술입니다. 절개 범위에 따라 회복 기간이 달라집니다.',
        precautions: '흉터 관리가 중요하며 1개월간 자외선 차단을 권장합니다.',
        indications: ['콧볼 넓음', '코 끝 크기 균형'],
      },
      'zh-CN': {
        title: '鼻翼缩小',
        description: '缩小宽大鼻翼以取得整体平衡。根据切开范围，恢复期会有差异。',
        precautions: '瘢痕管理重要，建议1个月内防晒。',
        indications: ['鼻翼宽', '鼻尖大小平衡'],
      },
    },
    publishedAt: '2026-04-01T09:00:00Z',
    createdAt: '2026-04-01T09:00:00Z',
    updatedAt: '2026-04-01T09:00:00Z',
    deletedAt: null,
  },
  {
    id: 'proc-007',
    memberId: 'm-003',
    slug: 'thread-lift-premium-lift',
    primaryArea: 'lifting',
    procedureType: 'lift_thread',
    heroImageUrl: IMG_LIFT,
    galleryImageUrls: [IMG_LIFT],
    priceMin: 2500000, priceMax: 4500000, currency: 'KRW',
    basePrice: 2500000,
    baseAnesthesia: 'local',
    baseDurationMinutes: 60,
    baseRecoveryDays: 3,
    baseHospitalStayDays: 0,
    status: 'published',
    sourceLocale: 'ko',
    viewCount: 1556, bookmarkCount: 96, consultClickCount: 68,
    i18n: {
      'ko': {
        title: '실리프팅',
        description: '특수 실을 피부 아래 삽입하여 즉각적인 리프팅 효과와 함께 콜라겐 생성을 유도합니다. 실 종류·개수에 따라 효과와 비용이 달라집니다.',
        precautions: '시술 직후 얼굴 표정 움직임 최소화. 2주간 얼굴 마사지 금지.',
        indications: ['얼굴 처짐', '팔자주름', '턱선 흐려짐', '비절개 선호'],
      },
      'zh-CN': {
        title: '线雕提升',
        description: '将特殊线埋入皮下以获得即时提升并促进胶原再生。线的种类与数量决定效果与费用。',
        precautions: '术后立即尽量减少面部表情动作。2周内禁止按摩面部。',
        indications: ['面部下垂', '法令纹', '下颌线模糊', '倾向非切开'],
      },
    },
    publishedAt: '2026-03-12T09:00:00Z',
    createdAt: '2026-03-12T09:00:00Z',
    updatedAt: '2026-04-10T10:00:00Z',
    deletedAt: null,
  },
  {
    id: 'proc-008',
    memberId: 'm-003',
    slug: 'mandible-surgery-premium-lift',
    primaryArea: 'lifting',
    procedureType: 'contour_mandible',
    heroImageUrl: IMG_CLINIC,
    galleryImageUrls: [IMG_CLINIC],
    priceMin: 12000000, priceMax: 12000000, currency: 'KRW',
    basePrice: 12000000,
    baseAnesthesia: 'general',
    baseDurationMinutes: 240,
    baseRecoveryDays: 42,
    baseHospitalStayDays: 3,
    status: 'published',
    sourceLocale: 'ko',
    viewCount: 428, bookmarkCount: 52, consultClickCount: 19,
    i18n: {
      'ko': {
        title: '양악 수술',
        description: '주걱턱·부정교합 등 턱 구조를 개선하는 수술입니다. 충분한 사전 교정·영상 분석 후 진행되며 상담이 필수적입니다.',
        precautions: '수술 후 2~3일 입원, 약 6주간 유동식. 정기적인 경과 진료가 필요합니다. 개인 상태에 따라 계획이 크게 달라질 수 있습니다.',
        indications: ['주걱턱', '부정교합', '얼굴 비대칭'],
      },
      'zh-CN': {
        title: '双颌手术',
        description: '矫正下颌前突、错颌等颌骨结构。需术前充分矫正与影像分析，咨询必不可少。',
        precautions: '术后需住院2~3天，约6周流食。需定期复诊。因个人状态差异，方案可能有较大变化。',
        indications: ['下颌前突', '错颌', '面部不对称'],
      },
    },
    publishedAt: '2026-03-25T09:00:00Z',
    createdAt: '2026-03-25T09:00:00Z',
    updatedAt: '2026-03-25T09:00:00Z',
    deletedAt: null,
  },
  {
    id: 'proc-009',
    memberId: 'm-004',
    slug: 'laser-toning-package-glow-skin',
    primaryArea: 'skin',
    procedureType: 'skin_laser',
    heroImageUrl: IMG_SKIN,
    galleryImageUrls: [IMG_SKIN],
    priceMin: 600000, priceMax: 1100000, currency: 'KRW',
    basePrice: 600000,
    baseAnesthesia: 'local',
    baseDurationMinutes: 30,
    baseRecoveryDays: 0,
    baseHospitalStayDays: 0,
    status: 'draft',
    sourceLocale: 'ko',
    viewCount: 0, bookmarkCount: 0, consultClickCount: 0,
    i18n: {
      'ko': {
        title: '레이저 토닝 패키지',
        description: '피부톤·기미·색소 개선을 위한 저출력 레이저 반복 시술 패키지입니다. 회차가 많을수록 누적 효과가 높아집니다.',
        precautions: '시술 후 강한 자외선 노출 자제. 개인 피부 반응에 따라 효과는 달라집니다.',
        indications: ['칙칙한 톤', '기미', '잡티', '색소침착'],
      },
      'zh-CN': {
        title: '激光肌肤调理套餐',
        description: '改善肤色、色斑、色素的低能量激光反复治疗套餐。回数越多累积效果越显著。',
        precautions: '术后避免强烈紫外线暴露。因个人皮肤反应不同，效果有差异。',
        indications: ['肤色暗沉', '雀斑', '色素沉着', '瑕疵'],
      },
    },
    publishedAt: null,
    createdAt: '2026-04-20T09:00:00Z',
    updatedAt: '2026-04-22T14:00:00Z',
    deletedAt: null,
  },
  {
    id: 'proc-010',
    memberId: 'm-004',
    slug: 'liposuction-glow-skin',
    primaryArea: 'diet',
    procedureType: 'diet_liposuction',
    heroImageUrl: IMG_DIET,
    galleryImageUrls: [IMG_DIET],
    priceMin: 3500000, priceMax: 6500000, currency: 'KRW',
    basePrice: 3500000,
    baseAnesthesia: 'general',
    baseDurationMinutes: 90,
    baseRecoveryDays: 14,
    baseHospitalStayDays: 1,
    status: 'published',
    sourceLocale: 'ko',
    viewCount: 1087, bookmarkCount: 71, consultClickCount: 45,
    i18n: {
      'ko': {
        title: '부분 지방흡입',
        description: '복부·허벅지 등 원하는 부위의 지방을 직접 제거합니다. 부위 조합에 따라 비용과 회복 기간이 달라집니다.',
        precautions: '1~2개월 압박복 착용 권장. 충분한 휴식과 경과 관찰이 필요합니다.',
        indications: ['국소 지방 축적', '식단·운동으로 개선 어려운 부위'],
      },
      'zh-CN': {
        title: '局部吸脂',
        description: '直接去除腹部、大腿等目标部位的脂肪。部位组合决定费用与恢复期。',
        precautions: '建议佩戴加压衣1~2个月。需充分休息与观察恢复。',
        indications: ['局部脂肪堆积', '饮食运动难改善'],
      },
    },
    publishedAt: '2026-03-08T09:00:00Z',
    createdAt: '2026-03-08T09:00:00Z',
    updatedAt: '2026-04-05T16:00:00Z',
    deletedAt: null,
  },
];

export const MOCK_PROCEDURE_VARIANTS: ProcedureVariant[] = [
  /* proc-001 쌍꺼풀: 매몰 / 부분절개 / 절개 */
  {
    id: 'pv-001-a', procedureId: 'proc-001',
    price: 1500000, anesthesia: 'local', durationMinutes: 30, recoveryDays: 5, hospitalStayDays: null,
    sortOrder: 0, isDefault: true,
    i18n: {
      'ko':    { name: '매몰법',    description: '실로 라인을 고정하는 비절개 방식. 회복이 빠르고 자연스럽습니다.' },
      'zh-CN': { name: '埋线法',    description: '通过埋线固定双眼皮线条的非切开方式。恢复快且自然。' },
    },
    createdAt: '2026-03-10T09:00:00Z', updatedAt: '2026-03-10T09:00:00Z',
  },
  {
    id: 'pv-001-b', procedureId: 'proc-001',
    price: 2000000, anesthesia: null, durationMinutes: 45, recoveryDays: 7, hospitalStayDays: null,
    sortOrder: 10, isDefault: false,
    i18n: {
      'ko':    { name: '부분절개',  description: '매몰과 절개의 중간. 뚜렷함과 회복의 밸런스를 맞춘 방식입니다.' },
      'zh-CN': { name: '部分切开',  description: '埋线与切开的中间方案，兼顾清晰度与恢复。' },
    },
    createdAt: '2026-03-10T09:00:00Z', updatedAt: '2026-03-10T09:00:00Z',
  },
  {
    id: 'pv-001-c', procedureId: 'proc-001',
    price: 2500000, anesthesia: 'sedation', durationMinutes: 60, recoveryDays: 14, hospitalStayDays: null,
    sortOrder: 20, isDefault: false,
    i18n: {
      'ko':    { name: '절개법',    description: '피부·지방이 두꺼운 경우 뚜렷한 라인을 위해 선택하는 방식입니다.' },
      'zh-CN': { name: '切开法',    description: '皮肤脂肪较厚时为获得清晰线条选择的方式。' },
    },
    createdAt: '2026-03-10T09:00:00Z', updatedAt: '2026-03-10T09:00:00Z',
  },

  /* proc-002 눈매교정: 비절개 / 절개 */
  {
    id: 'pv-002-a', procedureId: 'proc-002',
    price: 1800000, anesthesia: null, durationMinutes: 45, recoveryDays: 7, hospitalStayDays: null,
    sortOrder: 0, isDefault: true,
    i18n: {
      'ko':    { name: '비절개 눈매교정', description: '결막 쪽으로 접근하여 흉터 없이 진행하는 방식입니다.' },
      'zh-CN': { name: '非切开眼睑矫正',  description: '从结膜入路，无瘢痕进行的方式。' },
    },
    createdAt: '2026-03-14T09:00:00Z', updatedAt: '2026-03-14T09:00:00Z',
  },
  {
    id: 'pv-002-b', procedureId: 'proc-002',
    price: 2800000, anesthesia: 'sedation', durationMinutes: 75, recoveryDays: 14, hospitalStayDays: null,
    sortOrder: 10, isDefault: false,
    i18n: {
      'ko':    { name: '절개 눈매교정', description: '쌍꺼풀 절개와 함께 진행 가능한 방식. 교정 정도가 큰 경우 권장됩니다.' },
      'zh-CN': { name: '切开眼睑矫正',  description: '可与切开双眼皮同步进行，适合矫正程度较大的情况。' },
    },
    createdAt: '2026-03-14T09:00:00Z', updatedAt: '2026-03-14T09:00:00Z',
  },

  /* proc-003 눈밑지방: 1 */
  {
    id: 'pv-003-a', procedureId: 'proc-003',
    price: null, anesthesia: null, durationMinutes: null, recoveryDays: null, hospitalStayDays: null,
    sortOrder: 0, isDefault: true,
    i18n: {
      'ko':    { name: '결막 접근 재배치', description: null },
      'zh-CN': { name: '结膜入路重置',     description: null },
    },
    createdAt: '2026-03-20T09:00:00Z', updatedAt: '2026-03-20T09:00:00Z',
  },

  /* proc-004 자가연골: 코끝 / 풀패키지 */
  {
    id: 'pv-004-a', procedureId: 'proc-004',
    price: 3800000, anesthesia: null, durationMinutes: 75, recoveryDays: 10, hospitalStayDays: null,
    sortOrder: 0, isDefault: true,
    i18n: {
      'ko':    { name: '코끝 성형',     description: '콧대는 자연 두고 코끝 라인만 자가연골로 다듬는 방식입니다.' },
      'zh-CN': { name: '鼻尖整形',       description: '保留鼻梁，仅用自体软骨调整鼻尖线条。' },
    },
    createdAt: '2026-03-05T09:00:00Z', updatedAt: '2026-03-05T09:00:00Z',
  },
  {
    id: 'pv-004-b', procedureId: 'proc-004',
    price: 5800000, anesthesia: null, durationMinutes: 120, recoveryDays: 14, hospitalStayDays: null,
    sortOrder: 10, isDefault: false,
    i18n: {
      'ko':    { name: '코끝+콧대 풀패키지', description: '자가연골과 보형물을 함께 활용해 전체 라인을 재구성합니다.' },
      'zh-CN': { name: '鼻尖+鼻梁全套',       description: '结合自体软骨与假体重建整体线条。' },
    },
    createdAt: '2026-03-05T09:00:00Z', updatedAt: '2026-03-05T09:00:00Z',
  },

  /* proc-005 콧대 보형물: 1 */
  {
    id: 'pv-005-a', procedureId: 'proc-005',
    price: null, anesthesia: null, durationMinutes: null, recoveryDays: null, hospitalStayDays: null,
    sortOrder: 0, isDefault: true,
    i18n: {
      'ko':    { name: '실리콘 보형물', description: null },
      'zh-CN': { name: '硅胶假体',       description: null },
    },
    createdAt: '2026-03-18T09:00:00Z', updatedAt: '2026-03-18T09:00:00Z',
  },

  /* proc-006 콧볼 축소: 1 */
  {
    id: 'pv-006-a', procedureId: 'proc-006',
    price: null, anesthesia: null, durationMinutes: null, recoveryDays: null, hospitalStayDays: null,
    sortOrder: 0, isDefault: true,
    i18n: {
      'ko':    { name: '외측 절개법', description: null },
      'zh-CN': { name: '外侧切开法',   description: null },
    },
    createdAt: '2026-04-01T09:00:00Z', updatedAt: '2026-04-01T09:00:00Z',
  },

  /* proc-007 실리프팅: 미니 / 풀페이스 */
  {
    id: 'pv-007-a', procedureId: 'proc-007',
    price: 2500000, anesthesia: null, durationMinutes: 45, recoveryDays: 2, hospitalStayDays: null,
    sortOrder: 0, isDefault: true,
    i18n: {
      'ko':    { name: '미니 리프팅',    description: '처음 경험하시는 분에게 권장하는 부분 리프팅입니다.' },
      'zh-CN': { name: '迷你提升',        description: '推荐给首次尝试的客户，局部提升。' },
    },
    createdAt: '2026-03-12T09:00:00Z', updatedAt: '2026-03-12T09:00:00Z',
  },
  {
    id: 'pv-007-b', procedureId: 'proc-007',
    price: 4500000, anesthesia: null, durationMinutes: 90, recoveryDays: 5, hospitalStayDays: null,
    sortOrder: 10, isDefault: false,
    i18n: {
      'ko':    { name: '풀 페이스 리프팅', description: '얼굴 전체 라인을 리프팅하는 종합 패키지입니다.' },
      'zh-CN': { name: '全脸提升',          description: '整体提升全脸线条的综合套餐。' },
    },
    createdAt: '2026-03-12T09:00:00Z', updatedAt: '2026-03-12T09:00:00Z',
  },

  /* proc-008 양악: 1 */
  {
    id: 'pv-008-a', procedureId: 'proc-008',
    price: null, anesthesia: null, durationMinutes: null, recoveryDays: null, hospitalStayDays: null,
    sortOrder: 0, isDefault: true,
    i18n: {
      'ko':    { name: '양악 수술 (풀 플랜)',  description: '진단·교정·수술·회복 전 과정을 포함한 표준 플랜입니다.' },
      'zh-CN': { name: '双颌手术（全方案）',    description: '包括诊断、矫正、手术、恢复全过程的标准方案。' },
    },
    createdAt: '2026-03-25T09:00:00Z', updatedAt: '2026-03-25T09:00:00Z',
  },

  /* proc-009 레이저 토닝 (draft): 10회 / 20회 */
  {
    id: 'pv-009-a', procedureId: 'proc-009',
    price: 600000, anesthesia: null, durationMinutes: null, recoveryDays: null, hospitalStayDays: null,
    sortOrder: 0, isDefault: true,
    i18n: {
      'ko':    { name: '10회 패키지', description: null },
      'zh-CN': { name: '10次套餐',    description: null },
    },
    createdAt: '2026-04-20T09:00:00Z', updatedAt: '2026-04-20T09:00:00Z',
  },
  {
    id: 'pv-009-b', procedureId: 'proc-009',
    price: 1100000, anesthesia: null, durationMinutes: null, recoveryDays: null, hospitalStayDays: null,
    sortOrder: 10, isDefault: false,
    i18n: {
      'ko':    { name: '20회 패키지', description: null },
      'zh-CN': { name: '20次套餐',    description: null },
    },
    createdAt: '2026-04-20T09:00:00Z', updatedAt: '2026-04-22T14:00:00Z',
  },

  /* proc-010 지방흡입: 복부 / 복부+허벅지 */
  {
    id: 'pv-010-a', procedureId: 'proc-010',
    price: 3500000, anesthesia: null, durationMinutes: 90, recoveryDays: 14, hospitalStayDays: 1,
    sortOrder: 0, isDefault: true,
    i18n: {
      'ko':    { name: '복부',           description: '복부 단일 부위 집중 지방흡입입니다.' },
      'zh-CN': { name: '腹部',            description: '腹部单一部位集中吸脂。' },
    },
    createdAt: '2026-03-08T09:00:00Z', updatedAt: '2026-03-08T09:00:00Z',
  },
  {
    id: 'pv-010-b', procedureId: 'proc-010',
    price: 6500000, anesthesia: null, durationMinutes: 180, recoveryDays: 21, hospitalStayDays: 1,
    sortOrder: 10, isDefault: false,
    i18n: {
      'ko':    { name: '복부+허벅지 콤보', description: '두 부위를 동시에 진행하여 경제적으로 라인을 정리합니다.' },
      'zh-CN': { name: '腹部+大腿组合',     description: '同时进行两部位，经济地调整线条。' },
    },
    createdAt: '2026-03-08T09:00:00Z', updatedAt: '2026-03-08T09:00:00Z',
  },
];

/** 북마크 mock — u-001 3개, u-002 1개 */
export const MOCK_PROCEDURE_BOOKMARKS: ProcedureBookmark[] = [
  { id: 'pb-001', userId: 'u-001', procedureId: 'proc-001', createdAt: '2026-04-10T12:00:00Z' },
  { id: 'pb-002', userId: 'u-001', procedureId: 'proc-004', createdAt: '2026-04-12T14:00:00Z' },
  { id: 'pb-003', userId: 'u-001', procedureId: 'proc-007', createdAt: '2026-04-18T09:00:00Z' },
  { id: 'pb-004', userId: 'u-002', procedureId: 'proc-004', createdAt: '2026-04-15T10:00:00Z' },
];
