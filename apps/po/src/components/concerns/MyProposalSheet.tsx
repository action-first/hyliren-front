'use client';

import { useEffect, useState } from 'react';
import {
  ANESTHESIA_KR,
  CREDIT_COST,
  formatDateKR,
  formatDateRange,
  PROPOSAL_STATUS_BADGE,
  PROPOSAL_STATUS_KR,
} from '@hyliren/shared';
import { Badge, Card, SectionHeader, SideSheet, Spinner } from '@hyliren/ui';

import { findMyProposalByConcern, formatKrwAsMan, type ProposalDetailWire } from '@/lib/api/proposal';
import { ApiError } from '@/lib/api/errors';

interface MyProposalSheetProps {
  /** 본인 제안서를 조회할 concern id. */
  concernId: string;
  open: boolean;
  onClose: () => void;
}

const TIMELINE_STEPS = ['sent', 'viewed', 'shortlisted', 'selected'] as const;
const TIMELINE_LABELS: Record<string, string> = {
  sent: '발송',
  viewed: '열람',
  shortlisted: '후보',
  selected: '선택',
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

export function MyProposalSheet({ concernId, open, onClose }: MyProposalSheetProps) {
  const [proposal, setProposal] = useState<ProposalDetailWire | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!open) {
      setProposal(null);
      setNotFound(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    findMyProposalByConcern(concernId)
      .then(p => {
        if (cancelled) return;
        if (!p) {
          setNotFound(true);
        } else {
          setProposal(p);
        }
      })
      .catch(err => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, concernId]);

  const statusLabel = proposal ? PROPOSAL_STATUS_KR[proposal.status] ?? proposal.status : '';
  const currentStep = proposal ? getStepIndex(proposal.status) : 0;

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      width="md"
      title={
        <div className="flex items-center gap-2">
          <span>내 제안서</span>
          {proposal && <StatusBadge label={statusLabel} />}
        </div>
      }
    >
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      )}

      {!loading && notFound && (
        <div className="text-center py-16">
          <p className="text-[var(--text-base)] text-[var(--text-subdued)]">
            아직 발송한 제안서가 없습니다.
          </p>
        </div>
      )}

      {!loading && proposal && (
        <div className="flex flex-col gap-4">

          {/* 타임라인 */}
          <Card padding="md">
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
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                          reached
                            ? 'bg-[var(--interactive-default)] text-white'
                            : 'bg-[var(--surface-hovered)]'
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span className={`text-[var(--text-xs)] ${reached ? 'font-semibold' : ''}`}>
                        {TIMELINE_LABELS[step]}
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
            <SectionHeader title="시술 항목" />
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
              <p className="text-[var(--text-sm)] text-[var(--text-subdued)] mt-3">항목 정보 없음</p>
            )}

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border-subdued)]">
              <span className="text-[var(--text-base)] font-semibold text-[var(--text-subdued)]">
                총 예상 비용
              </span>
              <span className="text-[var(--text-2xl)] font-bold text-[var(--text-default)]">
                {formatKrwAsMan(proposal.totalPrice)}
              </span>
            </div>
          </Card>

          {/* 시술 정보 */}
          <Card padding="md">
            <SectionHeader title="시술 정보" />
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <div className="text-[var(--text-sm)] text-[var(--text-subdued)] mb-0.5">회복 기간</div>
                <div className="text-[var(--text-base)] font-medium text-[var(--text-default)]">
                  {proposal.recoveryDays}일
                </div>
              </div>
              <div>
                <div className="text-[var(--text-sm)] text-[var(--text-subdued)] mb-0.5">마취 유형</div>
                <div className="text-[var(--text-base)] font-medium text-[var(--text-default)]">
                  {ANESTHESIA_KR[proposal.anesthesiaType] ?? proposal.anesthesiaType}
                </div>
              </div>
              <div>
                <div className="text-[var(--text-sm)] text-[var(--text-subdued)] mb-0.5">입원 기간</div>
                <div className="text-[var(--text-base)] font-medium text-[var(--text-default)]">
                  {proposal.hospitalStayDays}일
                </div>
              </div>
              <div>
                <div className="text-[var(--text-sm)] text-[var(--text-subdued)] mb-0.5">시술 가능 기간</div>
                <div className="text-[var(--text-base)] font-medium text-[var(--text-default)]">
                  {formatDateRange(proposal.availableDateFrom, proposal.availableDateTo)}
                </div>
              </div>
            </div>

            {proposal.consultationNote && (
              <>
                <hr className="border-0 border-t border-[var(--border-subdued)] my-4" />
                <SectionHeader title="부연 설명" />
                <p className="text-[var(--text-base)] text-[var(--text-default)] leading-relaxed mt-3">
                  {proposal.consultationNote}
                </p>
              </>
            )}
          </Card>

          {/* 메타 — 발송 정보 */}
          <Card padding="md">
            <div className="flex flex-col gap-3.5">
              <MetaRow label="발송일">{formatDateKR(proposal.sentAt)}</MetaRow>
              <MetaRow label="열람일">
                {proposal.viewedAt ? formatDateKR(proposal.viewedAt) : '미열람'}
              </MetaRow>
              <MetaRow label="크레딧 차감">{CREDIT_COST}개</MetaRow>
            </div>
          </Card>
        </div>
      )}
    </SideSheet>
  );
}
