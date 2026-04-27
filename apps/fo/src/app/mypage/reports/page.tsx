'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Badge, Spinner } from '@hyliren/ui';
import { ArrowLeft, ArrowRight, FileCheck, ShieldCheck, Star, Clock, Inbox } from 'lucide-react';
import { useReportStore } from '@/store/report';
import { getProposal } from '@/lib/api/proposal';
import type { ProposalDetailWire } from '@/lib/api/proposal/types';

const RISK_LABELS: Record<string, { text: string; color: string }> = {
  low: { text: '낮음', color: 'text-[var(--color-success)] bg-[var(--color-success-soft)]' },
  medium: { text: '보통', color: 'text-[var(--color-warning)] bg-[var(--color-warning-soft)]' },
  high: { text: '주의', color: 'text-[var(--color-danger)] bg-[var(--color-danger-soft)]' },
};

const PRICE_LABELS: Record<string, { text: string; color: string }> = {
  low: { text: '저렴', color: 'text-[var(--color-success)]' },
  fair: { text: '적정', color: 'text-[var(--color-info)]' },
  high: { text: '높음', color: 'text-[var(--color-warning)]' },
};

interface ReportItem {
  proposal: ProposalDetailWire;
  priceAdequacy: 'low' | 'fair' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
}

export default function PurchasedReportsPage() {
  const { purchasedIds } = useReportStore();
  const purchasedList = Array.from(purchasedIds);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (purchasedList.length === 0) {
      setReports([]);
      setLoading(false);
      return;
    }
    Promise.all(
      purchasedList.map(id => getProposal(id).catch(() => null)),
    ).then(results => {
      const valid = results.filter((r): r is ProposalDetailWire => r !== null);
      setReports(valid.map(p => ({
        proposal: p,
        priceAdequacy: p.totalPrice < 200 ? 'low' : p.totalPrice > 400 ? 'high' : 'fair',
        riskLevel: p.anesthesiaType === 'general' ? 'medium' : 'low',
      })));
      setLoading(false);
    });
  }, [purchasedList.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col pb-10">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <Link href="/mypage" className="flex items-center gap-1 text-[12px] text-[var(--color-text-dim)] no-underline">
          <ArrowLeft size={14} /> 마이페이지
        </Link>
      </div>

      <div className="px-5 pt-2 pb-5">
        <h1 className="text-[1.25rem] font-bold text-[var(--color-text)] mb-1">구매한 리포트</h1>
        <p className="text-[12px] text-[var(--color-text-dim)]">
          검증 리포트를 다시 확인하고 비교할 수 있어요
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Spinner /></div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-5 pt-12 pb-10">
          <div className="w-14 h-14 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center mb-4">
            <Inbox size={24} className="text-[var(--color-text-dim)]" />
          </div>
          <p className="text-[15px] font-semibold text-[var(--color-text)] mb-1">아직 구매한 리포트가 없어요</p>
          <p className="text-[12px] text-[var(--color-text-dim)] text-center mb-5">
            상담함에서 제안을 선택하고 검증 리포트를 구매해보세요
          </p>
          <Link href="/decision" className="no-underline">
            <Button variant="primary" size="md">
              상담함 가기 <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-5">
          {reports.map(({ proposal, priceAdequacy, riskLevel }) => {
            const price = PRICE_LABELS[priceAdequacy] || PRICE_LABELS.fair;
            const risk = RISK_LABELS[riskLevel] || RISK_LABELS.low;
            const meta = `회복 ${proposal.recoveryDays}일 · ${proposal.anesthesiaType === 'local' ? '부분' : proposal.anesthesiaType === 'sedation' ? '수면' : '전신'}마취`;

            return (
              <Link key={proposal.id} href={`/mypage/reports/${proposal.id}`} className="no-underline block rounded-[var(--app-radius-card)] bg-[var(--color-bg)] p-4"
                style={{ boxShadow: 'var(--app-shadow-card-sm)' }}
              >
                {/* 병원명 + 인증 */}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[14px] font-semibold text-[var(--color-text)]">
                    {proposal.hospitalName}
                  </span>
                  {proposal.hospitalIsCertified && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--color-success-soft)] text-[9px] font-semibold text-[var(--color-success)]">
                      <ShieldCheck size={9} /> 인증
                    </span>
                  )}
                  <div className="flex items-center gap-0.5 text-[10px] text-[var(--color-text-dim)] ml-auto">
                    <Star size={9} fill="currentColor" /> 4.8
                  </div>
                </div>

                {/* 가격 + 메타 */}
                <div className="mb-2.5">
                  <span className="text-[17px] font-bold text-[var(--color-text)] mr-2">{proposal.totalPrice}만원</span>
                  <span className="text-[11px] text-[var(--color-text-dim)]">{meta}</span>
                </div>

                {/* 시술 태그 */}
                {proposal.items.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {proposal.items.slice(0, 3).map(item => (
                      <span key={item.id} className="px-2 py-0.5 rounded-full border border-[var(--color-border-light)] text-[10px] font-medium text-[var(--color-text-secondary)]">
                        {item.procedureName}
                      </span>
                    ))}
                  </div>
                )}

                {/* 검증 결과 요약 */}
                <div className="flex gap-2 pt-3 border-t border-[var(--color-border-light)]">
                  <div className="flex-1 flex flex-col items-center gap-1 py-2 rounded-[var(--app-radius-sm)] bg-[var(--color-bg-secondary)]">
                    <span className="text-[10px] text-[var(--color-text-dim)]">가격 적정성</span>
                    <span className={`text-[12px] font-bold ${price.color}`}>{price.text}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1 py-2 rounded-[var(--app-radius-sm)] bg-[var(--color-bg-secondary)]">
                    <span className="text-[10px] text-[var(--color-text-dim)]">리스크</span>
                    <span className={`text-[12px] font-bold px-2 py-0.5 rounded ${risk.color}`}>{risk.text}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1 py-2 rounded-[var(--app-radius-sm)] bg-[var(--color-bg-secondary)]">
                    <span className="text-[10px] text-[var(--color-text-dim)]">과잉진료</span>
                    <span className="text-[12px] font-bold text-[var(--color-success)]">의심 없음</span>
                  </div>
                </div>

                {/* 구매 뱃지 */}
                <div className="flex items-center justify-center gap-1 mt-3 text-[11px] text-[var(--color-text-dim)]">
                  <FileCheck size={12} />
                  <span>검증 완료 — 상세 보기</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
