'use client';

import { use } from 'react';
import Link from 'next/link';
import { track } from '@hyliren/shared';
import { Button, Badge } from '@hyliren/ui';
import {
  Calendar, Languages, Car, MapPin, Hotel, HeartPulse,
  ChevronRight, CheckCircle, Clock, ArrowRight,
} from 'lucide-react';
import { useLocaleStore } from '@/store/locale';
import { useDecisionStore } from '@/store/decision';
import { useConcern } from '@/lib/hooks/concern';
import { useProposalsForConcern } from '@/lib/hooks/proposal';
import { STATUS_LABELS, STATUS_COLORS } from '@/domain/lifecycle';

interface Props { params: Promise<{ id: string }>; }

interface ServiceItem {
  key: string;
  icon: typeof Calendar;
  title: string;
  desc: string;
  status: 'available' | 'booked' | 'completed';
  price?: string;
}

export default function ServicesPage({ params }: Props) {
  const t = useLocaleStore(s => s.t);
  const { id } = use(params);
  const { concern } = useConcern(id);
  const { proposals: realProposals } = useProposalsForConcern(id);
  const { selectedHospitalId } = useDecisionStore();
  if (!concern) {
    return <div className="p-8 text-center text-[var(--color-text-secondary)]">{t('concern.notFound')}</div>;
  }

  const proposals = realProposals.filter(p => p.isActive);
  const selectedProposal = selectedHospitalId
    ? proposals.find(p => p.id === selectedHospitalId)
    : proposals[0];

  const services: ServiceItem[] = [
    { key: 'schedule', icon: Calendar, title: t('services.schedule'), desc: t('services.scheduleDesc'), status: 'available' },
    { key: 'interpreter', icon: Languages, title: t('services.interpreter'), desc: t('services.interpreterDesc'), status: 'available', price: t('services.interpreterPrice') },
    { key: 'pickup', icon: Car, title: t('services.pickup'), desc: t('services.pickupDesc'), status: 'available', price: t('services.pickupPrice') },
    { key: 'hotel', icon: Hotel, title: t('services.hotel'), desc: t('services.hotelDesc'), status: 'available' },
    { key: 'recovery', icon: HeartPulse, title: t('services.recovery'), desc: t('services.recoveryDesc'), status: 'available' },
  ];

  const STATUS_ICON = { available: Clock, booked: CheckCircle, completed: CheckCircle };
  const STATUS_TEXT: Record<'available' | 'booked' | 'completed', string> = {
    available: t('services.statusAvailable'),
    booked: t('services.statusBooked'),
    completed: t('services.statusCompleted'),
  };

  return (
    <div className="flex flex-col px-5 pt-5 pb-10">

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={STATUS_COLORS[concern.status] || 'default'}>{STATUS_LABELS[concern.status]}</Badge>
          {concern.bodyAreas.map(area => (
            <Badge key={area} variant="info" size="sm">{t(`common.bodyArea.${area}`)}</Badge>
          ))}
        </div>
        <h1 className="text-[1.375rem] font-bold text-[var(--color-text)] leading-tight mb-1">
          실행 서비스 준비
        </h1>
        <p className="text-[13px] text-[var(--color-text-dim)]">
          시술 전후 필요한 서비스를 준비하세요
        </p>
      </div>

      {/* Selected hospital */}
      {selectedProposal && (
        <div className="rounded-[var(--app-radius-md)] fo-gradient-accent px-4 py-3.5 mb-5">
          <span className="text-[10px] text-[var(--color-text-dim)] block mb-1">{t('mypage.concernSelectedHospital')}</span>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[15px] font-bold text-[var(--color-text)]">{selectedProposal.hospitalName}</span>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--color-text-dim)]">
                <span>{selectedProposal.totalPrice}{t('common.currency')}</span>
                <span>{t('common.recovery')} {selectedProposal.recoveryDays}{t('common.days')}</span>
              </div>
            </div>
            <Link href={`/concerns/${concern.id}/proposals`} className="no-underline">
              <Button variant="ghost" size="sm">{t('mypage.concernViewProposal')}</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Visit info */}
      {concern.visitDateFrom && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--app-radius)] bg-[var(--color-bg-secondary)] mb-5">
          <MapPin size={16} className="text-[var(--color-primary)] shrink-0" />
          <div>
            <span className="text-[13px] font-medium text-[var(--color-text)]">{t('mypage.concernVisitPlanned')}</span>
            <span className="text-[11px] text-[var(--color-text-dim)] block">{concern.visitDateFrom}~{concern.visitDateTo || ''}</span>
          </div>
        </div>
      )}

      {/* Service list */}
      <div className="flex flex-col gap-3 mb-6">
        {services.map(service => {
          const Icon = service.icon;
          const StatusIcon = STATUS_ICON[service.status];
          return (
            <button key={service.key} type="button"
              onClick={() => track({ eventType: 'service_clicked', actorType: 'user', targetType: 'concern', targetId: concern.id, metadata: { source: 'fo', locale: 'ko', label: service.key } })}
              className="flex items-center gap-3.5 px-4 py-4 rounded-[var(--app-radius-md)] bg-[var(--color-bg)] border-0 text-left cursor-pointer w-full"
              style={{ boxShadow: 'var(--app-shadow-card-light)' }}>
              <div className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center shrink-0">
                <Icon size={18} className="text-[var(--color-primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[14px] font-semibold text-[var(--color-text)]">{service.title}</span>
                  {service.price && (
                    <span className="text-[10px] text-[var(--color-text-dim)]">{service.price}</span>
                  )}
                </div>
                <span className="text-[11px] text-[var(--color-text-dim)] leading-relaxed">{service.desc}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <StatusIcon size={12} className={service.status === 'available' ? 'text-[var(--color-text-dim)]' : 'text-[var(--color-success)]'} />
                <span className={`text-[10px] ${service.status === 'available' ? 'text-[var(--color-text-dim)]' : 'text-[var(--color-success)] font-medium'}`}>
                  {STATUS_TEXT[service.status]}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="rounded-[var(--app-radius-md)] bg-[var(--color-bg-secondary)] px-4 py-4">
        <p className="text-[13px] text-[var(--color-text-secondary)] text-center leading-relaxed mb-3">
          서비스는 병원 확정 후 순차적으로 준비됩니다.<br />
          필요한 서비스를 미리 확인해두세요.
        </p>
        <Link href={`/concerns/${concern.id}`} className="no-underline block">
          <Button variant="secondary" size="xl" fullWidth>
            고민 상세로 돌아가기
          </Button>
        </Link>
      </div>
    </div>
  );
}
