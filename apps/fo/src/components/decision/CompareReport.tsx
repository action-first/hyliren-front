'use client';

import { useEffect } from 'react';
import type { ProposalItem } from '@hyliren/shared';
import { track } from '@hyliren/shared';
import { Button, BottomSheet } from '@hyliren/ui';
import {
  X, BarChart3, Activity, ShieldCheck, AlertTriangle,
  CheckCircle, Crown, Lock,
} from 'lucide-react';
import { useReportStore } from '@/store/report';
import { useLocaleStore } from '@/store/locale';
import type { ProposalWithHospital } from '@/lib/hooks/proposal';

interface Props {
  proposals: ProposalWithHospital[];
  items: ProposalItem[];
  concernId: string;
  onClose: () => void;
}

/* ── Mock compare data ── */

interface ProposalScore {
  proposalId: string;
  hospitalName: string;
  priceScore: number;
  riskScore: number;
  valueScore: number;
  totalScore: number;
  priceVerdict: string;
  riskVerdict: string;
  bestAt: string[];
}

function generateCompareScores(proposals: ProposalWithHospital[]): ProposalScore[] {
  const lowestPrice = Math.min(...proposals.map(p => p.totalPrice));
  const fastestRecovery = Math.min(...proposals.map(p => p.recoveryDays));

  return proposals.map(p => {
    const priceScore = p.totalPrice === lowestPrice ? 90 : Math.max(50, 90 - Math.round((p.totalPrice - lowestPrice) / lowestPrice * 40));
    const riskScore = p.anesthesiaType === 'local' ? 95 : p.anesthesiaType === 'sedation' ? 85 : 70;
    const valueScore = Math.round((priceScore * 0.4 + riskScore * 0.3 + (p.recoveryDays === fastestRecovery ? 90 : 70) * 0.3));
    const totalScore = Math.round((priceScore + riskScore + valueScore) / 3);

    const bestAt: string[] = [];
    if (p.totalPrice === lowestPrice) bestAt.push('lowestPrice');
    if (p.recoveryDays === fastestRecovery) bestAt.push('fastRecovery');
    // TODO: 백엔드 listProposals 응답에 hospitalVerified 필드 추가 시 재연결.
    //       현재 list DTO 는 hospitalName/hospitalLogo 만 반환하고 verified 는
    //       detail DTO (hospitalIsCertified) 에만 노출됨.

    return {
      proposalId: p.id,
      hospitalName: p.hospitalName,
      priceScore,
      riskScore,
      valueScore,
      totalScore,
      priceVerdict: p.totalPrice === lowestPrice ? '가장 합리적인 가격입니다' : `최저가 대비 ${Math.round((p.totalPrice - lowestPrice) / lowestPrice * 100)}% 높습니다`,
      riskVerdict: p.anesthesiaType === 'local' ? '부분마취로 리스크가 매우 낮습니다' : p.anesthesiaType === 'sedation' ? '수면마취로 리스크가 낮은 편입니다' : '전신마취로 사전 검진이 필요합니다',
      bestAt,
    };
  }).sort((a, b) => b.totalScore - a.totalScore);
}

const SCORE_COLOR = (s: number) => s >= 80 ? 'text-[var(--color-success)]' : s >= 60 ? 'text-[var(--color-text)]' : 'text-[var(--color-warning)]';
const BAR_COLOR = (s: number) => s >= 80 ? 'bg-[var(--color-success)]' : s >= 60 ? 'bg-[var(--color-border)]' : 'bg-[var(--color-warning)]';

