'use client';

import Link from 'next/link';
import { MOCK_PROPOSALS, MOCK_PARTNER_PROFILES, MOCK_PROPOSAL_ITEMS, MOCK_CONCERNS } from '@hyliren/shared';
import { Button, Badge } from '@hyliren/ui';
import { ArrowRight, Camera, MessageCircle, FileText, ChevronRight, ShieldCheck } from 'lucide-react';
import { ExperienceCard } from '@/components/common/ExperienceCard';
import { StickyConsultCTA } from '@/components/common/StickyConsultCTA';
import { VALUE_PROPS, CARD_GRADIENTS as G } from '@/lib/constants';
import { useLocaleStore } from '@/store/locale';
import { useUserConcernsStore } from '@/store/user-concerns';

type UserPhase = 'idle' | 'waiting' | 'proposals_ready';

const CONCERN_DEFS = [
  { key: 'landing.pain1', area: '눈', detail: '쌍꺼풀' },
  { key: 'landing.pain2', area: '코', detail: '코끝 성형' },
  { key: 'landing.pain3', area: '리프팅', detail: '리프팅' },
  { key: 'landing.pain4', area: '피부', detail: '피부관리' },
  { key: 'landing.pain5', area: '리프팅', detail: '안면윤곽' },
  { key: 'landing.pain6', area: '눈', detail: '눈밑지방' },
];

