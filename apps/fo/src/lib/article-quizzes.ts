export interface QuizItem {
  question: string;
  options: string[];
}

export interface ArticleQuiz {
  title: string;
  items: QuizItem[];
}

export const ARTICLE_QUIZZES: Record<string, ArticleQuiz> = {
  'ssangkkeopul-maemol-vs-jeolgae-natural-eyes': {
    title: '내 눈꺼풀 타입은?',
    items: [
      { question: '눈꺼풀 두께', options: ['얇은 편', '보통', '두꺼운 편'] },
      { question: '눈 뜨는 힘', options: ['잘 떠짐', '좀 무거움', '졸려 보인다는 말 자주 들음'] },
      { question: '원하는 느낌', options: ['속쌍 자연스럽게', '또렷한 아웃라인', '잘 모르겠음'] },
    ],
  },
  'lifting-ulthera-thermage-inmode': {
    title: '내 리프팅 고민은?',
    items: [
      { question: '가장 신경 쓰이는 부위', options: ['턱선·볼 처짐', '전체적 탄력 저하', '모공·볼살 복합'] },
      { question: '이전 시술 경험', options: ['처음', '에너지 기기 경험 있음', '필러·실 경험 있음'] },
      { question: '한국 체류 일정', options: ['3일 이내', '5~7일', '2주 이상'] },
    ],
  },
  'skin-booster-rejuran-juvelook-aquashine': {
    title: '내 피부 1순위 고민은?',
    items: [
      { question: '제일 신경 쓰이는 것', options: ['피부결·모공', '탄력·볼륨', '수분·촉촉함'] },
      { question: '관리 지속 가능', options: ['한국에서만 1회', '정기 방문 가능', '귀국 후 관리 가능'] },
      { question: '이전 시술', options: ['없음', '필러·레이저 있음', '스킨부스터 경험 있음'] },
    ],
  },
  'pigment-laser-picosure-picoway-toning': {
    title: '내 색소 타입은?',
    items: [
      { question: '색소 모양', options: ['점처럼 딱 찍힌 잡티', '얼굴 전반에 흐린 기미', '둘 다 섞여 있음'] },
      { question: '심해진 시기', options: ['원래 있었음', '임신·출산 후', '자외선 노출 후'] },
      { question: '한국 체류', options: ['단기 (3~5일)', '1~2주', '여러 번 방문 가능'] },
    ],
  },
  'nose-tip-plasty-mini-rhinoplasty-korea': {
    title: '내 코끝 고민은?',
    items: [
      { question: '코끝 형태', options: ['뭉툭 (둥글고 넓음)', '처짐 (아래로 향함)', '납작 (볼륨 부족)'] },
      { question: '원하는 변화', options: ['자연스러운 보정', '확실한 변화', '잘 모르겠음'] },
      { question: '한국 체류', options: ['5일 이내', '7~10일', '2주 이상'] },
    ],
  },
  'korea-surgery-recovery-first-2-weeks': {
    title: '내 회복 준비 체크',
    items: [
      { question: '체류 가능 기간', options: ['7일 이내', '10~14일', '2주 이상'] },
      { question: '동행 여부', options: ['혼자 방한', '동행 있음'] },
      { question: '숙소 타입', options: ['호텔', '레지던스 (취사 가능)', '아직 미정'] },
    ],
  },
  'under-eye-dark-circles-types-approach': {
    title: '내 다크서클 타입은?',
    items: [
      { question: '눈밑을 당겨보면', options: ['색이 조금 옅어짐 (블루)', '거의 그대로 (브라운)', '그림자가 확 사라짐 (섀도)'] },
      { question: '아침 vs 저녁', options: ['아침에 더 진함', '차이 없음', '조명에 따라 다름'] },
      { question: '원하는 결과', options: ['밝아 보이고 싶다', '덜 피곤해 보이고 싶다', '둘 다'] },
    ],
  },
};
