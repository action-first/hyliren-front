'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Spinner } from '@hyliren/ui';
import {
  ArrowLeft, ShieldCheck, Star, BarChart3, FileCheck, Activity,
  CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { useReportStore, type FullReport } from '@/store/report';
import { getProposal } from '@/lib/api/proposal';
import type { ProposalDetailWire } from '@/lib/api/proposal/types';

/* ── 임시 분석 generator — 추후 백엔드 분석 서비스로 대체 ── */
function generateFullReport(proposal: ProposalDetailWire): FullReport {
  const avgPrice = Math.round(proposal.totalPrice * 1.1);
  return {
    proposalId: proposal.id,
    hospitalName: proposal.hospitalName,
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
    conclusion: `종합적으로, ${proposal.hospitalName}의 이 제안은 가격과 시술 구성 면에서 ${proposal.totalPrice <= avgPrice ? '합리적인' : '검토가 필요한'} 수준입니다. 최종 결정 전 병원 상담을 통해 개인 상태에 맞는 정밀 진단을 받으시기를 권합니다.`,
    disclaimer: '이 리포트는 일반적인 시장 데이터와 시술 정보를 기반으로 작성되었으며, 개인의 의료 상태에 따라 결과가 달라질 수 있습니다. 정확한 판단은 반드시 병원 상담을 통해 이루어져야 합니다.',
  };
}

const RISK_LABEL: Record<string, { text: string; color: string }> = {
  low: { text: '낮음', color: 'text-[var(--color-success)]' },
  medium: { text: '보통', color: 'text-[var(--color-warning)]' },
  high: { text: '주의', color: 'text-[var(--color-danger)]' },
};

const VERDICT_COLOR: Record<string, string> = {
  below: 'text-[var(--color-success)]',
  fair: 'text-[var(--color-info)]',
  above: 'text-[var(--color-warning)]',
};

const VERDICT_LABEL: Record<string, string> = {
  below: '저렴',
  fair: '적정',
  above: '높음',
};

export default function ReportDetailPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const { isPurchased } = useReportStore();
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
        <p className="text-[15px] font-semibold text-[var(--color-text)] mb-2">리포트를 찾을 수 없습니다</p>
        <Link href="/mypage/reports" className="text-[13px] text-[var(--color-primary)] no-underline">
          ← 목록으로
        </Link>
      </div>
    );
  }

  const report = generateFullReport(proposal);
  const items = proposal.items;
  const meta = `회복 ${proposal.recoveryDays}일 · ${proposal.anesthesiaType === 'local' ? '부분' : proposal.anesthesiaType === 'sedation' ? '수면' : '전신'}마취`;

  return (
    <div className="flex flex-col pb-10">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <Link href="/mypage/reports" className="flex items-center gap-1 text-[12px] text-[var(--color-text-dim)] no-underline">
          <ArrowLeft size={14} /> 구매 리포트
        </Link>
      </div>

      {/* 병원 요약 */}
      <div className="px-5 pt-2 pb-4">
        <div className="flex items-center gap-1.5 mb-1">
          <h1 className="text-[1.25rem] font-bold text-[var(--color-text)]">{proposal.hospitalName}</h1>
          {proposal.hospitalIsCertified && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--color-success-soft)] text-[9px] font-semibold text-[var(--color-success)]">
              <ShieldCheck size={9} /> 인증
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[12px] text-[var(--color-text-dim)] mb-2">
          <span className="text-[18px] font-bold text-[var(--color-text)]">{proposal.totalPrice}만원</span>
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
            { label: '가격 적정성', value: report.priceScore + '점', color: report.priceScore >= 70 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]' },
            { label: '리스크', value: RISK_LABEL[report.overallRisk]?.text || '낮음', color: RISK_LABEL[report.overallRisk]?.color || 'text-[var(--color-success)]' },
            { label: '과잉진료', value: '의심 없음', color: 'text-[var(--color-success)]' },
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
            <span className="text-[13px] font-semibold text-[var(--color-text)]">가격 적정성 분석</span>
            <span className="ml-auto text-[1rem] font-bold text-[var(--color-primary)]">{report.priceScore}점</span>
          </div>
          <div className="px-4 py-3">
            <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed mb-3">{report.priceVerdict}</p>
            {report.priceBreakdown.map(item => (
              <div key={item.itemName} className="flex items-center justify-between py-2.5 border-t border-[var(--color-border-light)]">
                <div>
                  <span className="text-[12px] font-medium text-[var(--color-text)] block">{item.itemName}</span>
                  <span className="text-[10px] text-[var(--color-text-dim)]">시장 평균 {item.marketAvg}만 ({item.marketRange[0]}~{item.marketRange[1]}만)</span>
                </div>
                <div className="text-right">
                  <span className="text-[13px] font-bold text-[var(--color-text)] block">{item.proposalPrice}만</span>
                  <span className={`text-[10px] font-medium ${VERDICT_COLOR[item.verdict]}`}>{VERDICT_LABEL[item.verdict]}</span>
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
            <span className="text-[13px] font-semibold text-[var(--color-text)]">과잉진료 검증</span>
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
            <span className="text-[13px] font-semibold text-[var(--color-text)]">리스크 평가</span>
            <span className={`ml-auto text-[12px] font-semibold ${RISK_LABEL[report.overallRisk]?.color}`}>
              종합: {RISK_LABEL[report.overallRisk]?.text}
            </span>
          </div>
          <div className="px-4 py-3">
            {report.riskItems.map(item => (
              <div key={item.procedure} className="py-2.5 border-t border-[var(--color-border-light)] first:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium text-[var(--color-text)]">{item.procedure}</span>
                  <span className={`text-[11px] font-semibold ${RISK_LABEL[item.riskLevel]?.color}`}>{RISK_LABEL[item.riskLevel]?.text}</span>
                </div>
                <p className="text-[11px] text-[var(--color-text-dim)] leading-relaxed mb-1">{item.description}</p>
                <div className="flex gap-3 text-[10px] text-[var(--color-text-dim)]">
                  <span>회복: {item.recoveryDays}</span>
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
          <span className="text-[12px] font-semibold text-[var(--color-primary)] block mb-2">종합 의견</span>
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
