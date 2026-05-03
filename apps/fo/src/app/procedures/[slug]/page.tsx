'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CalendarDays, CheckCircle2, Clock3,
  HeartHandshake, ImageIcon, MessageCircle, ShieldCheck, Tag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge, Button, Spinner } from '@hyliren/ui';
import { getProcedure, consultClickProcedure } from '@/lib/api/procedure';
import type { ProcedureDetailResponseWire } from '@/lib/api/procedure';
import { useLocaleStore } from '@/store/locale';

type T = (key: string, params?: Record<string, string | number>) => string;

/**
 * AnesthesiaType enum → 'common.anesthesiaLocal/Sedation/General' i18n key 매핑.
 * shared 의 한국어 ANESTHESIA_KR dict 직접 사용 시 모든 로케일에 한국어 노출되는 정책 위반 차단.
 */
function anesthesiaLabel(key: string, t: T): string {
  if (key === 'local') return t('common.anesthesiaLocal');
  if (key === 'sedation') return t('common.anesthesiaSedation');
  if (key === 'general') return t('common.anesthesiaGeneral');
  return key;
}

function formatPrice(min: number, max: number, locale: string, manLabel: string): string {
  const toMan = (value: number) => `${Math.round(value / 10000).toLocaleString(locale)}${manLabel}`;
  return min === max ? toMan(min) : `${toMan(min)}~${toMan(max)}`;
}

function formatDuration(minutes: number, t: T): string {
  if (minutes < 60) return t('procedures.minutesShort', { min: minutes });
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest
    ? t('procedures.hoursMinutes', { hours, min: rest })
    : t('procedures.hoursShort', { hours });
}

