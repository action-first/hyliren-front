import { Badge } from '@hyliren/ui';

const MOCK_ARTICLES = [
  { id: 1, title: '쌍꺼풀 수술, 매몰 vs 절개 어떻게 다를까?', category: '시술 설명', tag: 'info' as const, excerpt: '매몰법과 절개법의 차이, 회복기간, 부작용까지 한 번에 정리했습니다.' },
  { id: 2, title: '코성형 평균 가격과 주의사항', category: '비용 가이드', tag: 'default' as const, excerpt: '한국 코성형 평균 비용, 병원 선택 시 확인해야 할 3가지.' },
  { id: 3, title: '리프팅 부작용, 이것만은 꼭 확인하세요', category: '리스크', tag: 'danger' as const, excerpt: '실리프팅, 울쎄라 등 비절개 리프팅의 부작용과 주의사항.' },
  { id: 4, title: '한국 성형외과 선택 가이드 2026', category: '트렌드', tag: 'info' as const, excerpt: '올해 가장 많이 찾는 시술과 트렌드를 정리했습니다.' },
  { id: 5, title: '피부과 시술, 뭘 먼저 해야 할까?', category: '시술 설명', tag: 'default' as const, excerpt: '보톡스, 필러, 레이저... 순서가 중요한 이유.' },
];

export default function ArticlesTabPage() {
  return (
    <div className="flex flex-col">
      <h1 className="text-2xl font-bold text-[var(--color-text)] px-4 pt-5">아티클</h1>
      <p className="text-sm text-[var(--color-text-secondary)] px-4 pt-1 pb-4">성형·피부 정보를 한눈에</p>

      <div className="flex flex-col gap-3 px-4 pb-4">
        {MOCK_ARTICLES.map(a => (
          <div key={a.id} className="flex gap-3 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] hover:shadow-sm transition-shadow">
            <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-rose-50" />
            </div>
            <div className="flex flex-col gap-1.5 justify-center min-w-0">
              <Badge variant={a.tag}>{a.category}</Badge>
              <span className="text-sm font-medium text-[var(--color-text)] leading-snug line-clamp-2">{a.title}</span>
              <span className="text-xs text-[var(--color-text-dim)] leading-snug line-clamp-2">{a.excerpt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
