import Link from 'next/link';
import { MOCK_CONCERNS, MOCK_PROPOSALS, MOCK_PARTNER_PROFILES, MOCK_PROPOSAL_ITEMS } from '@hyliren/shared';
import { Badge } from '@hyliren/ui';
import { ShieldCheck, ChevronRight } from 'lucide-react';

const GRADIENTS = [
  'from-[#fce4ec] via-[#f3e5f5] to-[#e8eaf6]',
  'from-[#e0f2f1] via-[#e8f5e9] to-[#f1f8e9]',
  'from-[#fff3e0] via-[#fbe9e7] to-[#fce4ec]',
  'from-[#e3f2fd] via-[#e8eaf6] to-[#ede7f6]',
];

const STATUS_LABELS: Record<string, string> = {
  submitted: '매칭 중',
  proposal_received: '제안 도착',
  comparing: '비교 중',
  hospital_selected: '병원 선택됨',
};

const VALUE_PROPS: Record<string, string> = {
  'm-001': '자연스러운 눈매 전문',
  'm-002': '날렵한 코 라인 전문',
  'm-003': '프리미엄 리프팅 전문',
  'm-004': '피부 + 리프팅 복합 케어',
};

export default function ProposalsTabPage() {
  const activeProposals = MOCK_PROPOSALS
    .filter(p => p.isActive && p.status !== 'draft')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const concernIds = [...new Set(activeProposals.map(p => p.concernId))];

  return (
    <div className="flex flex-col px-5 pt-6 pb-8">
      <h1 className="text-[1.5rem] font-bold text-[var(--color-text)] mb-1">받은 제안서</h1>
      <p className="text-[13px] text-[var(--color-text-secondary)] mb-6">
        {activeProposals.length}개의 제안서가 도착했습니다
      </p>

      <div className="flex flex-col gap-8">
        {concernIds.map(cid => {
          const concern = MOCK_CONCERNS.find(c => c.id === cid);
          const proposals = activeProposals.filter(p => p.concernId === cid);
          if (!concern) return null;

          return (
            <section key={cid}>
              {/* Concern header */}
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="info">{concern.bodyArea}</Badge>
                {concern.bodyAreaDetail && (
                  <span className="text-[13px] text-[var(--color-text-secondary)]">{concern.bodyAreaDetail}</span>
                )}
                <span className="ml-auto text-[11px] font-medium text-[var(--color-primary)] bg-[var(--color-primary-soft)] px-2 py-0.5 rounded-full">
                  {STATUS_LABELS[concern.status] || concern.status}
                </span>
              </div>

              {/* Proposal mini cards */}
              <div className="flex flex-col gap-3">
                {proposals.map((p, idx) => {
                  const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
                  const items = MOCK_PROPOSAL_ITEMS.filter(i => i.proposalId === p.id);
                  const gradient = GRADIENTS[idx % GRADIENTS.length];
                  const valueProp = VALUE_PROPS[p.memberId] || profile?.description || '';

                  return (
                    <Link key={p.id} href={`/concerns/${cid}/proposals`} className="no-underline block">
                      <div className="flex gap-3 rounded-2xl bg-white overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                        {/* Mini cover */}
                        <div className={`w-24 shrink-0 bg-gradient-to-br ${gradient} relative`}>
                          {profile?.verified && (
                            <span className="absolute top-2 left-2">
                              <ShieldCheck size={14} className="text-emerald-500 drop-shadow-sm" />
                            </span>
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex flex-col justify-center py-3 pr-3 min-w-0">
                          <p className="text-[14px] font-medium text-[var(--color-text)] leading-snug mb-0.5 line-clamp-1">{valueProp}</p>
                          <span className="text-[12px] text-[var(--color-text-secondary)] mb-1">{profile?.hospitalName}</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[14px] font-semibold text-[var(--color-text)]">{p.totalPrice}만원</span>
                            <span className="text-[11px] text-[var(--color-text-dim)]">
                              · 회복 {p.recoveryDays}일
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Compare CTA */}
              {proposals.length >= 2 && (
                <Link href={`/concerns/${cid}/compare`}
                  className="flex items-center justify-center gap-1 mt-3 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] text-[13px] font-semibold text-[var(--color-primary)] no-underline">
                  {proposals.length}개 비교하기 <ChevronRight size={14} />
                </Link>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