export function CompareReport({ proposals, items, concernId, onClose }: Props) {
  const t = useLocaleStore(s => s.t);
  const { isPurchased: checkPurchased, markPurchased } = useReportStore();

  // "compare report" 는 concernId 기준으로 구매 여부 판단
  const purchased = checkPurchased(`compare-${concernId}`);
  const scores = generateCompareScores(proposals);
  const winner = scores[0];

  useEffect(() => {
    track({ eventType: 'compare_report_viewed', actorType: 'user', targetType: 'concern', targetId: concernId,
      metadata: { source: 'fo', locale: 'ko', value: String(proposals.length) } });
  }, [concernId, proposals.length]);

  function handlePurchase() {
    track({ eventType: 'report_purchased', actorType: 'user', targetType: 'concern', targetId: concernId,
      metadata: { source: 'fo', locale: 'ko', value: '6900', label: 'compare_report' } });
    markPurchased(`compare-${concernId}`);
  }

  return (
    <BottomSheet open onClose={onClose} noPadding scrollable>
        <div className="bg-[var(--color-bg)]" style={{ boxShadow: 'var(--app-shadow-sheet)' }}>
          {/* Header */}
          <div className="sticky top-0 bg-[var(--color-bg)] z-10 flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--color-border-light)]">
            <span className="text-[15px] font-semibold text-[var(--color-text)]">
              {t('report.compareTitle', { count: proposals.length })}
            </span>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center border-0 cursor-pointer">
              <X size={16} className="text-[var(--color-text-dim)]" />
            </button>
          </div>

          <div className="px-5 py-4">
            {/* ═══ FREE: 종합 순위 ═══ */}
            <div className="rounded-[var(--app-radius-md)] border border-[var(--color-border-light)] overflow-hidden mb-4">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-bg-secondary)]">
                <Crown size={14} className="text-[var(--color-primary)]" />
                <span className="text-[12px] font-semibold text-[var(--color-text)]">{t('report.ranking')}</span>
              </div>
              <div className="px-4 py-3">
                {scores.map((s, rank) => (
                  <div key={s.proposalId} className={`flex items-center gap-3 py-2.5 ${rank > 0 ? 'border-t border-[var(--color-border-light)]' : ''}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      rank === 0 ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-dim)]'
                    }`}>{rank + 1}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-medium text-[var(--color-text)] block truncate">{s.hospitalName}</span>
                      <div className="flex gap-1 mt-0.5">
                        {s.bestAt.map(b => (
                          <span key={b} className="text-[9px] px-1.5 py-px rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-dim)]">{t(`report.${b}`)}</span>
                        ))}
                      </div>
                    </div>
                    <span className={`text-[1rem] font-bold ${SCORE_COLOR(s.totalScore)}`}>{s.totalScore}{t('common.score')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ FREE: 가격 비교 바 ═══ */}
            <div className="rounded-[var(--app-radius-md)] border border-[var(--color-border-light)] overflow-hidden mb-4">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-bg-secondary)]">
                <BarChart3 size={14} className="text-[var(--color-primary)]" />
                <span className="text-[12px] font-semibold text-[var(--color-text)]">{t('report.priceCompare')}</span>
              </div>
              <div className="px-4 py-3">
                {scores.map(s => {
                  const proposal = proposals.find(p => p.id === s.proposalId);
                  if (!proposal) return null;
                  const maxPrice = Math.max(...proposals.map(p => p.totalPrice));
                  const barW = Math.max((proposal.totalPrice / maxPrice) * 100, 25);
                  return (
                    <div key={s.proposalId} className="flex items-center gap-3 py-2">
                      <span className="text-[11px] text-[var(--color-text-secondary)] w-14 shrink-0 truncate">{s.hospitalName.split(' ')[0]}</span>
                      <div className="flex-1 h-6 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full flex items-center justify-end pr-2 ${BAR_COLOR(s.priceScore)}`}
                          style={{ width: `${barW}%` }}>
                          <span className="text-[10px] font-bold text-white">{proposal.totalPrice}{t('common.man')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ═══ PURCHASED: 상세 비교 분석 ═══ */}
            {purchased ? (
              <>
                {/* A vs B 나란히 비교표 */}
                <div className="rounded-[var(--app-radius-md)] border border-[var(--color-border-light)] overflow-hidden mb-4">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-bg-secondary)]">
                    <Activity size={14} className="text-[var(--color-primary)]" />
                    <span className="text-[12px] font-semibold text-[var(--color-text)]">{t('report.comparisonTable')}</span>
                  </div>

                  {/* Column headers */}
                  <div className="flex border-b border-[var(--color-border-light)]">
                    <div className="w-20 shrink-0 px-3 py-2.5 bg-[var(--color-bg-secondary)]" />
                    {scores.map((s, i) => (
                      <div key={s.proposalId} className={`flex-1 px-2 py-2.5 text-center ${i === 0 ? 'bg-[var(--color-primary-soft)]' : ''}`}>
                        <span className="text-[11px] font-semibold text-[var(--color-text)] block truncate">{s.hospitalName.split(' ')[0]}</span>
                        {i === 0 && <span className="text-[9px] text-[var(--color-primary)] font-bold">{t('common.recommended')}</span>}
                      </div>
                    ))}
                  </div>

                  {/* Rows */}
                  {(() => {
                    const findProposal = (s: ProposalScore) => proposals.find(pp => pp.id === s.proposalId);
                    const fastestRecovery = Math.min(...proposals.map(pp => pp.recoveryDays));
                    return [
                    { label: t('report.totalPrice'), render: (s: ProposalScore) => { const p = findProposal(s); return p ? `${p.totalPrice}${t('common.man')}` : '—'; }, best: (s: ProposalScore) => s.priceScore >= 80 },
                    { label: t('report.priceScore'), render: (s: ProposalScore) => `${s.priceScore}${t('common.score')}`, best: (s: ProposalScore) => s.priceScore >= 80 },
                    { label: t('report.risk'), render: (s: ProposalScore) => `${s.riskScore}${t('common.score')}`, best: (s: ProposalScore) => s.riskScore >= 80 },
                    { label: t('report.valueScore'), render: (s: ProposalScore) => `${s.valueScore}${t('common.score')}`, best: (s: ProposalScore) => s.valueScore >= 80 },
                    { label: t('report.overall'), render: (s: ProposalScore) => `${s.totalScore}${t('common.score')}`, best: (s: ProposalScore) => s.totalScore >= 80 },
                    { label: t('common.recovery'), render: (s: ProposalScore) => { const p = findProposal(s); return p ? `${p.recoveryDays}${t('common.days')}` : '—'; }, best: (s: ProposalScore) => { const p = findProposal(s); return p ? p.recoveryDays === fastestRecovery : false; } },
                    { label: t('common.anesthesia'), render: (s: ProposalScore) => { const p = findProposal(s); return !p ? '—' : p.anesthesiaType === 'local' ? t('common.anesthesiaLocalShort') : p.anesthesiaType === 'sedation' ? t('common.anesthesiaSedationShort') : t('common.anesthesiaGeneralShort'); }, best: (s: ProposalScore) => { const p = findProposal(s); return p ? p.anesthesiaType !== 'general' : false; } },
                    { label: t('common.verified'), render: () => '—', best: () => false },
                  ]; })().map(row => (
                    <div key={row.label} className="flex border-b border-[var(--color-border-light)] last:border-0">
                      <div className="w-20 shrink-0 px-3 py-2.5 bg-[var(--color-bg-secondary)] flex items-center">
                        <span className="text-[11px] font-semibold text-[var(--color-text-dim)]">{row.label}</span>
                      </div>
                      {scores.map((s, i) => (
                        <div key={s.proposalId} className={`flex-1 px-2 py-2.5 flex items-center justify-center ${i === 0 ? 'bg-[var(--color-primary-soft)]/30' : ''}`}>
                          <span className={`text-[12px] font-semibold ${row.best(s) ? 'text-[var(--color-success)]' : 'text-[var(--color-text)]'}`}>
                            {row.render(s)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* 병원별 한 줄 평가 */}
                <div className="rounded-[var(--app-radius-md)] border border-[var(--color-border-light)] overflow-hidden mb-4">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-bg-secondary)]">
                    <ShieldCheck size={14} className="text-[var(--color-primary)]" />
                    <span className="text-[12px] font-semibold text-[var(--color-text)]">{t('report.hospitalEval')}</span>
                  </div>
                  <div className="px-4 py-3">
                    {scores.map((s, i) => (
                      <div key={s.proposalId} className={`py-3 ${i > 0 ? 'border-t border-[var(--color-border-light)]' : ''}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[13px] font-semibold text-[var(--color-text)]">{s.hospitalName}</span>
                          <span className={`text-[11px] font-bold ${SCORE_COLOR(s.totalScore)}`}>{s.totalScore}{t('common.score')}</span>
                        </div>
                        <div className="flex items-start gap-1.5 mb-1">
                          <CheckCircle size={12} className="text-[var(--color-success)] shrink-0 mt-0.5" />
                          <span className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">{s.priceVerdict}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle size={12} className="text-[var(--color-warning)] shrink-0 mt-0.5" />
                          <span className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">{s.riskVerdict}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 종합 의견 */}
                <div className="rounded-[var(--app-radius-md)] fo-gradient-accent-br px-4 py-4 mb-3">
                  <span className="text-[12px] font-semibold text-[var(--color-primary)] block mb-2">{t('report.overallOpinion')}</span>
                  <p className="text-[13px] text-[var(--color-text)] leading-relaxed">
                    {proposals.length}개 제안을 종합 분석한 결과, {winner.hospitalName}이 가격과 리스크 면에서 가장 균형 잡힌 제안입니다.
                    최종 결정 전 병원 상담을 통해 개인 상태에 맞는 정밀 진단을 받으시기를 권합니다.
                  </p>
                </div>

                <p className="text-[10px] text-[var(--color-text-dim)] leading-relaxed px-1 mb-4">
                  이 리포트는 일반적인 시장 데이터와 시술 정보를 기반으로 작성되었으며, 개인의 의료 상태에 따라 결과가 달라질 수 있습니다.
                </p>
              </>
            ) : (
              /* ═══ NOT PURCHASED: Blur ═══ */
              <>
                <div className="relative rounded-[var(--app-radius-md)] overflow-hidden mb-3">
                  <div className="filter blur-[6px] pointer-events-none select-none px-4 py-4 bg-[var(--color-bg-secondary)]">
                    <div className="h-3 w-3/4 bg-[var(--color-border)] rounded mb-2" />
                    <div className="h-3 w-1/2 bg-[var(--color-border)] rounded mb-3" />
                    <div className="h-3 w-full bg-[var(--color-border)] rounded mb-2" />
                    <div className="h-3 w-2/3 bg-[var(--color-border)] rounded mb-2" />
                    <div className="h-3 w-5/6 bg-[var(--color-border)] rounded mb-3" />
                    <div className="h-3 w-3/4 bg-[var(--color-border)] rounded" />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-bg)]/60 backdrop-blur-[1px]">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center mb-2">
                      <Lock size={18} className="text-[var(--color-text-dim)]" />
                    </div>
                    <span className="text-[13px] font-semibold text-[var(--color-text)]">{t('report.blurItems')}</span>
                    <span className="text-[11px] text-[var(--color-text-dim)] mt-0.5">{t('report.blurPurchase')}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sticky CTA */}
          <div className="sticky bottom-0 bg-[var(--color-bg)] border-t border-[var(--color-border-light)] px-5 py-4">
            {purchased ? (
              <Button variant="primary" size="xl" fullWidth onClick={onClose}>
                {t('common.confirm')}
              </Button>
            ) : (
              <>
                <Button variant="accent" size="xl" fullWidth onClick={handlePurchase}>
                  {t('report.compareCta')}
                </Button>
                <p className="text-center text-[10px] text-[var(--color-text-dim)] mt-1.5">
                  {t('report.compareSocial')}
                </p>
              </>
            )}
          </div>
        </div>
    </BottomSheet>
  );
}
