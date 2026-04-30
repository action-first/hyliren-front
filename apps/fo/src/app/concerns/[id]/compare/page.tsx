'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@hyliren/shared';
import { Button, Badge, MobileBottomCTA, Spinner } from '@hyliren/ui';
import {
  Check, ChevronRight, Sparkles,
  AlertTriangle, Activity, BarChart3,
} from 'lucide-react';
import { CARD_GRADIENTS } from '@/lib/constants';
import { ReportNudgeSheet } from '@/components/decision/ReportNudgeSheet';
import { CompareReport } from '@/components/decision/CompareReport';
import { useDecisionStore } from '@/store/decision';
import { useLocaleStore } from '@/store/locale';
import { useConcern } from '@/lib/hooks/concern';
import { useProposalsForConcern, type ProposalWithHospital } from '@/lib/hooks/proposal';
import { use } from 'react';

interface Props { params: Promise<{ id: string }>; }

export default function ComparePage({ params }: Props) {
  const t = useLocaleStore(s => s.t);
  const router = useRouter();
  const { id } = use(params);

  // ── Hooks 는 early return 이전에 모두 호출한다 (React 규칙). ──
  const { concern } = useConcern(id);
  const { proposals: apiProposals, items: apiItems, loading } = useProposalsForConcern(id);
  const { selectedProposalIds, toggleSelect } = useDecisionStore();
  const [showCompareReport, setShowCompareReport] = useState(false);

  const proposals: ProposalWithHospital[] = apiProposals
    .filter(p => p.isActive && p.status !== 'draft')
    .sort((a, b) => a.totalPrice - b.totalPrice);

  const allItems = apiItems;

  // Compare 페이지에서는 단일 선택 (최종 선택용)
  const selectedId = proposals.find(p => selectedProposalIds.has(p.id))?.id || null;

  useEffect(() => {
    if (!concern) return;
    track({ eventType: 'compare_entered', actorType: 'user', targetType: 'concern', targetId: concern.id, metadata: { source: 'fo', value: String(proposals.length) } });
  }, [concern?.id, proposals.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Early returns — 모든 hook 호출 이후에만 배치. ──
  if (!concern) {
    return <div className="p-8 text-center text-[var(--color-text-secondary)]">{t('concern.notFound')}</div>;
  }
  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  }
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
            const hospitalName = p.hospitalName || t('services.fallbackHospitalName');
            const items = allItems.filter(i => i.proposalId === p.id);
            const isActive = selectedId === p.id;
            const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
            const avgPrice = Math.round(p.totalPrice * 1.1);

            return (
              <button key={p.id} type="button"
                onClick={() => toggleSelect(p.id)}
                className={`flex flex-col min-w-[16rem] max-w-[17rem] rounded-[var(--app-radius-md)] overflow-hidden border-2 transition-all cursor-pointer shrink-0 text-left bg-[var(--color-bg)] p-0 ${
                  isActive ? 'border-[var(--color-primary)] shadow-[0_0_0_2px_var(--color-primary-soft)]' : 'border-[var(--color-border-light)]'
                }`}>

                {/* Cover */}
                <div className={`h-24 bg-gradient-to-br ${gradient} relative`}>
                  {isActive && (
                    <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                      <Check size={14} strokeWidth={3} className="text-white" />
                    </div>
                  )}
                  {p.totalPrice === lowestPrice && (
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-[9px] font-bold text-white">
                      {t('proposal.compare.lowestPrice')}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="px-3.5 pt-3 pb-3.5">
                  <span className="text-[13px] font-semibold text-[var(--color-text)] block mb-1">{hospitalName}</span>

                  {/* Price */}
                  <span className="text-[1.25rem] font-bold text-[var(--color-text)] block mb-2">{p.totalPrice}{t('common.currency')}</span>

                  {/* Key metrics — visual */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[var(--color-text-dim)]">{t('common.recovery')}</span>
                      <span className={`text-[11px] font-semibold ${p.recoveryDays === fastestRecovery ? 'text-[var(--color-success)]' : 'text-[var(--color-text)]'}`}>
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
                      <span className={`text-[11px] font-semibold ${p.totalPrice <= avgPrice ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`}>
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
          <div className="rounded-[var(--app-radius-md)] border border-[var(--color-border-light)] overflow-hidden mb-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-bg-secondary)]">
              <BarChart3 size={14} className="text-[var(--color-primary)]" />
              <span className="text-[12px] font-semibold text-[var(--color-text)]">{t('proposal.compare.priceCompare')}</span>
            </div>
            <div className="px-4 py-3">
              {proposals.map(p => {
                const pHospitalName = p.hospitalName || t('services.fallbackHospitalName');
                const maxPrice = Math.max(...proposals.map(pp => pp.totalPrice));
                const barWidth = Math.max((p.totalPrice / maxPrice) * 100, 20);
                return (
                  <div key={p.id} className={`flex items-center gap-3 py-2 ${selectedId === p.id ? '' : ''}`}>
                    <span className="text-[11px] text-[var(--color-text-secondary)] w-16 shrink-0 truncate">{pHospitalName.split(' ')[0]}</span>
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
          <div className="rounded-[var(--app-radius-md)] border border-[var(--color-border-light)] overflow-hidden mb-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-bg-secondary)]">
              <Activity size={14} className="text-[var(--color-primary)]" />
              <span className="text-[12px] font-semibold text-[var(--color-text)]">{t('proposal.compare.recoveryCompare')}</span>
            </div>
            <div className="px-4 py-3">
              {proposals.map(p => {
                const pHospitalName2 = p.hospitalName || t('services.fallbackHospitalName');
                const maxDays = Math.max(...proposals.map(pp => pp.recoveryDays));
                const barWidth = Math.max((p.recoveryDays / maxDays) * 100, 20);
                return (
                  <div key={p.id} className="flex items-center gap-3 py-2">
                    <span className="text-[11px] text-[var(--color-text-secondary)] w-16 shrink-0 truncate">{pHospitalName2.split(' ')[0]}</span>
                    <div className="flex-1 h-6 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full flex items-center justify-end pr-2 ${
                          p.recoveryDays === fastestRecovery ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]'
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
          <div className="rounded-[var(--app-radius-md)] border border-[var(--color-border-light)] overflow-hidden mb-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-bg-secondary)]">
              <AlertTriangle size={14} className="text-[var(--color-primary)]" />
              <span className="text-[12px] font-semibold text-[var(--color-text)]">{t('proposal.compare.riskCompare')}</span>
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              {proposals.map(p => {
                const riskScore = p.anesthesiaType === 'general' ? t('services.riskGeneralLevel') : p.anesthesiaType === 'sedation' ? t('services.riskSedationLevel') : t('services.riskLocalLevel');
                const riskColor = p.anesthesiaType === 'general' ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]';
                return (
                  <div key={p.id} className="flex items-center gap-3 py-1.5">
                    <span className="text-[11px] text-[var(--color-text-secondary)] w-16 shrink-0 truncate">{p.hospitalName.split(' ')[0]}</span>
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
          <div className="rounded-[var(--app-radius-md)] fo-gradient-accent px-4 py-4 mt-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles size={15} className="text-[var(--color-primary)]" />
              <span className="text-[13px] font-semibold text-[var(--color-text)]">{t('proposal.compare.analysisCta')}</span>
            </div>
            <p className="text-[11px] text-[var(--color-text-dim)] leading-relaxed mb-3">
              {t('proposal.compare.analysisDesc')}
            </p>
            <Button variant="primary" size="md" fullWidth
              onClick={() => {
                track({ eventType: 'report_cta_clicked', actorType: 'user', targetType: 'concern', targetId: concern.id, metadata: { source: 'fo', label: 'compare_page' } });
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
          <Button variant="neutral" fullWidth size="xl"
            onClick={async () => {
              track({ eventType: 'hospital_selected', actorType: 'user', targetType: 'proposal', targetId: selectedId, metadata: { source: 'fo', label: concern.primaryArea } });
              await useDecisionStore.getState().selectHospital(concern.id, selectedId);
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

      {/* ReportNudgeSheet: 사용자가 제안서를 선택한 후에만 표시 */}
      {selectedId && (
        <ReportNudgeSheet concernId={concern.id} proposalId={selectedId} delay={2000} />
      )}

      {/* Compare Report */}
      {showCompareReport && (
        <CompareReport
          proposals={proposals}
          items={allItems}
          concernId={concern.id}
          onClose={() => setShowCompareReport(false)}
        />
      )}

    </>
  );
}
