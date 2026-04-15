'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_CONCERNS, MOCK_PROPOSALS, MOCK_PROPOSAL_ITEMS, MOCK_PARTNER_PROFILES, track } from '@hyliren/shared';
import { Button, Badge, MobileBottomCTA } from '@hyliren/ui';
import {
  ShieldCheck, Check, ChevronRight, Sparkles,
  AlertTriangle, Activity, BarChart3,
} from 'lucide-react';
import { CARD_GRADIENTS } from '@/lib/constants';
import { ReportNudgeSheet } from '@/components/decision/ReportNudgeSheet';
import { CompareReport } from '@/components/decision/CompareReport';
import { useDecisionStore } from '@/store/decision';
import { useLocaleStore } from '@/store/locale';
import { use } from 'react';

interface Props { params: Promise<{ id: string }>; }

export default function ComparePage({ params }: Props) {
  const t = useLocaleStore(s => s.t);
  const router = useRouter();
  const { id } = use(params);
  const concern = MOCK_CONCERNS.find(c => c.id === id);
  if (!concern) {
    return <div className="p-8 text-center text-[var(--color-text-secondary)]">{t('concern.notFound')}</div>;
  }
  const proposals = MOCK_PROPOSALS
    .filter(p => p.concernId === concern.id && p.isActive && p.status !== 'draft')
    .sort((a, b) => a.totalPrice - b.totalPrice);

  const { selectedProposalIds, toggleSelect } = useDecisionStore();
  // Compare 페이지에서는 단일 선택 (최종 선택용)
  const selectedId = proposals.find(p => selectedProposalIds.has(p.id))?.id || null;
  const [showCompareReport, setShowCompareReport] = useState(false);

  useEffect(() => {
    track({ eventType: 'compare_entered', actorType: 'user', targetType: 'concern', targetId: concern.id, metadata: { source: 'fo', locale: 'ko', value: String(proposals.length) } });
  }, [concern.id, proposals.length]);

  if (proposals.length === 0) {
    return <div className="p-8 text-center text-[var(--color-text-secondary)]">{t('proposal.compare.noProposals')}</div>;
  }

  const lowestPrice = Math.min(...proposals.map(p => p.totalPrice));
  const fastestRecovery = Math.min(...proposals.map(p => p.recoveryDays));

  return (
    <>
      <div className="pb-24">
        {/* ── Header ── */}
        <div className="px-5 pt-7 pb-4">
          <div className="flex items-center gap-2 mb-1">
            {concern.bodyAreas.map(a => <Badge key={a} variant="info" size="sm">{a}</Badge>)}
          </div>
          <h1 className="text-[1.5rem] font-bold text-[var(--color-text)] leading-tight">
            {t('proposal.compare.title', { count: proposals.length })}
          </h1>
        </div>

        {/* ══════════════════════════════════════
           제안 카드 — 스와이프 형태
           ══════════════════════════════════════ */}
        <div className="flex gap-3 px-5 pb-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {proposals.map((p, idx) => {
            const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
            const items = MOCK_PROPOSAL_ITEMS.filter(i => i.proposalId === p.id);
            const isActive = selectedId === p.id;
            const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
            const avgPrice = Math.round(p.totalPrice * 1.1);

            return (
              <button key={p.id} type="button"
                onClick={() => toggleSelect(p.id)}
                className={`flex flex-col min-w-[16rem] max-w-[17rem] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 text-left bg-white p-0 ${
                  isActive ? 'border-[var(--color-primary)] shadow-[0_0_0_2px_var(--color-primary-soft)]' : 'border-[var(--color-border-light)]'
                }`}>

                {/* Cover */}
                <div className={`h-24 bg-gradient-to-br ${gradient} relative`}>
                  {isActive && (
                    <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                      <Check size={14} strokeWidth={3} className="text-white" />
                    </div>
                  )}
                  {profile?.verified && (
                    <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white/90 text-[9px] font-semibold text-emerald-600">
                      <ShieldCheck size={9} /> {t('common.verified')}
                    </span>
                  )}
                  {p.totalPrice === lowestPrice && (
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-[9px] font-bold text-white">
                      {t('proposal.compare.lowestPrice')}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="px-3.5 pt-3 pb-3.5">
                  <span className="text-[13px] font-semibold text-[var(--color-text)] block mb-1">{profile?.hospitalName}</span>

                  {/* Price */}
                  <span className="text-[1.25rem] font-bold text-[var(--color-text)] block mb-2">{p.totalPrice}{t('common.currency')}</span>

                  {/* Key metrics — visual */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[var(--color-text-dim)]">{t('common.recovery')}</span>
                      <span className={`text-[11px] font-semibold ${p.recoveryDays === fastestRecovery ? 'text-emerald-600' : 'text-[var(--color-text)]'}`}>
                        {p.recoveryDays}{t('common.days')} {p.recoveryDays === fastestRecovery && '✓'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[var(--color-text-dim)]">{t('common.anesthesia')}</span>
                      <span className="text-[11px] text-[var(--color-text)]">
                        {p.anesthesiaType === 'local' ? t('common.anesthesiaLocalShort') : p.anesthesiaType === 'sedation' ? t('common.anesthesiaSedationShort') : t('common.anesthesiaGeneralShort')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[var(--color-text-dim)]">{t('common.treatmentItems')}</span>
                      <span className="text-[11px] text-[var(--color-text)]">{items.length}{t('common.items')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[var(--color-text-dim)]">{t('common.marketAvg')}</span>
                      <span className={`text-[11px] font-semibold ${p.totalPrice <= avgPrice ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {p.totalPrice <= avgPrice ? t('proposal.compare.fair') : t('proposal.compare.high')}
                      </span>
                    </div>
                  </div>

                  {/* Treatment tags */}
                  <div className="flex gap-1 flex-wrap mt-2.5 pt-2.5 border-t border-[var(--color-border-light)]">
                    {items.map(item => (
                      <span key={item.id} className="px-1.5 py-0.5 rounded text-[9px] bg-[var(--color-bg-secondary)] text-[var(--color-text-dim)]">
                        {item.treatmentName}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════
           비교 인사이트 — 시각적 분석
           ══════════════════════════════════════ */}
        <div className="px-5">
          <h2 className="text-[15px] font-bold text-[var(--color-text)] mb-3">{t('proposal.compare.insights')}</h2>

          {/* Price comparison bar */}
          <div className="rounded-2xl border border-[var(--color-border-light)] overflow-hidden mb-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-bg-secondary)]">
              <BarChart3 size={14} className="text-[var(--color-primary)]" />
              <span className="text-[12px] font-semibold text-[var(--color-text)]">{t('proposal.compare.priceCompare')}</span>
            </div>
            <div className="px-4 py-3">
              {proposals.map(p => {
                const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
                const maxPrice = Math.max(...proposals.map(pp => pp.totalPrice));
                const barWidth = Math.max((p.totalPrice / maxPrice) * 100, 20);
                return (
                  <div key={p.id} className={`flex items-center gap-3 py-2 ${selectedId === p.id ? '' : ''}`}>
                    <span className="text-[11px] text-[var(--color-text-secondary)] w-16 shrink-0 truncate">{profile?.hospitalName?.split(' ')[0]}</span>
                    <div className="flex-1 h-6 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full flex items-center justify-end pr-2 transition-all ${
                          p.totalPrice === lowestPrice ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                        }`}
                        style={{ width: `${barWidth}%` }}>
                        <span className={`text-[10px] font-bold ${p.totalPrice === lowestPrice ? 'text-white' : 'text-[var(--color-text)]'}`}>
                          {p.totalPrice}{t('common.man')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recovery comparison */}
          <div className="rounded-2xl border border-[var(--color-border-light)] overflow-hidden mb-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-bg-secondary)]">
              <Activity size={14} className="text-[var(--color-primary)]" />
              <span className="text-[12px] font-semibold text-[var(--color-text)]">{t('proposal.compare.recoveryCompare')}</span>
            </div>
            <div className="px-4 py-3">
              {proposals.map(p => {
                const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
                const maxDays = Math.max(...proposals.map(pp => pp.recoveryDays));
                const barWidth = Math.max((p.recoveryDays / maxDays) * 100, 20);
                return (
                  <div key={p.id} className="flex items-center gap-3 py-2">
                    <span className="text-[11px] text-[var(--color-text-secondary)] w-16 shrink-0 truncate">{profile?.hospitalName?.split(' ')[0]}</span>
                    <div className="flex-1 h-6 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full flex items-center justify-end pr-2 ${
                          p.recoveryDays === fastestRecovery ? 'bg-emerald-400' : 'bg-[var(--color-border)]'
                        }`}
                        style={{ width: `${barWidth}%` }}>
                        <span className={`text-[10px] font-bold ${p.recoveryDays === fastestRecovery ? 'text-white' : 'text-[var(--color-text)]'}`}>
                          {p.recoveryDays}{t('common.days')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Risk comparison */}
          <div className="rounded-2xl border border-[var(--color-border-light)] overflow-hidden mb-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-bg-secondary)]">
              <AlertTriangle size={14} className="text-[var(--color-primary)]" />
              <span className="text-[12px] font-semibold text-[var(--color-text)]">{t('proposal.compare.riskCompare')}</span>
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              {proposals.map(p => {
                const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
                const riskScore = p.anesthesiaType === 'general' ? '보통' : p.anesthesiaType === 'sedation' ? '낮음' : '매우 낮음';
                const riskColor = p.anesthesiaType === 'general' ? 'text-amber-600' : 'text-emerald-600';
                return (
                  <div key={p.id} className="flex items-center gap-3 py-1.5">
                    <span className="text-[11px] text-[var(--color-text-secondary)] w-16 shrink-0 truncate">{profile?.hospitalName?.split(' ')[0]}</span>
                    <span className="text-[11px] text-[var(--color-text)] flex-1">
                      {p.anesthesiaType === 'local' ? t('common.anesthesiaLocal') : p.anesthesiaType === 'sedation' ? t('common.anesthesiaSedation') : t('common.anesthesiaGeneral')}
                      {p.hospitalStayDays > 0 ? ` · ${t('proposal.compare.dayRecovery', { days: p.hospitalStayDays })}` : ` · ${t('proposal.compare.sameDay')}`}
                    </span>
                    <span className={`text-[11px] font-semibold ${riskColor}`}>{riskScore}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Analysis CTA */}
          <div className="rounded-2xl bg-gradient-to-r from-[var(--color-primary-soft)] to-[#fff5f7] px-4 py-4 mt-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles size={15} className="text-[var(--color-primary)]" />
              <span className="text-[13px] font-semibold text-[var(--color-text)]">{t('proposal.compare.analysisCta')}</span>
            </div>
            <p className="text-[11px] text-[var(--color-text-dim)] leading-relaxed mb-3">
              {t('proposal.compare.analysisDesc')}
            </p>
            <Button variant="accent" size="md" fullWidth
              onClick={() => {
                track({ eventType: 'report_cta_clicked', actorType: 'user', targetType: 'concern', targetId: concern.id, metadata: { source: 'fo', locale: 'ko', label: 'compare_page' } });
                setShowCompareReport(true);
              }}>
              {t('proposal.compare.analysisAction')}
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <div className="h-8" />
      </div>

      {/* ── Sticky CTA ── */}
      <MobileBottomCTA>
        {selectedId ? (
          <Button variant="primary" fullWidth size="lg"
            onClick={() => {
              track({ eventType: 'hospital_selected', actorType: 'user', targetType: 'proposal', targetId: selectedId, metadata: { source: 'fo', locale: 'ko', label: concern.primaryArea } });
              router.push(`/concerns/${concern.id}`);
            }}>
            {t('proposal.compare.selectButton')}
          </Button>
        ) : (
          <div className="w-full text-center text-[13px] text-[var(--color-text-dim)] py-1">
            {t('proposal.compare.tapToSelect')}
          </div>
        )}
      </MobileBottomCTA>

      <ReportNudgeSheet concernId={concern.id} proposalId={selectedId || proposals[0]?.id || ''} delay={5000} />

      {/* Compare Report */}
      {showCompareReport && (
        <CompareReport
          proposals={proposals}
          profiles={MOCK_PARTNER_PROFILES}
          items={MOCK_PROPOSAL_ITEMS}
          concernId={concern.id}
          onClose={() => setShowCompareReport(false)}
        />
      )}

    </>
  );
}
