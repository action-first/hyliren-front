'use client';

import Link from 'next/link';
import { MOCK_PROPOSALS, MOCK_PARTNER_PROFILES, MOCK_PROPOSAL_ITEMS } from '@hyliren/shared';
import { Button, Badge } from '@hyliren/ui';
import { ArrowLeft, ArrowRight, FileCheck, ShieldCheck, Star, Clock, Inbox } from 'lucide-react';
import { useReportStore } from '@/store/report';

const RISK_LABELS: Record<string, { text: string; color: string }> = {
  low: { text: '낮음', color: 'text-emerald-600 bg-emerald-50' },
  medium: { text: '보통', color: 'text-amber-600 bg-amber-50' },
  high: { text: '주의', color: 'text-red-500 bg-red-50' },
};

const PRICE_LABELS: Record<string, { text: string; color: string }> = {
  low: { text: '저렴', color: 'text-emerald-600' },
  fair: { text: '적정', color: 'text-blue-600' },
  high: { text: '높음', color: 'text-amber-600' },
};

export default function PurchasedReportsPage() {
  const { purchasedIds } = useReportStore();
  const purchasedList = Array.from(purchasedIds);

  // 구매한 리포트에 해당하는 제안 데이터
  const reports = purchasedList
    .map(proposalId => {
      const proposal = MOCK_PROPOSALS.find(p => p.id === proposalId);
      if (!proposal) return null;
      const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === proposal.memberId);
      const items = MOCK_PROPOSAL_ITEMS.filter(i => i.proposalId === proposal.id);
      // 간이 분석 데이터 (실제로는 서버에서 받아옴)
      const priceAdequacy = proposal.totalPrice < 200 ? 'low' : proposal.totalPrice > 400 ? 'high' : 'fair';
      const riskLevel = proposal.anesthesiaType === 'general' ? 'medium' : 'low';
      return { proposal, profile, items, priceAdequacy, riskLevel };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

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

      {/* Empty state */}
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-5 pt-12 pb-10">
          <div className="w-14 h-14 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center mb-4">
            <Inbox size={24} className="text-[var(--color-text-dim)]" />
          </div>
          <p className="text-[15px] font-semibold text-[var(--color-text)] mb-1">아직 구매한 리포트가 없어요</p>
          <p className="text-[12px] text-[var(--color-text-dim)] text-center mb-5">
            상담함에서 제안을 선택하고 검증 리포트를 구매해보세요
          </p>
          <Link href="/decision" className="no-underline">
            <Button variant="accent" size="md">
              상담함 가기 <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-5">
          {reports.map(({ proposal, profile, items, priceAdequacy, riskLevel }) => {
            const price = PRICE_LABELS[priceAdequacy] || PRICE_LABELS.fair;
            const risk = RISK_LABELS[riskLevel] || RISK_LABELS.low;
            const meta = `회복 ${proposal.recoveryDays}일 · ${proposal.anesthesiaType === 'local' ? '부분' : proposal.anesthesiaType === 'sedation' ? '수면' : '전신'}마취`;

            return (
              <Link key={proposal.id} href={`/mypage/reports/${proposal.id}`} className="no-underline block rounded-2xl bg-white p-4"
                style={{ boxShadow: 'var(--app-shadow-card-sm)' }}
              >
                {/* 병원명 + 인증 */}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[14px] font-semibold text-[var(--color-text)]">
                    {profile?.hospitalName || ''}
                  </span>
                  {profile?.verified && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-[9px] font-semibold text-emerald-600">
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
                {items.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {items.slice(0, 3).map(item => (
                      <span key={item.id} className="px-2 py-0.5 rounded-full border border-[var(--color-border-light)] text-[10px] font-medium text-[var(--color-text-secondary)]">
                        {item.treatmentName}
                      </span>
                    ))}
                  </div>
                )}

                {/* 검증 결과 요약 */}
                <div className="flex gap-2 pt-3 border-t border-[var(--color-border-light)]">
                  <div className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg bg-[var(--color-bg-secondary)]">
                    <span className="text-[10px] text-[var(--color-text-dim)]">가격 적정성</span>
                    <span className={`text-[12px] font-bold ${price.color}`}>{price.text}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg bg-[var(--color-bg-secondary)]">
                    <span className="text-[10px] text-[var(--color-text-dim)]">리스크</span>
                    <span className={`text-[12px] font-bold px-2 py-0.5 rounded ${risk.color}`}>{risk.text}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg bg-[var(--color-bg-secondary)]">
                    <span className="text-[10px] text-[var(--color-text-dim)]">과잉진료</span>
                    <span className="text-[12px] font-bold text-emerald-600">의심 없음</span>
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
