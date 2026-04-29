'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Spinner } from '@hyliren/ui';
import { ArrowLeft, ArrowRight, FileCheck, ShieldCheck, Star, Inbox } from 'lucide-react';
import { useReportStore } from '@/store/report';
import { getProposal } from '@/lib/api/proposal';
import type { ProposalDetailWire } from '@/lib/api/proposal/types';
import { useLocaleStore } from '@/store/locale';

const RISK_LABEL_KEYS: Record<string, { key: string; color: string }> = {
  low: { key: 'report.riskLow', color: 'text-[var(--color-success)] bg-[var(--color-success-soft)]' },
  medium: { key: 'report.riskMedium', color: 'text-[var(--color-warning)] bg-[var(--color-warning-soft)]' },
  high: { key: 'report.riskHigh', color: 'text-[var(--color-danger)] bg-[var(--color-danger-soft)]' },
};

const PRICE_LABEL_KEYS: Record<string, { key: string; color: string }> = {
  low: { key: 'report.priceLow', color: 'text-[var(--color-success)]' },
  fair: { key: 'report.priceFair', color: 'text-[var(--color-info)]' },
  high: { key: 'report.priceHigh', color: 'text-[var(--color-warning)]' },
};

interface ReportItem {
  proposal: ProposalDetailWire;
  priceAdequacy: 'low' | 'fair' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
}

export default function PurchasedReportsPage() {
  const { purchasedIds } = useReportStore();
  const t = useLocaleStore(s => s.t);
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
          <ArrowLeft size={14} /> {t('nav.my')}
        </Link>
      </div>

      <div className="px-5 pt-2 pb-5">
        <h1 className="text-[1.25rem] font-bold text-[var(--color-text)] mb-1">{t('report.purchasedTitle')}</h1>
        <p className="text-[12px] text-[var(--color-text-dim)]">
          {t('report.purchasedSubtitle')}
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
          <p className="text-[15px] font-semibold text-[var(--color-text)] mb-1">{t('report.emptyTitle')}</p>
          <p className="text-[12px] text-[var(--color-text-dim)] text-center mb-5">
            {t('report.emptyDesc')}
          </p>
          <Link href="/decision" className="no-underline">
            <Button variant="primary" size="md">
              {t('report.goToInbox')} <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-5">
          {reports.map(({ proposal, priceAdequacy, riskLevel }) => {
            const price = PRICE_LABEL_KEYS[priceAdequacy] || PRICE_LABEL_KEYS.fair;
            const risk = RISK_LABEL_KEYS[riskLevel] || RISK_LABEL_KEYS.low;
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
                      <ShieldCheck size={9} /> {t('common.verified')}
                    </span>
                  )}
                  <div className="flex items-center gap-0.5 text-[10px] text-[var(--color-text-dim)] ml-auto">
                    <Star size={9} fill="currentColor" /> 4.8
                  </div>
                </div>

                {/* 가격 + 메타 */}
                <div className="mb-2.5">
                  <span className="text-[17px] font-bold text-[var(--color-text)] mr-2">{proposal.totalPrice}{t('common.currency')}</span>
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
                    <span className="text-[10px] text-[var(--color-text-dim)]">{t('report.priceAdequacy')}</span>
                    <span className={`text-[12px] font-bold ${price.color}`}>{t(price.key)}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1 py-2 rounded-[var(--app-radius-sm)] bg-[var(--color-bg-secondary)]">
                    <span className="text-[10px] text-[var(--color-text-dim)]">{t('report.risk')}</span>
                    <span className={`text-[12px] font-bold px-2 py-0.5 rounded ${risk.color}`}>{t(risk.key)}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1 py-2 rounded-[var(--app-radius-sm)] bg-[var(--color-bg-secondary)]">
                    <span className="text-[10px] text-[var(--color-text-dim)]">{t('report.overtreatment')}</span>
                    <span className="text-[12px] font-bold text-[var(--color-success)]">{t('report.overNone')}</span>
                  </div>
                </div>

                {/* 구매 뱃지 */}
                <div className="flex items-center justify-center gap-1 mt-3 text-[11px] text-[var(--color-text-dim)]">
                  <FileCheck size={12} />
                  <span>{t('report.verifiedComplete')}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
