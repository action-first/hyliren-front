'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Proposal, PartnerProfile } from '@hyliren/shared';
import { track } from '@hyliren/shared';
import { Button } from '@hyliren/ui';
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

/* ── Mock generators ── */

function generatePreview(proposal: Proposal, profile: PartnerProfile | undefined): ReportPreview {
  return {
    proposalId: proposal.id,
    hospitalName: profile?.hospitalName || '',
    priceAdequacy: proposal.totalPrice < 200 ? 'low' : proposal.totalPrice > 400 ? 'high' : 'fair',
    riskLevel: proposal.anesthesiaType === 'general' ? 'medium' : 'low',
    overtreatment: 'none',
    summary: `${profile?.hospitalName}의 ${proposal.totalPrice}만원 제안에 대한 분석입니다.`,
  };
}

function generateFullReport(proposal: Proposal, profile: PartnerProfile | undefined): FullReport {
  const avgPrice = Math.round(proposal.totalPrice * 1.1);
  return {
    proposalId: proposal.id,
    hospitalName: profile?.hospitalName || '',
    priceScore: proposal.totalPrice < 200 ? 85 : proposal.totalPrice > 400 ? 55 : 72,
    priceVerdict: proposal.totalPrice <= avgPrice
      ? '이 제안의 가격은 시장 평균 대비 합리적인 수준입니다.'
      : '이 제안의 가격은 시장 평균보다 다소 높은 편입니다. 포함된 시술 항목을 확인해보세요.',
    priceBreakdown: [
      { itemName: '주요 시술', proposalPrice: Math.round(proposal.totalPrice * 0.75), marketAvg: Math.round(proposal.totalPrice * 0.8), marketRange: [Math.round(proposal.totalPrice * 0.5), Math.round(proposal.totalPrice * 1.2)], verdict: 'fair' },
      { itemName: '부가 시술', proposalPrice: Math.round(proposal.totalPrice * 0.25), marketAvg: Math.round(proposal.totalPrice * 0.3), marketRange: [Math.round(proposal.totalPrice * 0.15), Math.round(proposal.totalPrice * 0.4)], verdict: proposal.totalPrice > 300 ? 'above' : 'below' },
    ],
    overtreatmentVerdict: '현재 제안에 포함된 시술 항목은 고민 내용에 비추어 일반적으로 적정한 수준으로 판단됩니다.',
    unnecessaryItems: [],
    necessaryItems: ['주요 시술은 고민 해결에 직접적으로 관련됩니다', '부가 시술은 결과의 완성도를 높이는 역할을 합니다'],
    overallRisk: proposal.anesthesiaType === 'general' ? 'medium' : 'low',
    riskItems: [
      { procedure: '주요 시술', riskLevel: 'low', description: '일반적으로 안전한 시술이며, 심각한 부작용 사례가 매우 드뭅니다', recoveryDays: `${proposal.recoveryDays}일`, frequency: '한국 내 연간 10만 건 이상 시행' },
      ...(proposal.anesthesiaType === 'general' ? [{ procedure: '전신마취', riskLevel: 'medium' as const, description: '전신마취에 따른 일반적 위험이 존재하며, 사전 건강 검진이 필요합니다', recoveryDays: '당일~1일', frequency: '정상 범위' }] : []),
    ],
    conclusion: `종합적으로, ${profile?.hospitalName}의 이 제안은 가격과 시술 구성 면에서 ${proposal.totalPrice <= avgPrice ? '합리적인' : '검토가 필요한'} 수준입니다. 최종 결정 전 병원 상담을 통해 개인 상태에 맞는 정밀 진단을 받으시기를 권합니다.`,
    disclaimer: '이 리포트는 일반적인 시장 데이터와 시술 정보를 기반으로 작성되었으며, 개인의 의료 상태에 따라 결과가 달라질 수 있습니다. 정확한 판단은 반드시 병원 상담을 통해 이루어져야 합니다.',
  };
}