export default function HomePage() {
  const t = useLocaleStore(s => s.t);
  const userCreatedConcerns = useUserConcernsStore(s => s.concerns);
  const userConcerns = [
    ...MOCK_CONCERNS.filter(c => c.userId === 'u-001' && !c.deletedAt && c.status !== 'draft'),
    ...userCreatedConcerns,
  ];
  const userProposalCount = MOCK_PROPOSALS.filter(p => p.isActive && p.status === 'sent' && !p.viewedAt).length;
  const phase: UserPhase = userConcerns.length === 0 ? 'idle' : userProposalCount > 0 ? 'proposals_ready' : 'waiting';

  const proposals = MOCK_PROPOSALS
    .filter(p => p.isActive && p.status !== 'draft')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <div className="flex flex-col pb-28">

      {/* ═══════════════════════════════════════
          HERO — 감정 기반 문제 인식 → 행동 유도
          [공감 → 불안 → 해결 → 행동]
         ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* 감정 이미지 — 거울 앞에서 고민하는 모습 */}
        <div className="relative w-full aspect-[4/5] max-h-[24rem]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f5ebe0] via-[#f0e6da] to-[#e8ddd0]" />
          {/* 이미지 위 하단 그라디언트 (텍스트 가독성) */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/90 to-transparent" />
          {/* 감정 텍스트 오버레이 — 이미지 하단 */}
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-[12px] text-[var(--color-text-dim)] italic">
              &ldquo;{t('landing.heroEmpathy')}&rdquo;
            </p>
          </div>
        </div>

        {/* 텍스트 + CTA */}
        <div className="px-5 pt-4 pb-8">
          {/* Headline — 공감 */}
          <h1 className="text-[1.625rem] font-bold text-[var(--color-text)] leading-[1.3] tracking-[-0.4px] mb-2 whitespace-pre-line">
            {t('landing.heroTitle')}
          </h1>

          {/* Sub — 불안 해소 + 해결 제시 */}
          <p className="text-[13px] text-[var(--color-text-secondary)] leading-[1.6] mb-5 whitespace-pre-line">
            {t('landing.heroSubtitle')}
          </p>

          {/* CTA — phase에 따라 분기 */}
          {phase === 'proposals_ready' ? (
            <Link href="/decision" className="w-full no-underline block">
              <Button variant="accent" size="lg" fullWidth>
                {t('sticky.checkProposals')}
                <ArrowRight size={18} />
              </Button>
            </Link>
          ) : (
            <Link href="/consult" className="w-full no-underline block">
              <Button variant="accent" size="lg" fullWidth>
                {t('landing.cta')}
                <ArrowRight size={18} />
              </Button>
            </Link>
          )}

          {/* 신뢰 마이크로카피 */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <ShieldCheck size={12} className="text-[var(--color-text-dim)]" />
            <span className="text-[10.5px] text-[var(--color-text-dim)]">
              {phase === 'proposals_ready'
                ? `${userProposalCount}개 병원의 맞춤 제안이 대기 중`
                : t('landing.trustMicrocopy')}
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HOW IT WORKS — 3단계 (간결)
         ═══════════════════════════════════════ */}
      <section className="px-5 pb-8">
        <div className="flex gap-2">
          {[
            { step: '1', title: t('landing.stepUpload'), icon: Camera },
            { step: '2', title: t('landing.stepInput'), icon: MessageCircle },
            { step: '3', title: t('landing.stepReceive'), icon: FileText },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[var(--color-bg-secondary)]">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <Icon size={15} className="text-[var(--color-primary)]" />
                </div>
                <span className="text-[11px] font-semibold text-[var(--color-text)]">{item.title}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[10.5px] text-[var(--color-text-dim)] text-center mt-2">
          {t('landing.avgDelivery')}
        </p>
      </section>

      {/* ═══════════════════════════════════════
          PAIN-BASED CONCERNS — 공감 기반 진입
         ═══════════════════════════════════════ */}
      <section className="px-5 pb-8">
        <h2 className="text-[1.0625rem] font-bold text-[var(--color-text)] tracking-[-0.18px] mb-3">{t('landing.concernsTitle')}</h2>
        <div className="flex flex-col gap-2">
          {CONCERN_DEFS.map((c, i) => (
            <Link key={i} href={`/consult?area=${c.area}&detail=${c.detail}`}
              className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-white no-underline"
              style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }}>
              <span className="text-[14px] text-[var(--color-text)]">{t(c.key)}</span>
              <ChevronRight size={16} className="text-[var(--color-text-dim)]" />
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURED — 요즘 많이 상담하는 변화
         ═══════════════════════════════════════ */}
      {proposals.length > 0 && (
        <section className="px-5 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[1.0625rem] font-bold text-[var(--color-text)] tracking-[-0.18px]">{t('landing.featuredTitle')}</h2>
            <Link href="/decision" className="flex items-center gap-0.5 text-[11px] text-[var(--color-text-dim)] no-underline">
              {t('common.viewAll')} <ChevronRight size={14} />
            </Link>
          </div>

          {(() => {
            const p = proposals[0];
            const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
            const items = MOCK_PROPOSAL_ITEMS.filter(i => i.proposalId === p.id);
            const meta = `회복 ${p.recoveryDays}일 · ${p.anesthesiaType === 'local' ? '부분' : p.anesthesiaType === 'sedation' ? '수면' : '전신'}마취`;
            return (
              <Link href="/decision" className="no-underline block mb-3">
                <ExperienceCard
                  variant="primary"
                  gradient={G[0]}
                  valueProp={VALUE_PROPS[p.memberId] || profile?.description || ''}
                  hospitalName={profile?.hospitalName || ''}
                  verified={profile?.verified}
                  rating={4.8}
                  price={p.totalPrice}
                  meta={meta}
                  coverTags={items.slice(0, 2).map(i => i.treatmentName)}
                  quote={p.consultationNote}
                  unread={!p.viewedAt}
                />
              </Link>
            );
          })()}

          <div className="flex flex-col gap-3">
            {proposals.slice(1, 3).map((p, idx) => {
              const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
              const items = MOCK_PROPOSAL_ITEMS.filter(i => i.proposalId === p.id);
              const meta = `회복 ${p.recoveryDays}일 · ${p.anesthesiaType === 'local' ? '부분' : p.anesthesiaType === 'sedation' ? '수면' : '전신'}마취`;
              return (
                <Link key={p.id} href="/decision" className="no-underline block">
                  <ExperienceCard
                    variant="secondary"
                    gradient={G[(idx + 1) % G.length]}
                    valueProp={VALUE_PROPS[p.memberId] || profile?.description || ''}
                    hospitalName={profile?.hospitalName || ''}
                    verified={profile?.verified}
                    rating={4.8}
                    price={p.totalPrice}
                    meta={meta}
                    coverTags={items.slice(0, 2).map(i => i.treatmentName)}
                    quote={p.consultationNote}
                    unread={!p.viewedAt}
                  />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════
          ARTICLES
         ═══════════════════════════════════════ */}
      <section className="px-5 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[1.0625rem] font-bold text-[var(--color-text)] tracking-[-0.18px]">{t('landing.articlesTitle')}</h2>
          <Link href="/articles" className="flex items-center gap-0.5 text-[11px] text-[var(--color-text-dim)] no-underline">
            더보기 <ChevronRight size={14} />
          </Link>
        </div>
        <div className="flex flex-col gap-2.5">
          {[
            { title: '쌍꺼풀 수술, 매몰 vs 절개 어떻게 다를까?', tag: '시술 가이드', color: 'info' as const, gradient: 'from-[#e3f2fd] to-[#bbdefb]' },
            { title: '코성형 평균 가격과 주의사항', tag: '비용 가이드', color: 'default' as const, gradient: 'from-[#fff3e0] to-[#ffe0b2]' },
            { title: '리프팅 부작용, 이것만은 꼭 확인하세요', tag: '안전 정보', color: 'danger' as const, gradient: 'from-[#fce4ec] to-[#f8bbd0]' },
          ].map((a, i) => (
            <Link key={i} href="/articles"
              className="flex gap-3 p-3 rounded-xl bg-white no-underline"
              style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)' }}>
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                <div className={`w-full h-full bg-gradient-to-br ${a.gradient}`} />
              </div>
              <div className="flex flex-col gap-1 justify-center min-w-0">
                <Badge variant={a.color} size="sm">{a.tag}</Badge>
                <span className="text-[13px] font-medium text-[var(--color-text)] leading-snug line-clamp-2">{a.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TRUST
         ═══════════════════════════════════════ */}
      <section className="px-5 pb-6">
        <div className="flex items-center justify-center px-3 py-4 rounded-xl bg-[var(--color-bg-secondary)]">
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[1rem] font-bold text-[var(--color-text)]">150+</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">{t('landing.trustHospitals')}</span>
          </div>
          <div className="w-px h-7 bg-[var(--color-border-light)]" />
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[1rem] font-bold text-[var(--color-text)]">98%</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">{t('landing.trustResponseRate')}</span>
          </div>
          <div className="w-px h-7 bg-[var(--color-border-light)]" />
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[1rem] font-bold text-[var(--color-text)]">4.8</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">{t('landing.trustSatisfaction')}</span>
          </div>
        </div>
      </section>

      {/* ═══ Sticky CTA ═══ */}
      <StickyConsultCTA phase={phase} unreadCount={userProposalCount} />
    </div>
  );
}
