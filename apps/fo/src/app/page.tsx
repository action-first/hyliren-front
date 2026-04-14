'use client';

import Link from 'next/link';
import { MOCK_PROPOSALS, MOCK_PARTNER_PROFILES, MOCK_PROPOSAL_ITEMS, MOCK_CONCERNS } from '@hyliren/shared';
import { Button, Badge } from '@hyliren/ui';
import { ArrowRight, Camera, MessageCircle, FileText, ChevronRight } from 'lucide-react';
import { ExperienceCard } from '@/components/common/ExperienceCard';
import { StickyConsultCTA } from '@/components/common/StickyConsultCTA';
import { VALUE_PROPS, CARD_GRADIENTS as G } from '@/lib/constants';

type UserPhase = 'idle' | 'waiting' | 'proposals_ready';

/* ── pain-based concerns (카테고리 대체) ── */
const CONCERNS = [
  { label: '눈이 답답해 보여요', area: '눈', detail: '쌍꺼풀' },
  { label: '코가 낮고 둥글어요', area: '코', detail: '코끝 성형' },
  { label: '자연스럽게 어려 보이고 싶어요', area: '리프팅', detail: '리프팅' },
  { label: '피부가 칙칙하고 흉터가 있어요', area: '피부', detail: '피부관리' },
  { label: '얼굴 라인을 정리하고 싶어요', area: '리프팅', detail: '안면윤곽' },
  { label: '눈밑이 피곤해 보여요', area: '눈', detail: '눈밑지방' },
];

