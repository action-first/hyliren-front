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
import { useUserConcernsStore } from '@/store/user-concerns';
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
  const userCreatedConcerns = useUserConcernsStore(s => s.concerns);
  const { concern: apiConcern } = useConcern(id);
  const { proposals: realProposals } = useProposalsForConcern(id);
  const { selectedHospitalId } = useDecisionStore();
  const concern = apiConcern || userCreatedConcerns.find(c => c.id === id);
  if (!concern) {
    return <div className="p-8 text-center text-[var(--color-text-secondary)]">{t('concern.notFound')}</div>;
  }

  const proposals = realProposals.filter(p => p.isActive);
  const selectedProposal = selectedHospitalId
    ? proposals.find(p => p.id === selectedHospitalId)
    : proposals[0];

  const services: ServiceItem[] = [
    { key: 'schedule', icon: Calendar, title: '일정 관리', desc: '시술 날짜와 사전 검진 일정을 조율합니다', status: 'available' },
    { key: 'interpreter', icon: Languages, title: '통역 서비스', desc: '병원 상담 시 전문 의료 통역을 제공합니다', status: 'available', price: '₩80,000~' },
    { key: 'pickup', icon: Car, title: '공항 픽업', desc: '인천공항에서 숙소/병원까지 이동을 지원합니다', status: 'available', price: '₩50,000~' },
    { key: 'hotel', icon: Hotel, title: '숙소 안내', desc: '병원 근처 회복에 적합한 숙소를 추천합니다', status: 'available' },
    { key: 'recovery', icon: HeartPulse, title: '회복 케어', desc: '시술 후 관리와 경과 체크를 도와드립니다', status: 'available' },
  ];

  const STATUS_ICON = { available: Clock, booked: CheckCircle, completed: CheckCircle };
  const STATUS_TEXT = { available: '예약 가능', booked: '예약 완료', completed: '완료' };

  return (
    <div className="flex flex-col px-5 pt-5 pb-10">

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={STATUS_COLORS[concern.status] || 'default'}>{STATUS_LABELS[concern.status]}</Badge>
          {concern.bodyAreas.map(area => (
            <Badge key={area} variant="info" size="sm">{area}</Badge>
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
          <span className="text-[10px] text-[var(--color-text-dim)] block mb-1">선택한 병원</span>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[15px] font-bold text-[var(--color-text)]">{selectedProposal.hospitalName}</span>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--color-text-dim)]">
                <span>{selectedProposal.totalPrice}{t('common.currency')}</span>
                <span>{t('common.recovery')} {selectedProposal.recoveryDays}{t('common.days')}</span>
              </div>
            </div>
            <Link href={`/concerns/${concern.id}/proposals`} className="no-underline">
              <Button variant="ghost" size="sm">제안 보기</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Visit info */}
      {concern.visitDateFrom && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--app-radius)] bg-[var(--color-bg-secondary)] mb-5">
          <MapPin size={16} className="text-[var(--color-primary)] shrink-0" />
          <div>
            <span className="text-[13px] font-medium text-[var(--color-text)]">방문 예정</span>
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
