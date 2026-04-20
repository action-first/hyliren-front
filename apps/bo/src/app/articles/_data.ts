// BO 아티클 공통 데이터 — 목록/상세 양쪽에서 참조
// TODO: 향후 공유 data-store로 이전

export interface BOArticle {
  slug: string;
  title: string;
  category: string;
  bodyArea: string;
  status: string;
  publishedAt: string;
  views: number;
  excerpt: string;
  tags: string[];
}

export const BO_ARTICLES: BOArticle[] = [
  { slug: 'korea-surgery-recovery-first-2-weeks', title: '한국에서 시술 받고 14일, 회복 진짜 어떻게 흘러가?', category: '안전 정보', bodyArea: '전체', status: 'published', publishedAt: '2026-04-17', views: 11600, excerpt: '시술은 결정했는데, 그 다음 2주가 더 불안하죠.', tags: ['성형회복', '사후관리', '회복기간'] },
  { slug: 'nose-tip-plasty-mini-rhinoplasty-korea', title: '코 전체 안 건드려도 되더라고요. 미니 코성형 이야기', category: '시술 가이드', bodyArea: '코', status: 'published', publishedAt: '2026-04-17', views: 7300, excerpt: '코끝만 살짝, 그게 미니 코성형이에요.', tags: ['코성형', '미니코성형', '코끝'] },
  { slug: 'under-eye-dark-circles-types-approach', title: '내 다크서클, 혈관? 색소? 그림자? 타입부터 찾아봐요', category: '시술 가이드', bodyArea: '눈', status: 'published', publishedAt: '2026-04-17', views: 6100, excerpt: '다크서클 타입을 먼저 알아야 답이 나와요.', tags: ['다크서클', '눈밑', '피부톤'] },
  { slug: 'pigment-laser-picosure-picoway-toning', title: '피코슈어·피코웨이·토닝, 뭐가 달라?', category: '시술 비교', bodyArea: '피부', status: 'published', publishedAt: '2026-04-16', views: 8200, excerpt: '레이저 이름이 너무 많아서 헷갈리죠.', tags: ['피코슈어', '피코웨이', '레이저토닝'] },
  { slug: 'lifting-ulthera-thermage-inmode', title: '울쎄라·써마지·인모드, 솔직히 뭐가 다른 건데?', category: '시술 비교', bodyArea: '리프팅', status: 'published', publishedAt: '2026-04-15', views: 15200, excerpt: '세 기기를 3층 집 하나로 비유하면 놀랄 만큼 쉽게 정리됩니다.', tags: ['울쎄라', '써마지', '인모드'] },
  { slug: 'ssangkkeopul-maemol-vs-jeolgae-natural-eyes', title: '매몰이 좋아요, 절개가 좋아요? 쌍꺼풀 고민 정리', category: '시술 비교', bodyArea: '눈', status: 'published', publishedAt: '2026-04-15', views: 12400, excerpt: '매몰과 절개, 정답은 내 눈 상태에 달렸어요.', tags: ['쌍꺼풀', '매몰법', '절개법'] },
  { slug: 'skin-booster-rejuran-juvelook-aquashine', title: '리쥬란·쥬베룩·물광주사, 뭐부터 해야 해?', category: '시술 가이드', bodyArea: '피부', status: 'published', publishedAt: '2026-04-15', views: 9800, excerpt: '스킨부스터 3대장, 차이를 알면 선택이 쉬워요.', tags: ['리쥬란', '쥬베룩', '물광주사'] },
  { slug: '2026-spring-korea-trend-microbotox-thread-sculptra', title: '요즘 한국에서 진짜 뜨는 시술 3가지 — 자연스러움 시대 시술 메뉴판', category: '트렌드', bodyArea: '전체', status: 'published', publishedAt: '2026-04-19', views: 4200, excerpt: '2026 봄 한국에서 동시에 뜨고 있는 자연스러움 시술 3가지.', tags: ['마이크로보톡스', '실리프팅', '콜라겐부스터'] },
  { slug: 'double-chin-jawline-fat-vs-skin-vs-muscle', title: '이중턱, 살 빼면 되는 거 아니야? 턱 아래 3층 구조부터 체크해봐요', category: '시술 가이드', bodyArea: '다이어트', status: 'published', publishedAt: '2026-04-19', views: 3800, excerpt: '턱 아래엔 지방·피부·근육 3층이 겹쳐 있어요.', tags: ['이중턱', '턱선', '지방분해'] },
  { slug: 'lip-shape-3types-filler-corner-reduction', title: '내 입술, 필러야? 입꼬리야? 축소야? 입술 고민 3유형 Q&A', category: '시술 가이드', bodyArea: '기타', status: 'published', publishedAt: '2026-04-19', views: 2900, excerpt: '입술 고민을 3가지 유형으로 정리했어요.', tags: ['입술필러', '입꼬리거상', '입술축소'] },
  { slug: 'postpartum-face-change-1-year-friend-story', title: '둘째 낳고 거울 앞에서 한참 서 있던 언니, 결국 1년 동안 한 일은…', category: '사례', bodyArea: '전체', status: 'published', publishedAt: '2026-04-19', views: 5100, excerpt: '출산 후 1년에 걸친 회복 스토리.', tags: ['산후관리', '스킨부스터', '1년플랜'] },
];
