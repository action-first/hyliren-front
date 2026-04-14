import Link from 'next/link';
import { MOCK_PROPOSALS, MOCK_PARTNER_PROFILES, MOCK_PROPOSAL_ITEMS } from '@hyliren/shared';
import { Button, Badge } from '@hyliren/ui';
import { Eye, CircleDot, Sparkles, Droplets, Dumbbell, ChevronRight, ArrowRight, TrendingUp } from 'lucide-react';
import { ExperienceCard } from '@/components/ExperienceCard';

/* ── value proposition map ── */
const VALUE_PROPS: Record<string, string> = {
  'm-001': '자연스러운 눈매 전문 · 15년 경력',
  'm-002': '날렵한 코 라인 전문',
  'm-003': '프리미엄 리프팅 · 안면윤곽 전문',
  'm-004': '피부 시술 + 리프팅 복합 케어',
};

/* ── explore subcategories ── */
const EXPLORE_CATEGORIES = [
  { area: '눈', label: '자연 쌍꺼풀', icon: Eye },
  { area: '눈', label: '눈매교정', icon: Eye },
  { area: '코', label: '코끝 성형', icon: CircleDot },
  { area: '코', label: '콧대 성형', icon: CircleDot },
  { area: '리프팅', label: '실리프팅', icon: Sparkles },
  { area: '리프팅', label: '울쎄라', icon: Sparkles },
  { area: '피부', label: '흉터 치료', icon: Droplets },
  { area: '다이어트', label: '지방흡입', icon: Dumbbell },
];

/* ── trending keywords ── */
const TRENDING = ['매몰쌍꺼풀', '코끝성형', '실리프팅', '울쎄라', '눈밑지방'];

/* ── cover gradients ── */
const GRADIENTS = [
  'from-[#fce4ec] via-[#f3e5f5] to-[#e8eaf6]',
  'from-[#e0f2f1] via-[#e8f5e9] to-[#f1f8e9]',
  'from-[#fff3e0] via-[#fbe9e7] to-[#fce4ec]',
  'from-[#e3f2fd] via-[#e8eaf6] to-[#ede7f6]',
  'from-[#f3e5f5] via-[#fce4ec] to-[#fff3e0]',
];

