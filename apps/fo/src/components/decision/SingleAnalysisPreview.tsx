'use client';

import { useEffect } from 'react';
import type { Proposal, PartnerProfile } from '@hyliren/shared';
import { track } from '@hyliren/shared';
import { Button } from '@hyliren/ui';
import { X, TrendingDown, ShieldCheck, AlertTriangle, Lock } from 'lucide-react';
import { useReportStore, type ReportPreview } from '@/store/report';

interface Props {
  proposal: Proposal;
  profile: PartnerProfile | undefined;
  onClose: () => void;
}

/** Mock analysis preview generator */
function generatePreview(proposal: Proposal, profile: PartnerProfile | undefined): ReportPreview {
  const priceAdequacy: ReportPreview['priceAdequacy'] =
    proposal.totalPrice < 200 ? 'low' : proposal.totalPrice > 400 ? 'high' : 'fair';
  const riskLevel: ReportPreview['riskLevel'] =
    proposal.anesthesiaType === 'general' ? 'medium' : 'low';

  return {
    proposalId: proposal.id,
    hospitalName: profile?.hospitalName || '',
    priceAdequacy,
    riskLevel,
    overtreatment: 'none',
    summary: `${profile?.hospitalName}의 ${proposal.totalPrice}만원 제안에 대한 분석입니다.`,
  };
}

const ADEQUACY_LABELS: Record<string, { text: string; color: string }> = {
  low: { text: '평균 이하', color: 'text-emerald-600' },
  fair: { text: '적정 수준', color: 'text-[var(--color-text)]' },
  high: { text: '평균 이상', color: 'text-amber-600' },
};

const RISK_LABELS: Record<string, { text: string; color: string }> = {
  low: { text: '낮음', color: 'text-emerald-600' },
  medium: { text: '보통', color: 'text-amber-600' },
  high: { text: '주의', color: 'text-red-500' },
};

const OVERTREATMENT_LABELS: Record<string, { text: string; color: string }> = {
  none: { text: '의심 없음', color: 'text-emerald-600' },
  suspected: { text: '확인 필요', color: 'text-amber-600' },
  likely: { text: '주의 필요', color: 'text-red-500' },
};

export function SingleAnalysisPreview({ proposal, profile, onClose }: Props) {
  const { openPaywall, isPurchased: checkPurchased } = useReportStore();
  const purchased = checkPurchased(proposal.id);
  const preview = generatePreview(proposal, profile);

  useEffect(() => {
    track({ eventType: 'report_preview_viewed', actorType: 'user', targetType: 'proposal', targetId: proposal.id,
      metadata: { source: 'fo', locale: 'ko' } });
  }, [proposal.id]);

  function handleUnlock() {
    track({ eventType: 'report_paywall_viewed', actorType: 'user', targetType: 'proposal', targetId: proposal.id,
      metadata: { source: 'fo', locale: 'ko' } });
    openPaywall();
  }

  const priceInfo = ADEQUACY_LABELS[preview.priceAdequacy];
  const riskInfo = RISK_LABELS[preview.riskLevel];
  const overInfo = OVERTREATMENT_LABELS[preview.overtreatment];

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-[var(--fo-frame-max-width)] z-50 animate-[slideUp_0.3s_ease-out]">
        <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <span className="text-[15px] font-semibold text-[var(--color-text)]">
              {profile?.hospitalName} 분석
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center border-0 cursor-pointer">
              <X size={16} className="text-[var(--color-text-dim)]" />
            </button>
          </div>

          <div className="px-5 pb-5">
            {/* Free preview — 70% visible */}
            <div className="flex flex-col gap-2.5 mb-4">
              {[
                { icon: TrendingDown, label: '가격 적정성', value: priceInfo.text, color: priceInfo.color },
                { icon: AlertTriangle, label: '리스크 수준', value: riskInfo.text, color: riskInfo.color },
                { icon: ShieldCheck, label: '과잉진료 여부', value: overInfo.text, color: overInfo.color },
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

            {/* Blurred/locked section — 30% hidden */}
            {!purchased && (
              <div className="relative rounded-2xl overflow-hidden mb-5">
                {/* Blurred content */}
                <div className="filter blur-[6px] pointer-events-none select-none px-4 py-4 bg-[var(--color-bg-secondary)]">
                  <div className="h-3 w-3/4 bg-[var(--color-border)] rounded mb-2" />
                  <div className="h-3 w-1/2 bg-[var(--color-border)] rounded mb-4" />
                  <div className="h-3 w-full bg-[var(--color-border)] rounded mb-2" />
                  <div className="h-3 w-2/3 bg-[var(--color-border)] rounded mb-2" />
                  <div className="h-3 w-5/6 bg-[var(--color-border)] rounded mb-4" />
                  <div className="h-3 w-3/4 bg-[var(--color-border)] rounded mb-2" />
                  <div className="h-3 w-1/2 bg-[var(--color-border)] rounded" />
                </div>
                {/* Lock overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px]">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center mb-2">
                    <Lock size={18} className="text-[var(--color-text-dim)]" />
                  </div>
                  <span className="text-[13px] font-semibold text-[var(--color-text)]">상세 분석 잠금</span>
                  <span className="text-[11px] text-[var(--color-text-dim)] mt-0.5">리포트를 구매하면 전체 내용을 확인할 수 있어요</span>
                </div>
              </div>
            )}

            {/* Full report (if purchased) */}
            {purchased && (
              <div className="rounded-2xl bg-[var(--color-bg-secondary)] px-4 py-4 mb-5">
                <span className="text-[12px] font-semibold text-emerald-600 block mb-2">✓ 전체 리포트</span>
                <p className="text-[13px] text-[var(--color-text)] leading-relaxed">
                  {preview.summary} 가격은 시장 평균 대비 {ADEQUACY_LABELS[preview.priceAdequacy].text} 수준이며,
                  리스크는 {RISK_LABELS[preview.riskLevel].text}으로 평가됩니다.
                  과잉진료 가능성은 현재 {OVERTREATMENT_LABELS[preview.overtreatment].text}입니다.
                  정확한 적용 여부는 실제 병원 상담을 통해 결정됩니다.
                </p>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="sticky bottom-0 bg-white border-t border-[var(--color-border-light)] px-5 py-4">
            {purchased ? (
              <Button variant="primary" size="lg" fullWidth onClick={onClose}>
                확인 완료
              </Button>
            ) : (
              <>
                <Button variant="accent" size="lg" fullWidth onClick={handleUnlock}>
                  전체 리포트 보기 (₩4,900)
                </Button>
                <p className="text-center text-[10px] text-[var(--color-text-dim)] mt-1.5">
                  정확한 적용 여부는 실제 병원 상담을 통해 결정됩니다
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
