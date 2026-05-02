'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Proposal, PartnerProfile } from '@hyliren/shared';
import { track } from '@hyliren/shared';
import { Button, BottomSheet } from '@hyliren/ui';
import {
  X, TrendingDown, ShieldCheck, AlertTriangle, Lock,
  CheckCircle, XCircle, BarChart3, Activity, FileCheck,
} from 'lucide-react';
import { useReportStore, type ReportPreview, type FullReport } from '@/store/report';
import { useLocaleStore } from '@/store/locale';

interface Props {
  proposal: Proposal;
  profile: PartnerProfile | undefined;
  onClose: () => void;
}

/* ── Mock generators (i18n 적용) ── */

type T = (key: string, params?: Record<string, string | number>) => string;

function generatePreview(proposal: Proposal, profile: PartnerProfile | undefined, t: T): ReportPreview {
  return {
    proposalId: proposal.id,
    hospitalName: profile?.hospitalName || '',
    priceAdequacy: proposal.totalPrice < 200 ? 'low' : proposal.totalPrice > 400 ? 'high' : 'fair',
    riskLevel: proposal.anesthesiaType === 'general' ? 'medium' : 'low',
    overtreatment: 'none',
    summary: t('report.summaryTemplate', { hospital: profile?.hospitalName ?? '', price: proposal.totalPrice }),
  };
}

function generateFullReport(proposal: Proposal, profile: PartnerProfile | undefined, t: T): FullReport {
  const avgPrice = Math.round(proposal.totalPrice * 1.1);
  return {
    proposalId: proposal.id,
    hospitalName: profile?.hospitalName || '',
    priceScore: proposal.totalPrice < 200 ? 85 : proposal.totalPrice > 400 ? 55 : 72,
    priceVerdict: proposal.totalPrice <= avgPrice
      ? t('report.priceVerdictFair')
      : t('report.priceVerdictHigh'),
    priceBreakdown: [
      { itemName: t('report.itemMainTreatment'), proposalPrice: Math.round(proposal.totalPrice * 0.75), marketAvg: Math.round(proposal.totalPrice * 0.8), marketRange: [Math.round(proposal.totalPrice * 0.5), Math.round(proposal.totalPrice * 1.2)], verdict: 'fair' },
      { itemName: t('report.itemSubTreatment'), proposalPrice: Math.round(proposal.totalPrice * 0.25), marketAvg: Math.round(proposal.totalPrice * 0.3), marketRange: [Math.round(proposal.totalPrice * 0.15), Math.round(proposal.totalPrice * 0.4)], verdict: proposal.totalPrice > 300 ? 'above' : 'below' },
    ],
    overtreatmentVerdict: t('report.overtreatmentVerdictDefault'),
    unnecessaryItems: [],
    necessaryItems: [t('report.necessaryItemMain'), t('report.necessaryItemSub')],
    overallRisk: proposal.anesthesiaType === 'general' ? 'medium' : 'low',
    riskItems: [
      { procedure: t('report.itemMainTreatment'), riskLevel: 'low', description: t('report.riskMainDesc'), recoveryDays: t('report.daysShort', { days: proposal.recoveryDays }), frequency: t('report.riskMainFrequency') },
      ...(proposal.anesthesiaType === 'general' ? [{ procedure: t('report.riskGeneralAnesthesia'), riskLevel: 'medium' as const, description: t('report.riskGeneralDesc'), recoveryDays: t('report.riskGeneralRecovery'), frequency: t('report.riskGeneralFrequency') }] : []),
    ],
    conclusion: t('report.conclusionTemplate', {
      hospital: profile?.hospitalName ?? '',
      verdict: proposal.totalPrice <= avgPrice ? t('report.conclusionFair') : t('report.conclusionHigh'),
    }),
    disclaimer: t('report.disclaimerText'),
  };
}

/* ── Label maps (colors only — text from i18n) ── */
const ADEQUACY_COLOR = { low: 'text-[var(--color-success)]', fair: 'text-[var(--color-text)]', high: 'text-[var(--color-warning)]' };
const RISK_COLOR = { low: 'text-[var(--color-success)]', medium: 'text-[var(--color-warning)]', high: 'text-[var(--color-danger)]' };
const OVER_COLOR = { none: 'text-[var(--color-success)]', suspected: 'text-[var(--color-warning)]', likely: 'text-[var(--color-danger)]' };
const VERDICT_COLOR = { below: 'text-[var(--color-success)]', fair: 'text-[var(--color-text)]', above: 'text-[var(--color-warning)]' };

