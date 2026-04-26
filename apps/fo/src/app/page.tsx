'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Badge, BottomSheet } from '@hyliren/ui';
import { ArrowRight, Camera, MessageCircle, FileText, ChevronRight, ShieldCheck, Clock } from 'lucide-react';
import { ARTICLES } from '@/lib/articles-data';
import { getAreaBar } from '@/lib/area-styles';
import { useLocaleStore } from '@/store/locale';
import { useUserConcernsStore } from '@/store/user-concerns';
import { useMyConcerns } from '@/lib/hooks/concern';
import { listProcedures } from '@/lib/api/procedure';
import type { ProcedureListItemWire } from '@/lib/api/procedure';

type UserPhase = 'idle' | 'waiting' | 'proposals_ready';

const CONCERN_DEFS = [
  { key: 'landing.pain1', area: '눈', detail: '쌍꺼풀' },
  { key: 'landing.pain2', area: '코', detail: '코끝 성형' },
  { key: 'landing.pain3', area: '리프팅', detail: '리프팅' },
  { key: 'landing.pain4', area: '피부', detail: '피부관리' },
  { key: 'landing.pain5', area: '리프팅', detail: '안면윤곽' },
  { key: 'landing.pain6', area: '눈', detail: '눈밑지방' },
];

export default function HomePage() {
  const t = useLocaleStore(s => s.t);
  const { concerns: apiConcerns } = useMyConcerns();
  const userCreatedConcerns = useUserConcernsStore(s => s.concerns);
  const userConcerns = [
    ...apiConcerns.filter(c => !c.deletedAt && c.status !== 'draft'),
    ...userCreatedConcerns,
  ];

  const [popularProcedures, setPopularProcedures] = useState<ProcedureListItemWire[]>([]);
  const [proceduresLoading, setProceduresLoading] = useState(true);

  useEffect(() => {
    listProcedures({ sort: 'popular', limit: 6 })
      .then(d => setPopularProcedures(d.procedures))
      .catch(() => setPopularProcedures([]))
      .finally(() => setProceduresLoading(false));
  }, []);

  // TODO: 백엔드에 unread proposal 집계 endpoint 추가되면 연결 (현재는 진입 시점에 도착 알림 미노출)
  const userProposalCount = 0;
  const phase: UserPhase = userConcerns.length === 0 ? 'idle' : userProposalCount > 0 ? 'proposals_ready' : 'waiting';

  return (
    <div className="flex flex-col pb-28">

      {/* ═══════════════════════════════════════
          HERO — 감정 기반 문제 인식 → 행동 유도
          [공감 → 불안 → 해결 → 행동]
         ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* 히어로 비주얼 — 영상 + 오버레이 텍스트 */}
        <div className="relative w-full aspect-square">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/videos/home_visual_section.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          {/* 어두운 오버레이 — 텍스트 가독성 */}
          <div className="absolute inset-0 bg-black/30" />
          {/* 하단 그라디언트 */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />

          {/* 텍스트 오버레이 */}
          <div className="absolute inset-0 flex flex-col justify-end px-5 pb-6">
            <h1 className="text-[1.75rem] font-bold text-white leading-[1.35] tracking-[-0.5px] mb-3 drop-shadow-md">
              {'요즘,\n나만 신경 쓰이는 걸까?'}
            </h1>
            <p className="text-[15px] text-white/85 leading-[1.6] drop-shadow-sm">
              {'내 얼굴 기준으로\n어떤 선택이 맞는지 먼저 확인해보세요'}
            </p>
          </div>
        </div>

        {/* CTA — 히어로 하단 상시 노출 */}
        <div className="px-5 pt-4 pb-8">
          <Link href="/consult" className="w-full no-underline block">
            <Button variant="primary" size="xl" fullWidth>
              {t('landing.cta')}
              <ArrowRight size={18} />
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <ShieldCheck size={12} className="text-[var(--color-text-dim)]" />
            <span className="text-[10.5px] text-[var(--color-text-dim)]">
              {t('landing.trustMicrocopy')}
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HOW IT WORKS — "사진 한 장이면 시작돼요"
         ═══════════════════════════════════════ */}
      <section className="px-5 pb-8">
        <h2 className="text-[1.0625rem] font-bold text-[var(--color-text)] tracking-[-0.18px] mb-3">{t('landing.howItWorksTitle')}</h2>
        <div className="flex gap-2">
          {[
            { step: '1', title: t('landing.stepUpload'), icon: Camera },
            { step: '2', title: t('landing.stepInput'), icon: MessageCircle },
            { step: '3', title: t('landing.stepReceive'), icon: FileText },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[var(--app-radius)] bg-[var(--color-bg-secondary)]">
                <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] flex items-center justify-center">
                  <Icon size={15} className="text-[var(--color-primary)]" />
                </div>
                <span className="text-[11px] font-semibold text-[var(--color-text)]">{item.title}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[10.5px] text-[var(--color-text-dim)] text-center mt-2">
          {t('landing.avgDelivery')}
        </p>
      </section>

      {/* ═══════════════════════════════════════
          TRUST — 신뢰 지표 (HOW IT WORKS 직후)
         ═══════════════════════════════════════ */}
      <section className="px-5 pb-8">
        <div className="flex items-center justify-center px-3 py-4 rounded-[var(--app-radius)] bg-[var(--color-bg-secondary)]">
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[1rem] font-bold text-[var(--color-text)]">150+</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">{t('landing.trustHospitals')}</span>
          </div>
          <div className="w-px h-7 bg-[var(--color-border-light)]" />
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[1rem] font-bold text-[var(--color-text)]">98%</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">{t('landing.trustResponseRate')}</span>
          </div>
          <div className="w-px h-7 bg-[var(--color-border-light)]" />
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[1rem] font-bold text-[var(--color-text)]">4.8</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">{t('landing.trustSatisfaction')}</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CONCERNS — "내 고민과 비슷한 게 있나요?"
         ═══════════════════════════════════════ */}
      <section className="px-5 pb-8">
        <h2 className="text-[1.0625rem] font-bold text-[var(--color-text)] tracking-[-0.18px] mb-3">{t('landing.concernsTitle')}</h2>
        <div className="flex flex-col gap-2">
          {CONCERN_DEFS.map((c, i) => (
            <Link key={i} href={`/consult?area=${c.area}&detail=${c.detail}`}
              className="flex items-center justify-between px-4 py-3.5 rounded-[var(--app-radius)] bg-[var(--color-bg)] no-underline"
              style={{ boxShadow: 'var(--app-shadow-card-xs)' }}>
              <span className="text-[14px] text-[var(--color-text)]">{t(c.key)}</span>
              <ChevronRight size={16} className="text-[var(--color-text-dim)]" />
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PROCEDURES — PO DB 기반 공개 시술/수술 영역
         ═══════════════════════════════════════ */}
      {(proceduresLoading || popularProcedures.length > 0) && (
        <section className="px-5 pb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[1.0625rem] font-bold text-[var(--color-text)] tracking-[-0.18px]">이런 제안을 받아볼 수 있어요</h2>
              <p className="text-[11px] text-[var(--color-text-dim)] mt-1">관심 있는 시술은 상담 신청에 태그처럼 함께 전달돼요</p>
            </div>
          </div>
          {proceduresLoading ? (
            <div className="flex flex-col gap-3" aria-busy="true" aria-label="시술 정보를 불러오는 중">
              <div className="aspect-[16/10] rounded-[var(--app-radius-card)] bg-[var(--color-bg-secondary)] animate-pulse" />
              <div className="aspect-[16/10] rounded-[var(--app-radius-card)] bg-[var(--color-bg-secondary)] animate-pulse" />
              <div className="aspect-[16/10] rounded-[var(--app-radius-card)] bg-[var(--color-bg-secondary)] animate-pulse" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {popularProcedures.slice(0, 4).map((procedure, i) => (
                <ProcedureFeatureCard key={procedure.id} procedure={procedure} featured={i === 0} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════
          ARTICLES — "더 알아보고 싶다면"
         ═══════════════════════════════════════ */}
      <section className="px-5 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[1.0625rem] font-bold text-[var(--color-text)] tracking-[-0.18px]">{t('landing.articlesTitle')}</h2>
          <Link href="/articles" className="flex items-center gap-0.5 text-[11px] text-[var(--color-text-dim)] no-underline">
            더보기 <ChevronRight size={14} />
          </Link>
        </div>
        <div className="flex flex-col gap-2.5">
          {ARTICLES.slice(0, 3).map(a => (
            <Link key={a.id} href={`/articles/${a.slug}`}
              className="flex gap-3 p-3 rounded-[var(--app-radius)] bg-[var(--color-bg)] no-underline"
              style={{ boxShadow: 'var(--app-shadow-card-sm)' }}>
              <div className="w-14 h-14 rounded-[var(--app-radius-sm)] overflow-hidden shrink-0 relative">
                <img src={a.heroImage} alt={a.title} className="w-full h-full object-cover" />
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${getAreaBar(a.bodyArea)}`} />
              </div>
              <div className="flex flex-col gap-1 justify-center min-w-0">
                <div className="flex items-center gap-1.5">
                  <Badge variant={a.tagColor} size="sm">{a.category}</Badge>
                  <span className="flex items-center gap-0.5 text-[10px] text-[var(--color-text-dim)]">
                    <Clock size={9} /> {a.readTime}분
                  </span>
                </div>
                <span className="text-[13px] font-medium text-[var(--color-text)] leading-snug line-clamp-2">{a.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ 제안 도착 바텀시트 ═══ */}
      {phase === 'proposals_ready' && (
        <ProposalArrivedSheet count={userProposalCount} />
      )}
    </div>
  );
}

function formatProcedurePrice(min: number, max: number): string {
  const toMan = (value: number) => `${Math.round(value / 10000).toLocaleString('ko-KR')}만`;
  return min === max ? toMan(min) : `${toMan(min)}~${toMan(max)}`;
}

function procedureTypeLabel(type: string): string {
  return type
    .replace(/^eye_/, '눈 ')
    .replace(/^nose_/, '코 ')
    .replace(/^lift_/, '리프팅 ')
    .replace(/^skin_/, '피부 ')
    .replace(/^diet_/, '다이어트 ')
    .replace(/^contour_/, '윤곽 ')
    .replace(/_/g, ' ');
}

function ProcedureFeatureCard({ procedure, featured = false }: { procedure: ProcedureListItemWire; featured?: boolean }) {
  return (
    <Link href={`/procedures/${procedure.slug}`} className="no-underline block">
      <article
        className="rounded-[var(--app-radius-card)] overflow-hidden bg-[var(--color-bg)]"
        style={{ boxShadow: 'var(--app-shadow-card-light)' }}
      >
        <div className="relative overflow-hidden bg-[var(--color-bg-tertiary)] aspect-[16/10]">
          {procedure.heroImageUrl ? (
            <img src={procedure.heroImageUrl} alt={procedure.title} className="w-full h-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
          <div className="absolute left-3 top-3 flex gap-1.5">
            {featured && <Badge variant="primary" size="sm">이번 주 인기</Badge>}
            <Badge variant="default" size="sm">{procedure.primaryArea}</Badge>
          </div>
          <div className="absolute left-4 right-4 bottom-4">
            <h3 className="font-bold text-white text-[1.05rem] leading-tight drop-shadow-sm">
              {procedure.title}
            </h3>
          </div>
        </div>

        <div className="px-4 pt-3 pb-3.5">
          <p className="text-[14px] text-[var(--color-text)] leading-snug font-medium mb-1.5">
            내 고민에 맞는지 상담으로 확인해보세요
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[15px] font-bold text-[var(--color-text)]">
                {formatProcedurePrice(procedure.priceMin, procedure.priceMax)}
              </span>
              <span className="text-[11px] text-[var(--color-text-dim)]">· 참고가</span>
            </div>
            <ChevronRight size={15} className="text-[var(--color-text-dim)]" />
          </div>
        </div>
      </article>
    </Link>
  );
}

/* ═══ 제안 도착 바텀시트 ═══ */
function ProposalArrivedSheet({ count }: { count: number }) {
  const [dismissed, setDismissed] = useState(false);

  return (
    <BottomSheet open={!dismissed} onClose={() => setDismissed(true)} showHandle showClose backdropOpacity="20">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-2">
          <img src="/images/proposal-arrived.jpg" alt="" className="w-40 h-40 object-contain" />
        </div>
        <h3 className="text-[1.25rem] font-bold text-[var(--color-text)] leading-tight mb-2">
          새로운 제안이 도착했어요
        </h3>
        <p className="text-[13px] text-[var(--color-text-dim)]">
          {count > 0 ? `${count}개 병원이 맞춤 제안을 보냈어요` : '병원의 맞춤 제안을 확인하세요'}
        </p>
      </div>

      <Link href="/decision" className="no-underline block">
        <Button variant="primary" size="xl" fullWidth>
          제안 확인하기
          <ArrowRight size={18} />
        </Button>
      </Link>
    </BottomSheet>
  );
}
