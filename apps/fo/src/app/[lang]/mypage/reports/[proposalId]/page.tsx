'use client';

import { formatKRW } from '@hyliren/shared';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/components/i18n/Link';
import { Spinner } from '@hyliren/ui';
import {
  ArrowLeft, ShieldCheck, Star, BarChart3, FileCheck, Activity,
  CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { useReportStore, type FullReport } from '@/store/report';
import { getProposal } from '@/lib/api/proposal';
import type { ProposalDetailWire } from '@/lib/api/proposal/types';
import { useLocaleStore } from '@/store/locale';

type T = (key: string, params?: Record<string, string | number>) => string;

/* ── 임시 분석 generator — 추후 백엔드 분석 서비스로 대체 ── */
function generateFullReport(proposal: ProposalDetailWire, t: T): FullReport {
  const avgPrice = Math.round(proposal.totalPrice * 1.1);
  return {
    proposalId: proposal.id,
    hospitalName: proposal.hospitalName,
    priceScore: proposal.totalPrice < 2_000_000 ? 85 : proposal.totalPrice > 4_000_000 ? 55 : 72,
    priceVerdict: proposal.totalPrice <= avgPrice
      ? t('report.priceVerdictFair')
      : t('report.priceVerdictHigh'),
    priceBreakdown: [
      { itemName: t('report.itemMainTreatment'), proposalPrice: Math.round(proposal.totalPrice * 0.75), marketAvg: Math.round(proposal.totalPrice * 0.8), marketRange: [Math.round(proposal.totalPrice * 0.5), Math.round(proposal.totalPrice * 1.2)], verdict: 'fair' },
      { itemName: t('report.itemSubTreatment'), proposalPrice: Math.round(proposal.totalPrice * 0.25), marketAvg: Math.round(proposal.totalPrice * 0.3), marketRange: [Math.round(proposal.totalPrice * 0.15), Math.round(proposal.totalPrice * 0.4)], verdict: proposal.totalPrice > 3_000_000 ? 'above' : 'below' },
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
      hospital: proposal.hospitalName,
      verdict: proposal.totalPrice <= avgPrice ? t('report.conclusionFair') : t('report.conclusionHigh'),
    }),
    disclaimer: t('report.disclaimerText'),
  };
}

const RISK_LABEL_KEYS: Record<string, { key: string; color: string }> = {
  low: { key: 'report.riskLow', color: 'text-[var(--color-success)]' },
  medium: { key: 'report.riskMedium', color: 'text-[var(--color-warning)]' },
  high: { key: 'report.riskHigh', color: 'text-[var(--color-danger)]' },
};

const VERDICT_COLOR: Record<string, string> = {
  below: 'text-[var(--color-success)]',
  fair: 'text-[var(--color-info)]',
  above: 'text-[var(--color-warning)]',
};

const VERDICT_LABEL_KEYS: Record<string, string> = {
  below: 'report.priceLow',
  fair: 'report.priceFair',
  above: 'report.priceHigh',
};