export default function HomePage() {
  /* ── mock user state (inside component for reactivity) ── */
  const userConcerns = MOCK_CONCERNS.filter(c => c.userId === 'u-001' && !c.deletedAt && c.status !== 'draft');
  const userProposalCount = MOCK_PROPOSALS.filter(p => p.isActive && p.status === 'sent' && !p.viewedAt).length;
  const phase: UserPhase = userConcerns.length === 0 ? 'idle' : userProposalCount > 0 ? 'proposals_ready' : 'waiting';

  const proposals = MOCK_PROPOSALS
    .filter(p => p.isActive && p.status !== 'draft')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <div className="flex flex-col pb-28">

      {/* ═══════════════════════════════════════
          HERO — 감정형, 상담 유도
         ═══════════════════════════════════════ */}
      <section className="relative px-5 pt-10 pb-9 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#fff5f7] via-white to-white" />
        <div className="relative flex flex-col items-center text-center">
          <h1 className="text-[1.75rem] font-extrabold text-[var(--color-text)] leading-[1.25] tracking-[-0.5px] mb-2.5">
            예뻐지고 싶은데<br />뭘 해야 할지 모르겠다면
          </h1>
          <p className="text-[13px] text-[var(--color-text-dim)] leading-[1.6] mb-7">
            사진 3장과 고민만 남기면<br />
            검증된 한국 병원이 맞춤 제안서를 보내드립니다
          </p>
          <div className="w-full">
            <Link href="/consult" className="w-full no-underline block">
              <Button variant="accent" size="lg" fullWidth>
                무료 고민 상담 시작하기
                <ArrowRight size={18} />
              </Button>
            </Link>
            <p className="text-[10.5px] text-[var(--color-text-dim)] mt-2">
              사진 3장 + 고민만 입력하면 됩니다
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HOW IT WORKS — 상담 기대값
         ═══════════════════════════════════════ */}
      <section className="px-5 pt-8 pb-9">
        <h2 className="text-[1.0625rem] font-bold text-[var(--color-text)] tracking-[-0.18px] mb-4">이렇게 진행됩니다</h2>
        <div className="flex flex-col gap-3">
          {[
            { icon: Camera, step: '1', title: '사진 업로드', desc: '정면 · 측면 · 확대 3장' },
            { icon: MessageCircle, step: '2', title: '고민 입력', desc: '자유롭게 고민을 적어주세요' },
            { icon: FileText, step: '3', title: '맞춤 제안 수신', desc: '보통 2~5개 병원이 제안서를 보냅니다' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-white"
                style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)' }}>
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary-soft)] flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-[var(--color-primary)]" />
                </div>
                <div className="flex-1">
                  <span className="text-[14px] font-semibold text-[var(--color-text)]">{item.title}</span>
                  <span className="text-[12px] text-[var(--color-text-dim)] block mt-0.5">{item.desc}</span>
                </div>
                <span className="w-6 h-6 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center text-[11px] font-bold text-[var(--color-text-dim)] shrink-0">
                  {item.step}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-[var(--color-text-dim)] text-center mt-3">
          평균 24~48시간 내 제안 도착 · 150+ 인증 병원
        </p>
      </section>

      {/* ═══════════════════════════════════════
          PAIN-BASED CONCERNS — 공감 기반 진입
         ═══════════════════════════════════════ */}
      <section className="px-5 pb-9">
        <h2 className="text-[1.0625rem] font-bold text-[var(--color-text)] tracking-[-0.18px] mb-3.5">어떤 고민이 있으신가요?</h2>
        <div className="flex flex-col gap-2">
          {CONCERNS.map((c, i) => (
            <Link key={i} href={`/consult?area=${c.area}&detail=${c.detail}`}
              className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-white no-underline"
              style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }}>
              <span className="text-[14px] text-[var(--color-text)]">{c.label}</span>
              <ChevronRight size={16} className="text-[var(--color-text-dim)]" />
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURED — 요즘 많이 상담하는 변화
         ═══════════════════════════════════════ */}
      {proposals.length > 0 && (
        <section className="px-5 pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[1.0625rem] font-bold text-[var(--color-text)] tracking-[-0.18px]">요즘 많이 상담하는 변화</h2>
            <Link href="/decision" className="flex items-center gap-0.5 text-[11px] text-[var(--color-text-dim)] no-underline">
              전체보기 <ChevronRight size={14} />
            </Link>
          </div>

          {/* Primary card */}
          {(() => {
            const p = proposals[0];
            const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
            const items = MOCK_PROPOSAL_ITEMS.filter(i => i.proposalId === p.id);
            const meta = `회복 ${p.recoveryDays}일 · ${p.anesthesiaType === 'local' ? '부분' : p.anesthesiaType === 'sedation' ? '수면' : '전신'}마취`;
            return (
              <Link href={`/concerns/${p.concernId}/proposals`} className="no-underline block mb-3.5">
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
                />
              </Link>
            );
          })()}

          {/* Secondary cards */}
          <div className="flex flex-col gap-3">
            {proposals.slice(1, 3).map((p, idx) => {
              const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
              const items = MOCK_PROPOSAL_ITEMS.filter(i => i.proposalId === p.id);
              const meta = `회복 ${p.recoveryDays}일 · ${p.anesthesiaType === 'local' ? '부분' : p.anesthesiaType === 'sedation' ? '수면' : '전신'}마취`;
              return (
                <Link key={p.id} href={`/concerns/${p.concernId}/proposals`} className="no-underline block">
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
                  />
                </Link>
              );
            })}
          </div>

          {/* Contextual CTA — 유일한 중간 CTA */}
          <Link href="/consult" className="flex items-center justify-center gap-1.5 mt-5 py-3 rounded-xl bg-[var(--color-bg-secondary)] no-underline">
            <span className="text-[13px] text-[var(--color-text-secondary)]">어떤 시술이 맞을지 모르겠다면</span>
            <span className="text-[13px] font-semibold text-[var(--color-primary)]">상담 받기</span>
          </Link>
        </section>
      )}

      {/* ═══════════════════════════════════════
          ARTICLES — 루프 콘텐츠
         ═══════════════════════════════════════ */}
      <section className="px-5 pb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[1.0625rem] font-bold text-[var(--color-text)] tracking-[-0.18px]">상담 전에 읽어보세요</h2>
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
          TRUST — 분산 신뢰
         ═══════════════════════════════════════ */}
      <section className="px-5 pb-6">
        <div className="flex items-center justify-center px-3 py-4 rounded-xl bg-[var(--color-bg-secondary)]">
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[1rem] font-bold text-[var(--color-text)]">150+</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">인증 병원</span>
          </div>
          <div className="w-px h-7 bg-[var(--color-border-light)]" />
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[1rem] font-bold text-[var(--color-text)]">98%</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">응답률</span>
          </div>
          <div className="w-px h-7 bg-[var(--color-border-light)]" />
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[1rem] font-bold text-[var(--color-text)]">4.8</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">만족도</span>
          </div>
        </div>
      </section>

      {/* ═══ Sticky CTA ═══ */}
      <StickyConsultCTA phase={phase} proposalCount={userProposalCount} />
    </div>
  );
}
