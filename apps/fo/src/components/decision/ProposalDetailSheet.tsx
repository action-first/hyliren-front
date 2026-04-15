'use client';

import { useEffect } from 'react';
import type { Proposal, PartnerProfile, ProposalItem } from '@hyliren/shared';
import { track } from '@hyliren/shared';
import { Button, Badge } from '@hyliren/ui';
import { X, ShieldCheck, Star, Sparkles, Clock, Syringe } from 'lucide-react';
import { VALUE_PROPS } from '@/lib/constants';
import { useLocaleStore } from '@/store/locale';

interface Props {
  proposal: Proposal;
  profile: PartnerProfile | undefined;
  items: ProposalItem[];
  onClose: () => void;
  onAnalyze: () => void;
}

export function ProposalDetailSheet({ proposal, profile, items, onClose, onAnalyze }: Props) {
  const t = useLocaleStore(s => s.t);

  useEffect(() => {
    track({ eventType: 'proposal_viewed', actorType: 'user', targetType: 'proposal', targetId: proposal.id,
      metadata: { source: 'fo', locale: 'ko', label: profile?.hospitalName || '' } });
  }, [proposal.id, profile?.hospitalName]);

  const valueProp = VALUE_PROPS[proposal.memberId] || profile?.description || '';
  const anesthesiaLabel = proposal.anesthesiaType === 'local' ? t('common.anesthesiaLocal') : proposal.anesthesiaType === 'sedation' ? t('common.anesthesiaSedation') : t('common.anesthesiaGeneral');

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-[var(--fo-frame-max-width)] z-50 rounded-t-3xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
        <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto hide-scrollbar">
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 px-5 pt-4 pb-3 border-b border-[var(--color-border-light)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-[var(--color-text)]">{profile?.hospitalName}</span>
                {profile?.verified && <ShieldCheck size={14} className="text-emerald-500" />}
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center border-0 cursor-pointer">
                <X size={16} className="text-[var(--color-text-dim)]" />
              </button>
            </div>
            <p className="text-[12px] text-[var(--color-text-dim)] mt-0.5">{valueProp}</p>
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            {/* Price hero */}
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-[1.75rem] font-bold text-[var(--color-text)]">{proposal.totalPrice}{t('common.currency')}</span>
              <div className="flex items-center gap-1 text-[12px] text-[var(--color-text-dim)]">
                <Star size={11} fill="currentColor" /> 4.8
              </div>
            </div>

            {/* Key info cards */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { icon: Clock, label: t('common.recovery'), value: `${proposal.recoveryDays}${t('common.days')}` },
                { icon: Syringe, label: t('common.anesthesia'), value: anesthesiaLabel },
                { icon: ShieldCheck, label: t('common.hospitalization'), value: proposal.hospitalStayDays > 0 ? `${proposal.hospitalStayDays}${t('common.days')}` : t('common.none') },
              ].map(info => {
                const Icon = info.icon;
                return (
                  <div key={info.label} className="flex flex-col items-center gap-1 py-3 rounded-xl bg-[var(--color-bg-secondary)]">
                    <Icon size={16} className="text-[var(--color-text-dim)]" />
                    <span className="text-[10px] text-[var(--color-text-dim)]">{info.label}</span>
                    <span className="text-[13px] font-semibold text-[var(--color-text)]">{info.value}</span>
                  </div>
                );
              })}
            </div>

            {/* Treatment items */}
            <div className="mb-5">
              <span className="text-[12px] font-semibold text-[var(--color-text-dim)] block mb-2">{t('common.treatmentItems')}</span>
              <div className="flex flex-col gap-1.5">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[var(--color-bg-secondary)]">
                    <span className="text-[13px] text-[var(--color-text)]">{item.treatmentName}</span>
                    <span className="text-[13px] font-semibold text-[var(--color-text)]">{item.price}{t('common.man')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Consultation note */}
            {proposal.consultationNote && (
              <div className="px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] mb-5">
                <span className="text-[10px] text-[var(--color-text-dim)] block mb-1">{t('common.hospitalNote')}</span>
                <p className="text-[13px] text-[var(--color-text)] leading-relaxed italic">
                  &ldquo;{proposal.consultationNote}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Anxiety trigger */}
          <div className="px-5 pb-4">
            <div className="rounded-xl bg-gradient-to-br from-[#fff8f0] to-[#fff5f7] px-4 py-3.5"
              style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }}>
              <p className="text-[13px] font-semibold text-[var(--color-text)] mb-1">
                {t('detail.priceQuestion', { price: proposal.totalPrice })}
              </p>
              <p className="text-[11px] text-[var(--color-text-dim)] leading-relaxed whitespace-pre-line">
                {t('detail.priceHint')}
              </p>
            </div>
          </div>

          {/* Sticky CTA */}
          <div className="sticky bottom-0 bg-white border-t border-[var(--color-border-light)] px-5 py-4">
            <Button variant="accent" size="lg" fullWidth onClick={onAnalyze}>
              <Sparkles size={16} />
              {t('detail.verifyCta')}
            </Button>
            <button type="button"
              onClick={onClose}
              className="w-full mt-2 py-2 text-[13px] font-medium text-[var(--color-text-secondary)] bg-transparent border-0 cursor-pointer">
              {t('detail.otherProposals')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
