'use client';

import {
  ANESTHESIA_KR,
  CREDIT_COST,
  formatDateKR,
  formatDateRange,
  PROPOSAL_STATUS_BADGE,
  PROPOSAL_STATUS_KR,
} from '@hyliren/shared';
import { Badge, Card, SectionHeader } from '@hyliren/ui';

import { formatKrwAsMan, type ProposalDetailWire } from '@/lib/api/proposal';
import { useLocaleStore } from '@/store/locale';

interface ProposalDetailViewProps {
  proposal: ProposalDetailWire;
  /** 발송 메타 카드 노출 여부. 기본 true. 페이지/시트 모두 동일 정보 표시. */
  showMeta?: boolean;
}

const TIMELINE_STEPS = ['sent', 'viewed', 'shortlisted', 'selected'] as const;
const TIMELINE_LABEL_KEYS: Record<string, string> = {
  sent: 'po.proposalStatusSent',
  viewed: 'po.proposalStatusViewed',
  shortlisted: 'po.proposalStatusShortlisted',
  selected: 'po.proposalStatusSelected',
};

function getStepIndex(status: string): number {
  const idx = TIMELINE_STEPS.indexOf(status as (typeof TIMELINE_STEPS)[number]);
  return idx >= 0 ? idx : 0;
}

function StatusBadge({ label }: { label: string }) {
  const c = PROPOSAL_STATUS_BADGE[label];
  if (!c) return <Badge>{label}</Badge>;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[var(--text-xs)] font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full opacity-50" style={{ background: c.text }} />
      {label}
    </span>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--text-sm)] text-[var(--text-subdued)]">{label}</span>
      <span className="text-[var(--text-base)] text-[var(--text-default)] font-medium">{children}</span>
    </div>
  );
}

/**
 * Proposal 상세 read-only 뷰 — 페이지(`/proposals/[id]`) / SideSheet(MyProposalSheet) 양쪽 공통.
 * 외부 wrapper 가 width / 헤더 / 사이드바 등을 결정.
 */
export function ProposalDetailView({ proposal, showMeta = true }: ProposalDetailViewProps) {
  const t = useLocaleStore(s => s.t);
  const statusLabel = PROPOSAL_STATUS_KR[proposal.status] ?? proposal.status;
  const currentStep = getStepIndex(proposal.status);

  return (
    <div className="flex flex-col gap-3">
      {/* 상태 + 타임라인 */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[var(--text-sm)] text-[var(--text-subdued)]">{t('po.proposalProgressStatus')}</span>
          <StatusBadge label={statusLabel} />
        </div>
        <div className="flex items-center gap-1">
          {TIMELINE_STEPS.map((step, i) => {
            const reached = i <= currentStep;
            return (
              <div key={step} className="flex items-center gap-1 flex-1">
                <div
                  className={`flex items-center gap-1.5 ${
                    reached ? 'text-[var(--interactive-default)]' : 'text-[var(--text-disabled)]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      reached
                        ? 'bg-[var(--interactive-default)] text-white'
                        : 'bg-[var(--surface-hovered)]'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className={`text-[var(--text-xs)] ${reached ? 'font-semibold' : ''}`}>
                    {t(TIMELINE_LABEL_KEYS[step])}
                  </span>
                </div>
                {i < TIMELINE_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 ${
                      i < currentStep ? 'bg-[var(--interactive-default)]' : 'bg-[var(--surface-hovered)]'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* 시술 항목 + 총 비용 */}
      <Card padding="md">
        <SectionHeader title={t('po.proposalSectionItems')} />
        {proposal.items.length > 0 ? (
          <div className="flex flex-col gap-2 mt-3">
            {proposal.items.map((item, i) => (
              <div
                key={item.id ?? i}
                className="flex justify-between items-center px-4 py-3 rounded-[var(--app-radius)] bg-[var(--surface-subdued)] border border-[var(--border-subdued)]"
              >
                <div>
                  <div className="text-[var(--text-base)] font-medium text-[var(--text-default)]">
                    {item.treatmentName}
                  </div>
                  {item.treatmentNameZh && (
                    <div className="text-[var(--text-xs)] text-[var(--text-subdued)] mt-0.5">
                      {item.treatmentNameZh}
                    </div>
                  )}
                </div>
                <span className="text-[var(--text-md)] font-bold text-[var(--text-default)]">
                  {formatKrwAsMan(item.price)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--text-sm)] text-[var(--text-subdued)] mt-3">{t('po.proposalNoItems')}</p>
        )}

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border-subdued)]">
          <span className="text-[var(--text-base)] font-semibold text-[var(--text-subdued)]">
            {t('po.proposeTotalEstimated')}
          </span>
          <span className="text-[var(--text-2xl)] font-bold text-[var(--text-default)]">
            {formatKrwAsMan(proposal.totalPrice)}
          </span>
        </div>
      </Card>

      {/* 시술 정보 */}
      <Card padding="md">
        <SectionHeader title={t('po.proposalSectionInfo')} />
        <div className="flex flex-col gap-3 mt-3">
          <MetaRow label={t('po.proposalMetaRecovery')}>{t('po.proposalMetaDays', { days: proposal.recoveryDays })}</MetaRow>
          <hr className="border-0 border-t border-[var(--border-subdued)]" />
          <MetaRow label={t('po.proposalMetaAnesthesia')}>{ANESTHESIA_KR[proposal.anesthesiaType] ?? proposal.anesthesiaType}</MetaRow>
          <hr className="border-0 border-t border-[var(--border-subdued)]" />
          <MetaRow label={t('po.proposalMetaStay')}>{t('po.proposalMetaDays', { days: proposal.hospitalStayDays })}</MetaRow>
          <hr className="border-0 border-t border-[var(--border-subdued)]" />
          <MetaRow label={t('po.proposalMetaAvailableRange')}>
            {formatDateRange(proposal.availableDateFrom, proposal.availableDateTo)}
          </MetaRow>
        </div>

        {proposal.consultationNote && (
          <>
            <hr className="border-0 border-t border-[var(--border-subdued)] my-4" />
            <SectionHeader title={t('po.proposalSectionExtra')} />
            <p className="text-[var(--text-base)] text-[var(--text-default)] leading-relaxed mt-3">
              {proposal.consultationNote}
            </p>
          </>
        )}
      </Card>

      {/* 발송 메타 */}
      {showMeta && (
        <Card padding="md">
          <div className="flex flex-col gap-3">
            <MetaRow label={t('po.proposalMetaSentAt')}>{formatDateKR(proposal.sentAt)}</MetaRow>
            <MetaRow label={t('po.proposalMetaViewedAt')}>
              {proposal.viewedAt ? formatDateKR(proposal.viewedAt) : t('po.proposalMetaUnviewed')}
            </MetaRow>
            <MetaRow label={t('po.proposalMetaCreditDeduct')}>{t('po.proposalMetaCreditUnit', { count: CREDIT_COST })}</MetaRow>
          </div>
        </Card>
      )}
    </div>
  );
}