export function SingleAnalysisPreview({ proposal, profile, onClose }: Props) {
  const t = useLocaleStore(s => s.t);
  const router = useRouter();
  const { markPurchased, isPurchased: checkPurchased, setFullReport } = useReportStore();
  const purchased = checkPurchased(proposal.id);
  const preview = generatePreview(proposal, profile, t);

  useEffect(() => {
    track({ eventType: 'report_preview_viewed', actorType: 'user', targetType: 'proposal', targetId: proposal.id, metadata: { source: 'fo' } });
    if (purchased) {
      setFullReport(generateFullReport(proposal, profile, t));
    }
  }, [proposal.id, purchased]); // eslint-disable-line react-hooks/exhaustive-deps

  const fullReport = purchased ? generateFullReport(proposal, profile, t) : null;

  function handlePurchase() {
    track({ eventType: 'report_purchased', actorType: 'user', targetType: 'proposal', targetId: proposal.id, metadata: { source: 'fo', value: '4900' } });
    // TODO: 백엔드에 payment endpoint 가 추가되면 direct request<T> 로 호출.
    // 현재는 useReportStore (localStorage) 만으로 구매 상태 유지.
    markPurchased(proposal.id);
  }

  return (
    <BottomSheet open onClose={onClose} noPadding scrollable>
        <div className="bg-[var(--color-bg)] rounded-t-3xl" style={{ boxShadow: 'var(--app-shadow-sheet)' }}>
          {/* Header */}
          <div className="sticky top-0 bg-[var(--color-bg)] z-10 flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--color-border-light)]">
            <span className="text-[15px] font-semibold text-[var(--color-text)]">
              {profile?.hospitalName} {purchased ? t('report.verificationReport') : t('report.analysis')}
            </span>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center border-0 cursor-pointer">
              <X size={16} className="text-[var(--color-text-dim)]" />
            </button>
          </div>

          <div className="px-5 py-4">
            {/* ═══ PREVIEW — 3 metrics ═══
                구매 전: 값은 블러 처리하여 호기심 유발 + 리포트 구매 전환 유도.
                구매 후: 값 그대로 노출.
                (CPO 판단: 요약 3줄을 공개하면 사용자가 이미 의사결정해버려 결제 유인이 사라짐.)
               ═══ */}
            <div className="flex flex-col gap-2.5 mb-4">
              {[
                { icon: TrendingDown, label: t('report.priceAdequacy'), value: { low: t('report.priceBelow'), fair: t('report.priceFair'), high: t('report.priceAbove') }[preview.priceAdequacy], color: ADEQUACY_COLOR[preview.priceAdequacy] },
                { icon: AlertTriangle, label: t('report.riskLevel'), value: { low: t('report.riskLow'), medium: t('report.riskMedium'), high: t('report.riskHigh') }[preview.riskLevel], color: RISK_COLOR[preview.riskLevel] },
                { icon: ShieldCheck, label: t('report.overtreatment'), value: { none: t('report.overNone'), suspected: t('report.overSuspected'), likely: t('report.overLikely') }[preview.overtreatment], color: OVER_COLOR[preview.overtreatment] },
              ].map(row => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center gap-3 px-4 py-3.5 rounded-[var(--app-radius)] bg-[var(--color-bg-secondary)]">
                    <Icon size={18} className="text-[var(--color-text-dim)] shrink-0" />
                    <span className="text-[13px] text-[var(--color-text)] flex-1">{row.label}</span>
                    <span
                      className={`text-[13px] font-semibold ${purchased ? row.color : 'text-[var(--color-text-dim)] select-none'}`}
                      style={purchased ? undefined : { filter: 'blur(6px)' }}
                      aria-hidden={!purchased}
                    >
                      {row.value}
                    </span>
                  </div>
                );
              })}
              {!purchased && (
                <p className="text-[11px] text-[var(--color-text-dim)] leading-relaxed px-1 mt-1">
                  {t('report.previewLockedHint')}
                </p>
              )}
            </div>

            {/* ═══ PURCHASED — FULL REPORT ═══ */}
            {purchased && fullReport && (
              <div className="flex flex-col gap-4 mb-5">

                {/* Section 1: 가격 분석 */}
                <div className="rounded-[var(--app-radius-md)] bg-[var(--color-bg)] border border-[var(--color-border-light)] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-bg-secondary)]">
                    <BarChart3 size={15} className="text-[var(--color-primary)]" />
                    <span className="text-[13px] font-semibold text-[var(--color-text)]">{t('report.priceAnalysis')}</span>
                    <span className="ml-auto text-[1rem] font-bold text-[var(--color-primary)]">{fullReport.priceScore}{t('common.score')}</span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed mb-3">{fullReport.priceVerdict}</p>
                    {fullReport.priceBreakdown.map(item => (
                      <div key={item.itemName} className="flex items-center justify-between py-2 border-t border-[var(--color-border-light)]">
                        <div>
                          <span className="text-[12px] font-medium text-[var(--color-text)] block">{item.itemName}</span>
                          <span className="text-[10px] text-[var(--color-text-dim)]">{t('common.marketAvg')} {item.marketAvg}{t('common.man')} ({item.marketRange[0]}~{item.marketRange[1]}{t('common.man')})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[13px] font-bold text-[var(--color-text)] block">{item.proposalPrice}{t('common.man')}</span>
                          <span className={`text-[10px] font-medium ${VERDICT_COLOR[item.verdict]}`}>{{ below: t('report.priceLow'), fair: t('report.priceFair'), above: t('report.priceHigh') }[item.verdict]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: 과잉진료 검증 */}
                <div className="rounded-[var(--app-radius-md)] bg-[var(--color-bg)] border border-[var(--color-border-light)] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-bg-secondary)]">
                    <FileCheck size={15} className="text-[var(--color-primary)]" />
                    <span className="text-[13px] font-semibold text-[var(--color-text)]">{t('report.overtreatmentVerify')}</span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed mb-2">{fullReport.overtreatmentVerdict}</p>
                    {fullReport.necessaryItems.map(item => (
                      <div key={item} className="flex items-start gap-2 py-1.5">
                        <CheckCircle size={13} className="text-[var(--color-success)] shrink-0 mt-0.5" />
                        <span className="text-[11px] text-[var(--color-text)] leading-relaxed">{item}</span>
                      </div>
                    ))}
                    {fullReport.unnecessaryItems.map(item => (
                      <div key={item} className="flex items-start gap-2 py-1.5">
                        <XCircle size={13} className="text-[var(--color-danger)] shrink-0 mt-0.5" />
                        <span className="text-[11px] text-[var(--color-text)] leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: 리스크 평가 */}
                <div className="rounded-[var(--app-radius-md)] bg-[var(--color-bg)] border border-[var(--color-border-light)] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-bg-secondary)]">
                    <Activity size={15} className="text-[var(--color-primary)]" />
                    <span className="text-[13px] font-semibold text-[var(--color-text)]">{t('report.riskAssessment')}</span>
                    <span className={`ml-auto text-[12px] font-semibold ${RISK_COLOR[fullReport.overallRisk]}`}>
                      {t('report.overallRisk', { level: { low: t('report.riskLow'), medium: t('report.riskMedium'), high: t('report.riskHigh') }[fullReport.overallRisk] })}
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    {fullReport.riskItems.map(item => (
                      <div key={item.procedure} className="py-2.5 border-t border-[var(--color-border-light)] first:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-medium text-[var(--color-text)]">{item.procedure}</span>
                          <span className={`text-[11px] font-semibold ${RISK_COLOR[item.riskLevel]}`}>{{ low: t('report.riskLow'), medium: t('report.riskMedium'), high: t('report.riskHigh') }[item.riskLevel]}</span>
                        </div>
                        <p className="text-[11px] text-[var(--color-text-dim)] leading-relaxed mb-1">{item.description}</p>
                        <div className="flex gap-3 text-[10px] text-[var(--color-text-dim)]">
                          <span>{t('common.recovery')}: {item.recoveryDays}</span>
                          <span>{item.frequency}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 4: 종합 의견 */}
                <div className="rounded-[var(--app-radius-md)] fo-gradient-accent-br px-4 py-4">
                  <span className="text-[12px] font-semibold text-[var(--color-primary)] block mb-2">{t('report.overallOpinion')}</span>
                  <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{fullReport.conclusion}</p>
                </div>

                {/* Disclaimer */}
                <p className="text-[10px] text-[var(--color-text-dim)] leading-relaxed px-1">{fullReport.disclaimer}</p>
              </div>
            )}

            {/* ═══ NOT PURCHASED — VALUE PROP + BLUR ═══ */}
            {!purchased && (
              <>
                {/* Value prop — 구매 전 설득 */}
                <div className="rounded-[var(--app-radius-md)] bg-gradient-to-br from-[#fff8f0] to-[var(--color-bg-wash)] px-4 py-4 mb-3"
                  style={{ boxShadow: 'var(--app-shadow-card-xs)' }}>
                  <p className="text-[13px] font-semibold text-[var(--color-text)] mb-2">{t('report.valuePropTitle')}</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <span className="text-[12px] text-[var(--color-success)] mt-0.5">✓</span>
                      <span className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">{t('report.valueProp1')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[12px] text-[var(--color-success)] mt-0.5">✓</span>
                      <span className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">{t('report.valueProp2')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[12px] text-[var(--color-success)] mt-0.5">✓</span>
                      <span className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">{t('report.valueProp3')}</span>
                    </div>
                  </div>
                </div>

                {/* Locked: 상세 분석 */}
                <div className="relative rounded-[var(--app-radius-md)] overflow-hidden mb-3">
                  <div className="filter blur-[6px] pointer-events-none select-none px-4 py-4 bg-[var(--color-bg-secondary)]">
                    <div className="h-3 w-3/4 bg-[var(--color-border)] rounded mb-2" />
                    <div className="h-3 w-1/2 bg-[var(--color-border)] rounded mb-3" />
                    <div className="h-3 w-full bg-[var(--color-border)] rounded mb-2" />
                    <div className="h-3 w-2/3 bg-[var(--color-border)] rounded mb-2" />
                    <div className="h-3 w-5/6 bg-[var(--color-border)] rounded mb-3" />
                    <div className="h-3 w-3/4 bg-[var(--color-border)] rounded mb-2" />
                    <div className="h-3 w-1/2 bg-[var(--color-border)] rounded" />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-bg)]/60 backdrop-blur-[1px]">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center mb-2">
                      <Lock size={18} className="text-[var(--color-text-dim)]" />
                    </div>
                    <span className="text-[13px] font-semibold text-[var(--color-text)]">{t('report.blurTitle')}</span>
                    <span className="text-[11px] text-[var(--color-text-dim)] mt-0.5">{t('report.blurDesc')}</span>
                  </div>
                </div>

                {/* Locked: 비교 우위 */}
                <div className="relative rounded-[var(--app-radius-md)] overflow-hidden mb-5">
                  <div className="filter blur-[6px] pointer-events-none select-none px-4 py-3.5 bg-[var(--color-bg-secondary)]">
                    <div className="h-3 w-2/3 bg-[var(--color-border)] rounded mb-2" />
                    <div className="h-3 w-full bg-[var(--color-border)] rounded mb-2" />
                    <div className="h-3 w-3/4 bg-[var(--color-border)] rounded" />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-bg)]/60 backdrop-blur-[1px]">
                    <Lock size={14} className="text-[var(--color-text-dim)] mb-1" />
                    <span className="text-[12px] font-semibold text-[var(--color-text)]">{t('report.blurCompare')}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sticky CTA */}
          <div className="sticky bottom-0 bg-[var(--color-bg)] border-t border-[var(--color-border-light)] px-5 py-4">
            {purchased ? (
              <Button variant="neutral" size="xl" fullWidth onClick={() => { onClose(); router.push(`/mypage/reports/${proposal.id}`); }}>
                {t('report.viewReportDetail')}
              </Button>
            ) : (
              <>
                <Button variant="primary" size="xl" fullWidth onClick={handlePurchase}>
                  {t('report.singleCta')}
                </Button>
                <p className="text-center text-[10px] text-[var(--color-text-dim)] mt-1.5">
                  {t('report.singleSocial')}
                </p>
              </>
            )}
          </div>
        </div>
    </BottomSheet>
  );
}