export default function HomePage() {
  const recentProposals = MOCK_PROPOSALS
    .filter(p => p.isActive && p.status !== 'draft')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <div className="flex flex-col">

      {/* ═══ HERO ═══ */}
      <section className="flex flex-col items-center text-center px-5 pt-10 pb-8">
        <h1 className="text-[1.75rem] font-bold text-[var(--color-text)] leading-[1.3] tracking-[-0.44px] mb-2.5">
          나에게 맞는<br />시술을 찾아보세요
        </h1>
        <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed mb-6">
          고민만 등록하면 검증된 병원이 맞춤 제안서를 보내드립니다
        </p>

        {/* Trending chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-7">
          {TRENDING.map(kw => (
            <Link key={kw} href={`/concerns/new?keyword=${kw}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--color-bg-secondary)] text-[12px] text-[var(--color-text-secondary)] no-underline">
              <TrendingUp size={11} />
              {kw}
            </Link>
          ))}
        </div>

        <div className="w-full">
          <Link href="/concerns/new" className="w-full no-underline block">
            <Button variant="accent" size="lg" fullWidth>
              무료로 시작하기
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {/* ═══ EXPLORE ENTRY ═══ */}
      <section className="px-5 pt-7 pb-8">
        <h2 className="text-[1.125rem] font-bold text-[var(--color-text)] tracking-[-0.18px] mb-4">어떤 시술을 찾으시나요?</h2>
        <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {EXPLORE_CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Link key={i} href={`/concerns/new?area=${cat.area}&detail=${cat.label}`}
                className="flex flex-col items-center gap-2 min-w-[5rem] py-3 px-2.5 rounded-2xl no-underline bg-[var(--color-bg-secondary)] shrink-0">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[var(--color-primary)]">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-semibold text-[var(--color-text)] whitespace-nowrap">{cat.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ═══ FEATURED PROPOSALS — 경험 카드 ═══ */}
      {recentProposals.length > 0 && (
        <section className="px-5 pt-2 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[1.125rem] font-bold text-[var(--color-text)] tracking-[-0.18px]">지금 많이 보는 플랜</h2>
            <Link href="/proposals" className="flex items-center gap-0.5 text-[12px] text-[var(--color-text-secondary)] no-underline">
              전체보기 <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {recentProposals.map((p, idx) => {
              const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
              const items = MOCK_PROPOSAL_ITEMS.filter(i => i.proposalId === p.id);
              const valueProp = VALUE_PROPS[p.memberId] || profile?.description || '';
              const meta = `회복 ${p.recoveryDays}일 · ${p.anesthesiaType === 'local' ? '부분' : p.anesthesiaType === 'sedation' ? '수면' : '전신'}마취`;

              return (
                <Link key={p.id} href={`/concerns/${p.concernId}/proposals`} className="no-underline block">
                  <ExperienceCard
                    gradient={GRADIENTS[idx % GRADIENTS.length]}
                    valueProp={valueProp}
                    hospitalName={profile?.hospitalName || ''}
                    verified={profile?.verified}
                    rating={4.8}
                    price={p.totalPrice}
                    meta={meta}
                    coverTags={items.slice(0, 2).map(i => i.treatmentName)}
                    quote={p.consultationNote}
                  />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══ TRENDING TREATMENTS — 수평 스크롤 큐레이션 ═══ */}
      <section className="pl-5 pt-2 pb-8">
        <h2 className="text-[1.125rem] font-bold text-[var(--color-text)] tracking-[-0.18px] mb-4">인기 시술</h2>
        <div className="flex gap-3 overflow-x-auto pr-5" style={{ scrollbarWidth: 'none' }}>
          {[
            { label: '매몰 쌍꺼풀', area: '눈', count: 32, gradient: GRADIENTS[0] },
            { label: '코끝 성형', area: '코', count: 28, gradient: GRADIENTS[1] },
            { label: '실리프팅', area: '리프팅', count: 24, gradient: GRADIENTS[2] },
            { label: '울쎄라', area: '리프팅', count: 19, gradient: GRADIENTS[3] },
          ].map((item, i) => (
            <Link key={i} href={`/concerns/new?area=${item.area}`}
              className="flex flex-col min-w-[9rem] rounded-2xl overflow-hidden no-underline shrink-0 bg-white"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div className={`h-24 bg-gradient-to-br ${item.gradient}`} />
              <div className="px-3 py-2.5">
                <span className="text-[13px] font-semibold text-[var(--color-text)]">{item.label}</span>
                <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[var(--color-text-secondary)]">
                  <TrendingUp size={10} />
                  {item.count}개 병원 제안 중
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ TRUST — 분산 신뢰 블록 ═══ */}
      <section className="px-5 pb-8">
        <div className="flex items-center justify-center px-4 py-5 rounded-2xl bg-[var(--color-bg-secondary)]">
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[1.125rem] font-bold text-[var(--color-text)]">150+</span>
            <span className="text-[11px] text-[var(--color-text-secondary)]">인증 병원</span>
          </div>
          <div className="w-px h-8 bg-[var(--color-border-light)]" />
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[1.125rem] font-bold text-[var(--color-text)]">98%</span>
            <span className="text-[11px] text-[var(--color-text-secondary)]">응답률</span>
          </div>
          <div className="w-px h-8 bg-[var(--color-border-light)]" />
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[1.125rem] font-bold text-[var(--color-text)]">4.8</span>
            <span className="text-[11px] text-[var(--color-text-secondary)]">만족도</span>
          </div>
        </div>
      </section>

      {/* ═══ ARTICLES — 탐색 확장 ═══ */}
      <section className="px-5 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[1.125rem] font-bold text-[var(--color-text)] tracking-[-0.18px]">알아두면 좋은 정보</h2>
          <Link href="/articles" className="flex items-center gap-0.5 text-[12px] text-[var(--color-text-secondary)] no-underline">
            더보기 <ChevronRight size={14} />
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { title: '쌍꺼풀 수술, 매몰 vs 절개 어떻게 다를까?', tag: '시술 가이드', color: 'info' as const, gradient: 'from-[#e3f2fd] to-[#bbdefb]' },
            { title: '코성형 평균 가격과 주의사항', tag: '비용 가이드', color: 'default' as const, gradient: 'from-[#fff3e0] to-[#ffe0b2]' },
            { title: '리프팅 부작용, 이것만은 꼭 확인하세요', tag: '안전 정보', color: 'danger' as const, gradient: 'from-[#fce4ec] to-[#f8bbd0]' },
          ].map((a, i) => (
            <Link key={i} href="/articles"
              className="flex gap-3.5 p-3.5 rounded-2xl bg-white no-underline"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                <div className={`w-full h-full bg-gradient-to-br ${a.gradient}`} />
              </div>
              <div className="flex flex-col gap-1.5 justify-center min-w-0">
                <Badge variant={a.color}>{a.tag}</Badge>
                <span className="text-[14px] font-medium text-[var(--color-text)] leading-snug line-clamp-2">{a.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
