'use client';

import { useState, useEffect } from 'react';
import { MOCK_CONCERNS, MOCK_PROPOSALS, MOCK_PROPOSAL_ITEMS, MOCK_PARTNER_PROFILES, track } from '@hyliren/shared';
import { Button, Badge, Card, MobileBottomCTA } from '@hyliren/ui';
import { ShieldCheck, Star, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { CARD_GRADIENTS } from '@/lib/constants';
import { ReportNudgeSheet } from '@/components/ReportNudgeSheet';
import { use } from 'react';

interface Props { params: Promise<{ id: string }>; }

export default function ComparePage({ params }: Props) {
  const { id } = use(params);
  const concern = MOCK_CONCERNS.find(c => c.id === id) || MOCK_CONCERNS[0];
  const proposals = MOCK_PROPOSALS
    .filter(p => p.concernId === concern.id && p.isActive && (p.status === 'shortlisted' || p.status === 'viewed'))
    .sort((a, b) => a.totalPrice - b.totalPrice);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(true);

  useEffect(() => {
    track({ eventType: 'compare_entered', actorType: 'user', targetType: 'concern', targetId: concern.id, metadata: { source: 'fo', locale: 'ko', value: String(proposals.length) } });
  }, [concern.id, proposals.length]);

  if (proposals.length === 0) {
    return <div className="p-8 text-center text-[var(--color-text-secondary)]">비교할 제안서가 없습니다</div>;
  }

  /* helper: find best value for a metric */
  const lowestPrice = Math.min(...proposals.map(p => p.totalPrice));
  const fastestRecovery = Math.min(...proposals.map(p => p.recoveryDays));

  return (
    <>
      <div className="pb-4">
        {/* ── Header ── */}
        <div className="px-6 pt-8 pb-2">
          <h1 className="text-[1.625rem] font-bold text-[var(--color-text)] leading-tight">제안서 비교</h1>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-1.5">
            {concern.bodyArea} · {concern.bodyAreaDetail || ''} · {proposals.length}개 제안
          </p>
        </div>

        {/* ── Mini Cards — 선택할 수 있는 카드 행 ── */}
        <div className="flex gap-3 px-6 py-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {proposals.map((p, idx) => {
            const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
            const isActive = selectedId === p.id;
            const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];

            return (
              <button key={p.id} onClick={() => setSelectedId(isActive ? null : p.id)}
                className={`flex flex-col min-w-[9rem] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 text-left bg-[var(--color-surface)] ${
                  isActive
                    ? 'border-[var(--color-primary)] shadow-[0_0_0_2px_var(--color-primary-soft)]'
                    : 'border-[var(--color-border-light)]'
                }`}>
                <div className={`h-20 bg-gradient-to-br ${gradient} relative`}>
                  {isActive && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                      <Check size={12} strokeWidth={3} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <span className="text-[13px] font-semibold text-[var(--color-text)] line-clamp-1">{profile?.hospitalName}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[14px] font-bold text-[var(--color-text)]">{p.totalPrice}만</span>
                    {profile?.verified && <ShieldCheck size={11} className="text-emerald-500" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Comparison Table — visual, not spreadsheet ── */}
        <div className="px-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 w-full py-3 text-[14px] font-semibold text-[var(--color-text)] cursor-pointer bg-transparent border-0">
            항목별 비교
            {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showDetails && (
            <div className="rounded-2xl overflow-hidden border border-[var(--color-border-light)]">
              {/* ── Row: 총 비용 ── */}
              <div className="flex border-b border-[var(--color-border-light)]">
                <div className="w-20 shrink-0 px-4 py-3.5 bg-[var(--color-bg-secondary)] flex items-center">
                  <span className="text-[12px] font-semibold text-[var(--color-text-secondary)]">총 비용</span>
                </div>
                <div className="flex flex-1">
                  {proposals.map(p => (
                    <div key={p.id} className={`flex-1 px-3 py-3.5 flex items-center justify-center ${
                      selectedId === p.id ? 'bg-[var(--color-primary-soft)]' : ''
                    }`}>
                      <span className={`text-[14px] font-bold ${
                        p.totalPrice === lowestPrice ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
                      }`}>
                        {p.totalPrice}만
                        {p.totalPrice === lowestPrice && <span className="text-[10px] ml-0.5">최저</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Row: 회복 ── */}
              <div className="flex border-b border-[var(--color-border-light)]">
                <div className="w-20 shrink-0 px-4 py-3.5 bg-[var(--color-bg-secondary)] flex items-center">
                  <span className="text-[12px] font-semibold text-[var(--color-text-secondary)]">회복</span>
                </div>
                <div className="flex flex-1">
                  {proposals.map(p => (
                    <div key={p.id} className={`flex-1 px-3 py-3.5 flex items-center justify-center ${
                      selectedId === p.id ? 'bg-[var(--color-primary-soft)]' : ''
                    }`}>
                      <span className={`text-[13px] font-semibold ${
                        p.recoveryDays === fastestRecovery ? 'text-emerald-600' : 'text-[var(--color-text)]'
                      }`}>
                        {p.recoveryDays}일
                        {p.recoveryDays === fastestRecovery && <span className="text-[10px] ml-0.5">최단</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Row: 마취 ── */}
              <div className="flex border-b border-[var(--color-border-light)]">
                <div className="w-20 shrink-0 px-4 py-3.5 bg-[var(--color-bg-secondary)] flex items-center">
                  <span className="text-[12px] font-semibold text-[var(--color-text-secondary)]">마취</span>
                </div>
                <div className="flex flex-1">
                  {proposals.map(p => (
                    <div key={p.id} className={`flex-1 px-3 py-3.5 flex items-center justify-center ${
                      selectedId === p.id ? 'bg-[var(--color-primary-soft)]' : ''
                    }`}>
                      <span className="text-[13px] text-[var(--color-text)]">
                        {p.anesthesiaType === 'local' ? '부분' : p.anesthesiaType === 'sedation' ? '수면' : '전신'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Row: 입원 ── */}
              <div className="flex border-b border-[var(--color-border-light)]">
                <div className="w-20 shrink-0 px-4 py-3.5 bg-[var(--color-bg-secondary)] flex items-center">
                  <span className="text-[12px] font-semibold text-[var(--color-text-secondary)]">입원</span>
                </div>
                <div className="flex flex-1">
                  {proposals.map(p => (
                    <div key={p.id} className={`flex-1 px-3 py-3.5 flex items-center justify-center ${
                      selectedId === p.id ? 'bg-[var(--color-primary-soft)]' : ''
                    }`}>
                      <span className="text-[13px] text-[var(--color-text)]">
                        {p.hospitalStayDays === 0 ? '없음' : `${p.hospitalStayDays}일`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Row: 인증 ── */}
              <div className="flex border-b border-[var(--color-border-light)]">
                <div className="w-20 shrink-0 px-4 py-3.5 bg-[var(--color-bg-secondary)] flex items-center">
                  <span className="text-[12px] font-semibold text-[var(--color-text-secondary)]">인증</span>
                </div>
                <div className="flex flex-1">
                  {proposals.map(p => {
                    const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
                    return (
                      <div key={p.id} className={`flex-1 px-3 py-3.5 flex items-center justify-center ${
                        selectedId === p.id ? 'bg-[var(--color-primary-soft)]' : ''
                      }`}>
                        {profile?.verified
                          ? <ShieldCheck size={16} className="text-emerald-500" />
                          : <span className="text-[13px] text-[var(--color-text-dim)]">—</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Row: 시술 항목 ── */}
              <div className="flex">
                <div className="w-20 shrink-0 px-4 py-3.5 bg-[var(--color-bg-secondary)] flex items-start">
                  <span className="text-[12px] font-semibold text-[var(--color-text-secondary)]">시술</span>
                </div>
                <div className="flex flex-1">
                  {proposals.map(p => {
                    const items = MOCK_PROPOSAL_ITEMS.filter(i => i.proposalId === p.id);
                    return (
                      <div key={p.id} className={`flex-1 px-3 py-3.5 flex flex-col items-center gap-1 ${
                        selectedId === p.id ? 'bg-[var(--color-primary-soft)]' : ''
                      }`}>
                        {items.map(item => (
                          <span key={item.id} className="text-[11px] text-[var(--color-text)] text-center leading-snug">
                            {item.treatmentName}
                          </span>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Selected Detail Card ── */}
        {selectedId && (() => {
          const p = proposals.find(pp => pp.id === selectedId);
          if (!p) return null;
          const profile = MOCK_PARTNER_PROFILES.find(pp => pp.memberId === p.memberId);
          const items = MOCK_PROPOSAL_ITEMS.filter(i => i.proposalId === p.id);
          return (
            <div className="px-6 pt-6">
              <h3 className="text-[15px] font-semibold text-[var(--color-text)] mb-3">{profile?.hospitalName} 상세</h3>
              <Card padding="md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center font-bold text-[var(--color-text-secondary)] shrink-0">
                    {(profile?.hospitalName || '병')[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[var(--color-text)]">{profile?.hospitalName}</span>
                      {profile?.verified && <ShieldCheck size={13} className="text-emerald-500" />}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={12} fill="currentColor" className="text-[var(--color-text)]" />
                      <span className="text-[12px] font-semibold text-[var(--color-text)]">4.8</span>
                    </div>
                  </div>
                </div>

                {/* Items breakdown */}
                <div className="flex flex-col gap-2 mb-3">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <span className="text-[13px] text-[var(--color-text)]">{item.treatmentName}</span>
                      <span className="text-[13px] font-semibold text-[var(--color-text-secondary)]">{item.price}만</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border-light)]">
                    <span className="text-[14px] font-semibold text-[var(--color-text)]">합계</span>
                    <span className="text-[16px] font-bold text-[var(--color-text)]">{p.totalPrice}만원</span>
                  </div>
                </div>

                {p.consultationNote && (
                  <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed pt-3 border-t border-[var(--color-border-light)] italic">
                    &ldquo;{p.consultationNote}&rdquo;
                  </p>
                )}
              </Card>
            </div>
          );
        })()}

        <div className="h-24" />
      </div>

      {/* ── Sticky Bottom CTA ── */}
      <MobileBottomCTA>
        {selectedId ? (
          <Button variant="primary" fullWidth size="lg"
            onClick={() => {
              track({ eventType: 'hospital_selected', actorType: 'user', targetType: 'proposal', targetId: selectedId, metadata: { source: 'fo', locale: 'ko', label: concern.bodyArea } });
              alert('병원 선택이 완료되었습니다. (실제 구현 시 상태 전이 API 연결)');
            }}>
            이 제안서 선택하기
          </Button>
        ) : (
          <div className="w-full text-center text-[13px] text-[var(--color-text-dim)] py-1">
            위에서 병원을 탭해 상세 정보를 확인하세요
          </div>
        )}
      </MobileBottomCTA>

      {/* Report nudge — 5초 후 자동 노출, 최초 1회 */}
      <ReportNudgeSheet concernId={concern.id} delay={5000} />
    </>
  );
}
