'use client';

import { use } from 'react';
import Link from 'next/link';
import { MOCK_CONCERNS, MOCK_PROPOSALS, MOCK_CONCERN_PHOTOS, MOCK_PARTNER_PROFILES, MOCK_PROPOSAL_ITEMS, track } from '@hyliren/shared';
import { Button, Badge } from '@hyliren/ui';
import {
  ArrowRight, Plus, Edit3, Camera, FileText, ChevronRight,
  Sparkles, Clock, ShieldCheck, MessageCircle, BookOpen,
} from 'lucide-react';
import { computeConcernActions, getRecommendedArticles, STATUS_LABELS, STATUS_COLORS } from '@/lib/lifecycle';

interface Props { params: Promise<{ id: string }>; }

export default function ConcernDetailPage({ params }: Props) {
  const { id } = use(params);
  const concern = MOCK_CONCERNS.find(c => c.id === id) || MOCK_CONCERNS[0];
  const proposals = MOCK_PROPOSALS.filter(p => p.concernId === concern.id && p.isActive);
  const photos = MOCK_CONCERN_PHOTOS.filter(p => p.concernId === concern.id);
  const actions = computeConcernActions(concern, MOCK_PROPOSALS);
  const articles = getRecommendedArticles(concern.bodyArea, concern.status);

  return (
    <div className="flex flex-col px-5 pt-5 pb-10">

      {/* ── Header ── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={STATUS_COLORS[concern.status]}>{STATUS_LABELS[concern.status]}</Badge>
          <Badge variant="info">{concern.bodyArea}</Badge>
          {concern.bodyAreaDetail && (
            <span className="text-[12px] text-[var(--color-text-dim)]">{concern.bodyAreaDetail}</span>
          )}
        </div>
        <h1 className="text-[1.375rem] font-bold text-[var(--color-text)] leading-tight">
          {concern.bodyArea} 고민
        </h1>
      </div>

      {/* ── Photos ── */}
      <div className="flex gap-2 mb-5">
        {photos.map(p => (
          <div key={p.id} className="w-20 h-20 rounded-xl bg-[var(--color-bg-secondary)] flex items-center justify-center">
            <Camera size={24} className="text-[var(--color-text-dim)]" />
          </div>
        ))}
        {actions.canAddPhotos && (
          <button
            onClick={() => track({ eventType: 'concern_photo_added', actorType: 'user', targetType: 'concern', targetId: concern.id, metadata: { source: 'fo', locale: 'ko' } })}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center gap-1 cursor-pointer bg-transparent">
            <Plus size={18} className="text-[var(--color-text-dim)]" />
            <span className="text-[9px] text-[var(--color-text-dim)]">추가</span>
          </button>
        )}
      </div>

      {/* ── Description ── */}
      <div className="rounded-2xl bg-white px-4 py-3.5 mb-4"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{concern.description}</p>
        <div className="flex gap-3 mt-3 text-[12px] text-[var(--color-text-dim)]">
          <span>예산 {concern.budgetMin}~{concern.budgetMax}만</span>
          {concern.visitDateFrom && <span>방문 {concern.visitDateFrom.slice(5)}~</span>}
          <span>{concern.hasPassport ? '여권 보유' : '여권 미보유'}</span>
        </div>
        {actions.editable && (
          <Link href="/consult" className="flex items-center gap-1 mt-3 text-[12px] font-medium text-[var(--color-primary)] no-underline"
            onClick={() => track({ eventType: 'concern_edited', actorType: 'user', targetType: 'concern', targetId: concern.id, metadata: { source: 'fo', locale: 'ko' } })}>
            <Edit3 size={12} /> 수정하기
          </Link>
        )}
      </div>

      {/* ── Primary Action ── */}
      <div className="mb-5">
        <Link href={actions.nextActionHref} className="no-underline block">
          <Button variant="accent" size="lg" fullWidth>
            {actions.nextAction}
            <ArrowRight size={18} />
          </Button>
        </Link>
      </div>

      {/* ── Proposals (if any) ── */}
      {proposals.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-[var(--color-text)]">받은 제안서</h2>
            <Link href={`/concerns/${concern.id}/proposals`} className="flex items-center gap-0.5 text-[11px] text-[var(--color-text-dim)] no-underline">
              전체보기 <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {proposals.slice(0, 3).map(p => {
              const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
              return (
                <Link key={p.id} href={`/concerns/${concern.id}/proposals`} className="no-underline block">
                  <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center text-[12px] font-bold text-[var(--color-text-dim)] shrink-0">
                      {(profile?.hospitalName || '병')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-medium text-[var(--color-text)]">{profile?.hospitalName}</span>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-dim)]">
                        <span>{p.totalPrice}만원</span>
                        <span>회복 {p.recoveryDays}일</span>
                      </div>
                    </div>
                    {!p.viewedAt && <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Decision Assist (comparing 상태) ── */}
      {actions.canBuyReport && (
        <div className="rounded-2xl bg-gradient-to-r from-[var(--color-primary-soft)] to-[#fff5f7] px-4 py-4 mb-5">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles size={14} className="text-[var(--color-primary)]" />
            <span className="text-[13px] font-semibold text-[var(--color-text)]">이 차이가 어떤 의미인지 모르겠다면</span>
          </div>
          <p className="text-[12px] text-[var(--color-text-dim)] mb-3">
            가격과 회복기간이 왜 다른지, 과잉진료는 아닌지 분석해드립니다
          </p>
          <Button variant="primary" size="md" fullWidth
            onClick={() => track({ eventType: 'report_cta_clicked', actorType: 'user', targetType: 'concern', targetId: concern.id, metadata: { source: 'fo', locale: 'ko', label: 'concern_detail' } })}>
            검증 리포트 알아보기
          </Button>
        </div>
      )}

      {/* ── Execution Services (selected 상태) ── */}
      {actions.canBuyService && (
        <div className="rounded-2xl bg-white px-4 py-4 mb-5"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 className="text-[14px] font-semibold text-[var(--color-text)] mb-3">서비스 준비</h3>
          <div className="flex flex-col gap-2">
            {['일정 관리', '통역 서비스', '픽업 서비스'].map(service => (
              <div key={service} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[var(--color-bg-secondary)]">
                <span className="text-[13px] text-[var(--color-text)]">{service}</span>
                <ChevronRight size={14} className="text-[var(--color-text-dim)]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recommended Articles ── */}
      <section className="mb-5">
        <h2 className="text-[15px] font-bold text-[var(--color-text)] mb-3">관련 정보</h2>
        <div className="flex flex-col gap-2">
          {articles.slice(0, 2).map((a, i) => (
            <Link key={i} href="/articles" className="flex gap-3 p-3 rounded-xl bg-white no-underline"
              style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)' }}>
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                <div className={`w-full h-full bg-gradient-to-br ${a.gradient}`} />
              </div>
              <div className="flex flex-col gap-0.5 justify-center min-w-0">
                <Badge variant={a.tagColor}>{a.tag}</Badge>
                <span className="text-[12px] font-medium text-[var(--color-text)] leading-snug line-clamp-1">{a.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Re-entry CTA ── */}
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[var(--color-bg-secondary)]">
        <MessageCircle size={18} className="text-[var(--color-text-dim)]" />
        <div className="flex-1">
          <span className="text-[13px] text-[var(--color-text-secondary)]">다른 부위도 고민 중이신가요?</span>
        </div>
        <Link href="/consult" className="no-underline"
          onClick={() => track({ eventType: 'reentry_cta_clicked', actorType: 'user', targetType: 'concern', targetId: concern.id, metadata: { source: 'fo', locale: 'ko', label: 'concern_detail' } })}>
          <Button variant="ghost" size="sm">등록하기</Button>
        </Link>
      </div>
    </div>
  );
}