/* ── Label maps (colors only — text from i18n) ── */
const ADEQUACY_COLOR = { low: 'text-emerald-600', fair: 'text-[var(--color-text)]', high: 'text-amber-600' };
const RISK_COLOR = { low: 'text-emerald-600', medium: 'text-amber-600', high: 'text-red-500' };
const OVER_COLOR = { none: 'text-emerald-600', suspected: 'text-amber-600', likely: 'text-red-500' };
const VERDICT_COLOR = { below: 'text-emerald-600', fair: 'text-[var(--color-text)]', above: 'text-amber-600' };

export function SingleAnalysisPreview({ proposal, profile, onClose }: Props) {
  const t = useLocaleStore(s => s.t);
  const router = useRouter();
  const { markPurchased, isPurchased: checkPurchased, setFullReport } = useReportStore();
  const purchased = checkPurchased(proposal.id);
  const preview = generatePreview(proposal, profile);

  useEffect(() => {
    track({ eventType: 'report_preview_viewed', actorType: 'user', targetType: 'proposal', targetId: proposal.id, metadata: { source: 'fo', locale: 'ko' } });
    if (purchased) {
      setFullReport(generateFullReport(proposal, profile));
    }
  }, [proposal.id, purchased]); // eslint-disable-line react-hooks/exhaustive-deps

  const fullReport = purchased ? generateFullReport(proposal, profile) : null;

  function handlePurchase() {
    track({ eventType: 'report_purchased', actorType: 'user', targetType: 'proposal', targetId: proposal.id, metadata: { source: 'fo', locale: 'ko', value: '4900' } });
    // payment 기록
    fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'report_purchase',
        amount: 4900,
        currency: 'KRW',
        actorType: 'buyer',
        actorId: 'u-001',
        actorName: '고객',
        relatedId: proposal.id,
        status: 'paid',
      }),
    }).catch(() => {});
    markPurchased(proposal.id);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-[var(--fo-frame-max-width)] z-50 rounded-t-3xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
        <div className="bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto hide-scrollbar">
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--color-border-light)]">
            <span className="text-[15px] font-semibold text-[var(--color-text)]">
              {profile?.hospitalName} {purchased ? t('report.verificationReport') : t('report.analysis')}
            </span>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center border-0 cursor-pointer">
              <X size={16} className="text-[var(--color-text-dim)]" />
            </button>
          </div>

          <div className="px-5 py-4">
            {/* ═══ FREE PREVIEW — 3 metrics ═══ */}
            <div className="flex flex-col gap-2.5 mb-4">
              {[
                { icon: TrendingDown, label: t('report.priceAdequacy'), value: { low: t('report.priceBelow'), fair: t('report.priceFair'), high: t('report.priceAbove') }[preview.priceAdequacy], color: ADEQUACY_COLOR[preview.priceAdequacy] },
                { icon: AlertTriangle, label: t('report.riskLevel'), value: { low: t('report.riskLow'), medium: t('report.riskMedium'), high: t('report.riskHigh') }[preview.riskLevel], color: RISK_COLOR[preview.riskLevel] },
                { icon: ShieldCheck, label: t('report.overtreatment'), value: { none: t('report.overNone'), suspected: t('report.overSuspected'), likely: t('report.overLikely') }[preview.overtreatment], color: OVER_COLOR[preview.overtreatment] },
              ].map(row => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[var(--color-bg-secondary)]">
                    <Icon size={18} className="text-[var(--color-text-dim)] shrink-0" />
                    <span className="text-[13px] text-[var(--color-text)] flex-1">{row.label}</span>
                    <span className={`text-[13px] font-semibold ${row.color}`}>{row.value}</span>
                  </div>
                );
              })}
            </div>

            {/* ═══ PURCHASED — FULL REPORT ═══ */}
            {purchased && fullReport && (
              <div className="flex flex-col gap-4 mb-5">

                {/* Section 1: 가격 분석 */}
                <div className="rounded-2xl bg-white border border-[var(--color-border-light)] overflow-hidden">
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
                <div className="rounded-2xl bg-white border border-[var(--color-border-light)] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-bg-secondary)]">
                    <FileCheck size={15} className="text-[var(--color-primary)]" />
                    <span className="text-[13px] font-semibold text-[var(--color-text)]">{t('report.overtreatmentVerify')}</span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed mb-2">{fullReport.overtreatmentVerdict}</p>
                    {fullReport.necessaryItems.map(item => (
                      <div key={item} className="flex items-start gap-2 py-1.5">
                        <CheckCircle size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-[var(--color-text)] leading-relaxed">{item}</span>
                      </div>
                    ))}
                    {fullReport.unnecessaryItems.map(item => (
                      <div key={item} className="flex items-start gap-2 py-1.5">
                        <XCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-[var(--color-text)] leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: 리스크 평가 */}
                <div className="rounded-2xl bg-white border border-[var(--color-border-light)] overflow-hidden">
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
                <div className="rounded-2xl bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-bg-wash)] px-4 py-4">
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
                <div className="rounded-2xl bg-gradient-to-br from-[#fff8f0] to-[var(--color-bg-wash)] px-4 py-4 mb-3"
                  style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }}>
                  <p className="text-[13px] font-semibold text-[var(--color-text)] mb-2">{t('report.valuePropTitle')}</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <span className="text-[12px] text-emerald-500 mt-0.5">✓</span>
                      <span className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">{t('report.valueProp1')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[12px] text-emerald-500 mt-0.5">✓</span>
                      <span className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">{t('report.valueProp2')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[12px] text-emerald-500 mt-0.5">✓</span>
                      <span className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">{t('report.valueProp3')}</span>
                    </div>
                  </div>
                </div>

                {/* Locked: 상세 분석 */}
                <div className="relative rounded-2xl overflow-hidden mb-3">
                  <div className="filter blur-[6px] pointer-events-none select-none px-4 py-4 bg-[var(--color-bg-secondary)]">
                    <div className="h-3 w-3/4 bg-[var(--color-border)] rounded mb-2" />
                    <div className="h-3 w-1/2 bg-[var(--color-border)] rounded mb-3" />
                    <div className="h-3 w-full bg-[var(--color-border)] rounded mb-2" />
                    <div className="h-3 w-2/3 bg-[var(--color-border)] rounded mb-2" />
                    <div className="h-3 w-5/6 bg-[var(--color-border)] rounded mb-3" />
                    <div className="h-3 w-3/4 bg-[var(--color-border)] rounded mb-2" />
                    <div className="h-3 w-1/2 bg-[var(--color-border)] rounded" />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px]">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center mb-2">
                      <Lock size={18} className="text-[var(--color-text-dim)]" />
                    </div>
                    <span className="text-[13px] font-semibold text-[var(--color-text)]">{t('report.blurTitle')}</span>
                    <span className="text-[11px] text-[var(--color-text-dim)] mt-0.5">{t('report.blurDesc')}</span>
                  </div>
                </div>

                {/* Locked: 비교 우위 */}
                <div className="relative rounded-2xl overflow-hidden mb-5">
                  <div className="filter blur-[6px] pointer-events-none select-none px-4 py-3.5 bg-[var(--color-bg-secondary)]">
                    <div className="h-3 w-2/3 bg-[var(--color-border)] rounded mb-2" />
                    <div className="h-3 w-full bg-[var(--color-border)] rounded mb-2" />
                    <div className="h-3 w-3/4 bg-[var(--color-border)] rounded" />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px]">
                    <Lock size={14} className="text-[var(--color-text-dim)] mb-1" />
                    <span className="text-[12px] font-semibold text-[var(--color-text)]">{t('report.blurCompare')}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sticky CTA */}
          <div className="sticky bottom-0 bg-white border-t border-[var(--color-border-light)] px-5 py-4">
            {purchased ? (
              <Button variant="primary" size="lg" fullWidth onClick={() => { onClose(); router.push(`/mypage/reports/${proposal.id}`); }}>
                리포트 상세 보기
              </Button>
            ) : (
              <>
                <Button variant="accent" size="lg" fullWidth onClick={handlePurchase}>
                  {t('report.singleCta')}
                </Button>
                <p className="text-center text-[10px] text-[var(--color-text-dim)] mt-1.5">
                  {t('report.singleSocial')}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