export default function ProcedureDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const t = useLocaleStore(s => s.t);
  const locale = useLocaleStore(s => s.locale);
  const [data, setData] = useState<ProcedureDetailResponseWire | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProcedure(slug)
      .then((body) => {
        if (cancelled) return;
        setData(body);
        setError(null);
        setSelectedVariantId(body.variants.find(v => v.isDefault)?.id ?? body.variants[0]?.id ?? null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t('procedures.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug, t]);

  const defaultVariant = useMemo(
    () => data?.variants.find(v => v.isDefault) ?? data?.variants[0] ?? null,
    [data],
  );
  const selectedVariant = useMemo(
    () => data?.variants.find(v => v.id === selectedVariantId) ?? defaultVariant,
    [data, defaultVariant, selectedVariantId],
  );

  async function startConsult() {
    if (!data) return;
    await consultClickProcedure(slug).catch(() => {});
    const params = new URLSearchParams({
      area: data.procedure.primaryArea,
      detail: data.procedure.title,
      procedure: data.procedure.title,
    });
    if (selectedVariant?.name) params.set('tag', selectedVariant.name);
    router.push(`/consult?${params.toString()}`);
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-5 py-16 text-center">
        <p className="text-[15px] font-semibold text-[var(--color-text)] mb-2">{t('procedures.notFound')}</p>
        <p className="text-[13px] text-[var(--color-text-dim)] mb-5">{error ?? t('procedures.notFoundDesc')}</p>
        <Link href="/" className="no-underline">
          <Button variant="secondary" size="md">{t('procedures.goHome')}</Button>
        </Link>
      </div>
    );
  }

  const { procedure, variants } = data;

  return (
    <div className="pb-28 bg-[var(--color-bg-secondary)] min-h-screen">
      <section className="relative bg-[var(--color-bg)]">
        <div className="relative aspect-[4/3] bg-[var(--color-bg-tertiary)] overflow-hidden">
          {procedure.heroImageUrl ? (
            <img src={procedure.heroImageUrl} alt={procedure.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-text-dim)]">
              <ImageIcon size={34} />
            </div>
          )}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute left-4 top-4 w-9 h-9 rounded-full bg-[var(--color-bg)] border-0 flex items-center justify-center"
            style={{ boxShadow: 'var(--app-shadow-card-sm)' }}
            aria-label={t('procedures.back')}
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        <div className="px-5 pt-5 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="primary" size="sm">{t(`common.bodyArea.${procedure.primaryArea}`)}</Badge>
            <span className="text-[11px] text-[var(--color-text-dim)]">{procedure.procedureType}</span>
          </div>
          <h1 className="text-[1.55rem] leading-tight font-bold text-[var(--color-text)] tracking-normal mb-3">
            {procedure.title}
          </h1>
          <p className="text-[14px] leading-6 text-[var(--color-text-secondary)] whitespace-pre-wrap">
            {procedure.description}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 px-5 py-4 bg-[var(--color-bg)] border-t border-[var(--color-border-light)]">
        <SummaryTile label={t('landing.referencePrice')} value={formatPrice(procedure.priceMin, procedure.priceMax, locale, t('common.man'))} />
        <SummaryTile label={t('procedures.summaryRecovery')} value={defaultVariant ? t('report.daysShort', { days: defaultVariant.recoveryDays }) : '-'} />
        <SummaryTile label={t('procedures.summaryDuration')} value={defaultVariant ? formatDuration(defaultVariant.durationMinutes, t) : '-'} />
      </section>

      {procedure.galleryImageUrls.length > 0 && (
        <section className="px-5 py-5">
          <h2 className="text-[15px] font-bold text-[var(--color-text)] mb-3">{t('procedures.galleryTitle')}</h2>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {procedure.galleryImageUrls.map((url, index) => (
              <img
                key={`${url}-${index}`}
                src={url}
                alt=""
                className="w-32 h-32 rounded-[var(--app-radius)] object-cover shrink-0 bg-[var(--color-bg-tertiary)]"
              />
            ))}
          </div>
        </section>
      )}

      <section className="px-5 py-5">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <h2 className="text-[15px] font-bold text-[var(--color-text)]">{t('procedures.variantsTitle')}</h2>
            <p className="text-[11px] text-[var(--color-text-dim)] mt-1">{t('procedures.variantsHint')}</p>
          </div>
          <Tag size={16} className="text-[var(--color-primary)] shrink-0" />
        </div>
        <div className="flex flex-col gap-3">
          {variants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              onClick={() => setSelectedVariantId(variant.id)}
              className={`fo-card p-4 text-left border-0 cursor-pointer transition-all ${
                selectedVariant?.id === variant.id ? 'ring-2 ring-[var(--color-primary)] ring-offset-[var(--color-bg-secondary)] ring-offset-1' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="text-[14px] font-bold text-[var(--color-text)]">{variant.name || t('procedures.variantDefault')}</h3>
                    {variant.isDefault ? <Badge variant="primary" size="sm">{t('common.recommended')}</Badge> : null}
                    {selectedVariant?.id === variant.id ? <Badge variant="success" size="sm">{t('procedures.variantSelected')}</Badge> : null}
                  </div>
                  {variant.description ? (
                    <p className="text-[12px] leading-5 text-[var(--color-text-secondary)]">{variant.description}</p>
                  ) : null}
                </div>
                <strong className="text-[13px] whitespace-nowrap text-[var(--color-text)]">{formatPrice(variant.price, variant.price, locale, t('common.man'))}</strong>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--color-border-light)]">
                <MiniMeta icon={ShieldCheck} label={anesthesiaLabel(variant.anesthesia, t)} />
                <MiniMeta icon={Clock3} label={formatDuration(variant.durationMinutes, t)} />
                <MiniMeta icon={CalendarDays} label={t('procedures.recoveryDays', { days: variant.recoveryDays })} />
              </div>
            </button>
          ))}
        </div>
      </section>

      {procedure.indications.length > 0 && (
        <section className="px-5 py-5 bg-[var(--color-bg)]">
          <h2 className="text-[15px] font-bold text-[var(--color-text)] mb-3">{t('procedures.indicationsTitle')}</h2>
          <div className="grid gap-2">
            {procedure.indications.map((item) => (
              <div key={item} className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
                <CheckCircle2 size={15} className="text-[var(--color-success)] shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="px-5 py-5">
        <div className="fo-card p-4">
          <h2 className="text-[15px] font-bold text-[var(--color-text)] mb-2">{t('procedures.precautionsTitle')}</h2>
          <p className="text-[12.5px] leading-6 text-[var(--color-text-secondary)] whitespace-pre-wrap">
            {procedure.precautions || t('procedures.precautionsDefault')}
          </p>
        </div>
      </section>

      {/* 선택된 variant 의 컨텍스트 표시 — 액션은 sticky CTA 만 담당 (이중 CTA 회피) */}
      <section className="px-5 pb-5">
        <div className="fo-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-primary-soft)] flex items-center justify-center text-[var(--color-primary)] shrink-0">
            <HeartHandshake size={19} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[var(--color-text)] truncate">
              {selectedVariant?.name
                ? t('procedures.consultBoxTitleVariant', { variant: selectedVariant.name })
                : t('procedures.consultBoxTitleDefault')}
            </p>
            <p className="text-[11px] text-[var(--color-text-dim)] mt-0.5">
              {t('procedures.consultBoxDesc')}
            </p>
          </div>
        </div>
      </section>

      <div className="fixed bottom-[calc(var(--fo-bottom-bar-height)+var(--fo-safe-area-bottom)+8px)] left-1/2 -translate-x-1/2 w-full max-w-[var(--fo-frame-max-width)] px-5 z-30">
        <Button variant="primary" size="xl" fullWidth onClick={startConsult}>
          <MessageCircle size={18} />
          {t('procedures.consultCta')}
        </Button>
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--app-radius)] bg-[var(--color-bg-secondary)] px-2 py-3 text-center min-w-0">
      <p className="text-[10.5px] text-[var(--color-text-dim)] mb-1">{label}</p>
      <p className="text-[13px] font-bold text-[var(--color-text)] truncate">{value}</p>
    </div>
  );
}

function MiniMeta({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center justify-center gap-1 rounded-[var(--app-radius-sm)] bg-[var(--color-bg-secondary)] px-1.5 py-2 text-[10.5px] text-[var(--color-text-secondary)] min-w-0">
      <Icon size={12} className="shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}