export default function ReportDetailPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const { isPurchased } = useReportStore();
  const t = useLocaleStore(s => s.t);
  const [proposal, setProposal] = useState<ProposalDetailWire | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!proposalId) return;
    getProposal(proposalId)
      .then(p => {
        setProposal(p);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [proposalId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>
    );
  }

  if (notFound || !proposal || !isPurchased(proposalId)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
        <p className="text-[15px] font-semibold text-[var(--color-text)] mb-2">{t('report.notFound')}</p>
        <Link href="/mypage/reports" className="text-[13px] text-[var(--color-primary)] no-underline">
          ← {t('mypage.purchasedReports')}
        </Link>
      </div>
    );
  }

  const report = generateFullReport(proposal, t);
  const items = proposal.items;
  const anesthesiaShort = proposal.anesthesiaType === 'local'
    ? t('common.anesthesiaLocalShort')
    : proposal.anesthesiaType === 'sedation'
      ? t('common.anesthesiaSedationShort')
      : t('common.anesthesiaGeneralShort');
  const meta = t('report.metaRecoveryAnesthesia', {
    days: proposal.recoveryDays,
    anesthesia: `${anesthesiaShort}${t('common.anesthesia')}`,
  });

  return (
    <div className="flex flex-col pb-10">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <Link href="/mypage/reports" className="flex items-center gap-1 text-[12px] text-[var(--color-text-dim)] no-underline">
          <ArrowLeft size={14} /> {t('report.backToList')}
        </Link>
      </div>

      {/* 병원 요약 */}
      <div className="px-5 pt-2 pb-4">
        <div className="flex items-center gap-1.5 mb-1">
          <h1 className="text-[1.25rem] font-bold text-[var(--color-text)]">{proposal.hospitalName || t('common.unknownHospital')}</h1>
          {proposal.hospitalIsCertified && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--color-success-soft)] text-[9px] font-semibold text-[var(--color-success)]">
              <ShieldCheck size={9} /> {t('common.verified')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[12px] text-[var(--color-text-dim)] mb-2">
          <span className="text-[18px] font-bold text-[var(--color-text)]">{formatKRW(proposal.totalPrice)}</span>
          <span className="flex items-center gap-1"><Clock size={11} /> {meta}</span>
          <span className="flex items-center gap-0.5 ml-auto"><Star size={10} fill="currentColor" /> 4.8</span>
        </div>

        {/* 시술 태그 */}
        {items.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {items.map(item => (
              <span key={item.id} className="px-2 py-0.5 rounded-full border border-[var(--color-border-light)] text-[10px] font-medium text-[var(--color-text-secondary)]">
                {item.procedureName}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3 metrics 요약 */}
      <div className="px-5 mb-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t('report.priceAdequacy'), value: t('report.scoreUnit', { score: report.priceScore }), color: report.priceScore >= 70 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]' },
            { label: t('report.risk'), value: t(RISK_LABEL_KEYS[report.overallRisk]?.key || 'report.riskLow'), color: RISK_LABEL_KEYS[report.overallRisk]?.color || 'text-[var(--color-success)]' },
            { label: t('report.overtreatment'), value: t('report.overNone'), color: 'text-[var(--color-success)]' },
          ].map(m => (
            <div key={m.label} className="flex flex-col items-center gap-1 py-3 rounded-[var(--app-radius)] bg-[var(--color-bg-secondary)]">
              <span className="text-[10px] text-[var(--color-text-dim)]">{m.label}</span>
              <span className={`text-[13px] font-bold ${m.color}`}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 1: 가격 분석 */}
      <div className="px-5 mb-4">
        <div className="rounded-[var(--app-radius-md)] bg-[var(--color-bg)] border border-[var(--color-border-light)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-bg-secondary)]">
            <BarChart3 size={15} className="text-[var(--color-primary)]" />
            <span className="text-[13px] font-semibold text-[var(--color-text)]">{t('report.priceAnalysis')}</span>
            <span className="ml-auto text-[1rem] font-bold text-[var(--color-primary)]">{t('report.scoreUnit', { score: report.priceScore })}</span>
          </div>
          <div className="px-4 py-3">
            <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed mb-3">{report.priceVerdict}</p>
            {report.priceBreakdown.map(item => (
              <div key={item.itemName} className="flex items-center justify-between py-2.5 border-t border-[var(--color-border-light)]">
                <div>
                  <span className="text-[12px] font-medium text-[var(--color-text)] block">{item.itemName}</span>
                  <span className="text-[10px] text-[var(--color-text-dim)]">{t('report.marketAvgRange', { avg: item.marketAvg, min: item.marketRange[0], max: item.marketRange[1], unit: t('common.currency') })}</span>
                </div>
                <div className="text-right">
                  <span className="text-[13px] font-bold text-[var(--color-text)] block">{formatKRW(item.proposalPrice)}</span>
                  <span className={`text-[10px] font-medium ${VERDICT_COLOR[item.verdict]}`}>{t(VERDICT_LABEL_KEYS[item.verdict] || 'report.priceFair')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: 과잉진료 검증 */}
      <div className="px-5 mb-4">
        <div className="rounded-[var(--app-radius-md)] bg-[var(--color-bg)] border border-[var(--color-border-light)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-bg-secondary)]">
            <FileCheck size={15} className="text-[var(--color-primary)]" />
            <span className="text-[13px] font-semibold text-[var(--color-text)]">{t('report.overtreatmentVerify')}</span>
          </div>
          <div className="px-4 py-3">
            <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed mb-2">{report.overtreatmentVerdict}</p>
            {report.necessaryItems.map(item => (
              <div key={item} className="flex items-start gap-2 py-1.5">
                <CheckCircle size={13} className="text-[var(--color-success)] shrink-0 mt-0.5" />
                <span className="text-[11px] text-[var(--color-text)] leading-relaxed">{item}</span>
              </div>
            ))}
            {report.unnecessaryItems.map(item => (
              <div key={item} className="flex items-start gap-2 py-1.5">
                <XCircle size={13} className="text-[var(--color-danger)] shrink-0 mt-0.5" />
                <span className="text-[11px] text-[var(--color-text)] leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: 리스크 평가 */}
      <div className="px-5 mb-4">
        <div className="rounded-[var(--app-radius-md)] bg-[var(--color-bg)] border border-[var(--color-border-light)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-bg-secondary)]">
            <Activity size={15} className="text-[var(--color-primary)]" />
            <span className="text-[13px] font-semibold text-[var(--color-text)]">{t('report.riskAssessment')}</span>
            <span className={`ml-auto text-[12px] font-semibold ${RISK_LABEL_KEYS[report.overallRisk]?.color}`}>
              {t('report.overallRisk', { level: t(RISK_LABEL_KEYS[report.overallRisk]?.key || 'report.riskLow') })}
            </span>
          </div>
          <div className="px-4 py-3">
            {report.riskItems.map(item => (
              <div key={item.procedure} className="py-2.5 border-t border-[var(--color-border-light)] first:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium text-[var(--color-text)]">{item.procedure}</span>
                  <span className={`text-[11px] font-semibold ${RISK_LABEL_KEYS[item.riskLevel]?.color}`}>{t(RISK_LABEL_KEYS[item.riskLevel]?.key || 'report.riskLow')}</span>
                </div>
                <p className="text-[11px] text-[var(--color-text-dim)] leading-relaxed mb-1">{item.description}</p>
                <div className="flex gap-3 text-[10px] text-[var(--color-text-dim)]">
                  <span>{t('report.recoveryLabel')} {item.recoveryDays}</span>
                  <span>{item.frequency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: 종합 의견 */}
      <div className="px-5 mb-4">
        <div className="rounded-[var(--app-radius-md)] fo-gradient-accent-br px-4 py-4">
          <span className="text-[12px] font-semibold text-[var(--color-primary)] block mb-2">{t('report.overallOpinion')}</span>
          <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{report.conclusion}</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-5">
        <p className="text-[10px] text-[var(--color-text-dim)] leading-relaxed">{report.disclaimer}</p>
      </div>
    </div>
  );
}
