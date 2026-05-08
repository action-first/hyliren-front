'use client';

import { use, useEffect, useState } from 'react';
import { Link } from '@/components/i18n/Link';
import { track, formatBudget } from '@hyliren/shared';
import { Button, Badge } from '@hyliren/ui';
import {
  ArrowRight, Edit3, Camera, ChevronRight,
  Sparkles, MessageCircle, BookOpen, Calendar, Wallet,
} from 'lucide-react';
import { computeConcernActions } from '@/domain/lifecycle';
import { useLocaleStore } from '@/store/locale';
import { useConcern } from '@/lib/hooks/concern';
import { useProposalsForConcern } from '@/lib/hooks/proposal';
import { listArticles, listRelatedArticles, mapArticleListItem, type ArticleListItem } from '@/lib/api/article';

function ConcernPhoto({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-24 h-28 rounded-[var(--app-radius)] bg-[var(--color-bg-secondary)] flex items-center justify-center shrink-0">
        <Camera size={28} className="text-[var(--color-text-dim)]" />
      </div>
    );
  }
  return (
    <div className="w-24 h-28 rounded-[var(--app-radius)] bg-[var(--color-bg-secondary)] overflow-hidden shrink-0">
      <img src={url} alt="" className="w-full h-full object-cover" onError={() => setFailed(true)} />
    </div>
  );
}

interface Props { params: Promise<{ id: string }>; }

export default function ConcernDetailPage({ params }: Props) {
  const t = useLocaleStore(s => s.t);
  const { id } = use(params);
  const { concern, photos, loading, error } = useConcern(id);
  const { proposals: realProposals } = useProposalsForConcern(id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !concern) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 text-center">
        <p className="text-[15px] font-semibold text-[var(--color-text)] mb-2">{t('concern.notFound')}</p>
        <p className="text-[12px] text-[var(--color-text-dim)]">{t('concern.notFoundDesc')}</p>
      </div>
    );
  }

  const proposals = realProposals.filter(p => p.isActive);
  const actions = computeConcernActions(concern, realProposals);

  return (
    <div className="flex flex-col px-5 pt-5 pb-10">

      {/* ══════════════════════════════════════
          SECTION 1: 내 고민 요약 (정보)
         ══════════════════════════════════════ */}
      <section className="mb-5">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {concern.bodyAreas.map(area => (
            <Badge key={area} variant="info" size="sm">{t(`common.bodyArea.${area}`)}</Badge>
          ))}
          {concern.bodyAreaDetail && (
            <span className="text-[11px] text-[var(--color-text-dim)]">{concern.bodyAreaDetail}</span>
          )}
        </div>

        <p className="text-[15px] font-semibold text-[var(--color-text)] leading-snug mb-3 line-clamp-3">
          {concern.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {concern.budgetMin && concern.budgetMax && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--app-radius-sm)] bg-[var(--color-bg-secondary)]">
              <Wallet size={12} className="text-[var(--color-text-dim)]" />
              <span className="text-[11px] text-[var(--color-text-secondary)]">{formatBudget(concern.budgetMin, concern.budgetMax)}</span>
            </div>
          )}
          {concern.visitDateFrom && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--app-radius-sm)] bg-[var(--color-bg-secondary)]">
              <Calendar size={12} className="text-[var(--color-text-dim)]" />
              <span className="text-[11px] text-[var(--color-text-secondary)]">{concern.visitDateFrom.slice(5)}~</span>
            </div>
          )}
          {proposals.length > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--app-radius-sm)] bg-[var(--color-bg-secondary)]">
              <span className="text-[11px] text-[var(--color-text-secondary)]">{t('decision.proposalCount', { count: proposals.length })}</span>
            </div>
          )}
        </div>

        {(photos.length > 0 || actions.canAddPhotos) && (
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {photos.map(p => (
              <ConcernPhoto key={p.id} url={p.url} />
            ))}
            {actions.canAddPhotos && photos.length < 3 && (
              <button type="button"
                onClick={() => track({ eventType: 'concern_photo_added', actorType: 'user', targetType: 'concern', targetId: concern.id, metadata: { source: 'fo' } })}
                className="w-24 h-28 rounded-[var(--app-radius)] border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-transparent shrink-0">
                <Camera size={20} className="text-[var(--color-text-dim)]" />
                <span className="text-[10px] text-[var(--color-text-dim)]">{t('concern.form.photosAddMore')}</span>
              </button>
            )}
          </div>
        )}

        {actions.editable && (
          <Link href="/consult" className="flex items-center gap-1 mt-3 text-[12px] font-medium text-[var(--color-primary)] no-underline"
            onClick={() => track({ eventType: 'concern_edited', actorType: 'user', targetType: 'concern', targetId: concern.id, metadata: { source: 'fo' } })}>
            <Edit3 size={12} /> {t('concern.editConcern')}
          </Link>
        )}
      </section>

      {/* ══════════════════════════════════════
          SECTION 2: 현재 상태 + 다음 행동
         ══════════════════════════════════════ */}
      <section className="rounded-[var(--app-radius-md)] bg-[var(--color-bg-secondary)] px-4 py-4 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={actions.statusColor}>{t(actions.statusLabel)}</Badge>
          {actions.hasNewProposal && (
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
          )}
        </div>
        {actions.helperMessage && (
          <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-4">
            {t(actions.helperMessage)}
          </p>
        )}

        {actions.extraActions.map(action => (
          <Link key={action.label} href={action.href} className="no-underline block mb-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--app-radius-sm)] bg-[var(--color-bg)]">
              <Sparkles size={13} className="text-[var(--color-primary)]" />
              <span className="text-[12px] font-medium text-[var(--color-primary)]">{t(action.label, action.i18nParams)}</span>
            </div>
          </Link>
        ))}

        {actions.primaryAction && (
          <Link href={actions.primaryAction.href} className="no-underline block">
            <Button variant="primary" size="xl" fullWidth>
              {t(actions.primaryAction.label, actions.primaryAction.i18nParams)}
              <ArrowRight size={18} />
            </Button>
          </Link>
        )}

        {actions.secondaryAction && (
          <Link href={actions.secondaryAction.href} className="no-underline block mt-2">
            <Button variant="secondary" size="xl" fullWidth>
              {t(actions.secondaryAction.label, actions.secondaryAction.i18nParams)}
            </Button>
          </Link>
        )}
      </section>

      {/* ══════════════════════════════════════
          SECTION 3: 받은 제안서
         ══════════════════════════════════════ */}
      {proposals.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-[var(--color-text)]">{t('concern.receivedProposals')}</h2>
            <Link href={`/concerns/${concern.id}/proposals`} className="flex items-center gap-0.5 text-[11px] text-[var(--color-text-dim)] no-underline">
              {t('common.viewAll')} <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {proposals.slice(0, 3).map(p => (
              <Link key={p.id} href={`/concerns/${concern.id}/proposals`} className="no-underline block">
                <div className="flex items-center gap-3 px-3.5 py-3 rounded-[var(--app-radius)] bg-[var(--color-bg)]"
                  style={{ boxShadow: 'var(--app-shadow-card-light)' }}>
                  <div className="w-9 h-9 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center text-[12px] font-bold text-[var(--color-text-dim)] shrink-0">
                    {(p.hospitalName || t('services.fallbackHospitalName'))[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium text-[var(--color-text)]">{p.hospitalName || t('common.unknownHospital')}</span>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-dim)]">
                      <span>{p.totalPrice}{t('common.currency')}</span>
                      <span>{t('common.recovery')} {p.recoveryDays}{t('common.days')}</span>
                    </div>
                  </div>
                  {!p.viewedAt && <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          SECTION 4: 실행 서비스
         ══════════════════════════════════════ */}
      {actions.canBuyService && (
        <section className="mb-5">
          <div className="rounded-[var(--app-radius-md)] bg-[var(--color-bg)] px-4 py-4"
            style={{ boxShadow: 'var(--app-shadow-card-light)' }}>
            <h3 className="text-[14px] font-semibold text-[var(--color-text)] mb-3">{t('concern.servicePrep')}</h3>
            <div className="flex flex-col gap-2">
              {[
                t('services.schedule'),
                t('services.interpreter'),
                t('services.pickup'),
              ].map(service => (
                <div key={service} className="flex items-center justify-between px-3 py-2.5 rounded-[var(--app-radius)] bg-[var(--color-bg-secondary)]">
                  <span className="text-[13px] text-[var(--color-text)]">{service}</span>
                  <ChevronRight size={14} className="text-[var(--color-text-dim)]" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          SECTION 5: 관련 아티클 (BE listRelatedArticles — 다국어)
         ══════════════════════════════════════ */}
      <RelatedArticlesSection bodyArea={concern.primaryArea} />


      {/* ══════════════════════════════════════
          SECTION 6: 재진입 CTA
         ══════════════════════════════════════ */}
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-[var(--app-radius-md)] bg-[var(--color-bg-secondary)]">
        <MessageCircle size={18} className="text-[var(--color-text-dim)]" />
        <div className="flex-1">
          <span className="text-[13px] text-[var(--color-text-secondary)]">{t('concern.reentryQuestion')}</span>
        </div>
        <Link href="/consult" className="no-underline"
          onClick={() => track({ eventType: 'reentry_cta_clicked', actorType: 'user', targetType: 'concern', targetId: concern.id, metadata: { source: 'fo', label: 'concern_detail' } })}>
          <Button variant="ghost" size="sm">{t('common.register')}</Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * BE listRelatedArticles 기반 관련 아티클 (Accept-Language 따라 4 로케일 자동).
 * 정적 한국어 dict (lifecycle.ts AREA_ARTICLES/STATUS_ARTICLES) 폐기 — sourceLocale 오염 방지.
 */
function RelatedArticlesSection({ bodyArea }: { bodyArea: string }) {
  const t = useLocaleStore(s => s.t);
  const locale = useLocaleStore(s => s.locale);
  const [articles, setArticles] = useState<ArticleListItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const handle = async () => {
      try {
        const related = await listRelatedArticles({ area: bodyArea });
        if (cancelled) return;
        if (related.articles.length > 0) {
          setArticles(related.articles.slice(0, 3).map(mapArticleListItem));
          return;
        }
      } catch { /* fallback to list */ }
      try {
        const all = await listArticles({ limit: 3 });
        if (!cancelled) setArticles(all.articles.map(mapArticleListItem));
      } catch {
        if (!cancelled) setArticles([]);
      }
    };
    void handle();
    return () => { cancelled = true; };
  }, [bodyArea, locale]);

  if (articles.length === 0) return null;

  return (
    <section className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-bold text-[var(--color-text)]">{t('concern.relatedInfo')}</h2>
        <Link href="/articles" className="flex items-center gap-0.5 text-[11px] text-[var(--color-text-dim)] no-underline">
          {t('common.seeMore')} <ChevronRight size={14} />
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {articles.map(a => (
          <Link key={a.id} href={`/articles/${a.slug}`} className="flex gap-3 p-3 rounded-[var(--app-radius)] bg-[var(--color-bg)] no-underline"
            style={{ boxShadow: 'var(--app-shadow-card-sm)' }}>
            <div className="w-12 h-12 rounded-[var(--app-radius-sm)] overflow-hidden shrink-0 bg-[var(--color-bg-secondary)] flex items-center justify-center">
              {a.coverImageUrl ? (
                <img src={a.coverImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <BookOpen size={14} className="text-[var(--color-text-dim)]" />
              )}
            </div>
            <div className="flex flex-col gap-0.5 justify-center min-w-0">
              {a.primaryArea !== 'all' && (
                <Badge variant="info" size="sm">{t(`common.bodyArea.${a.primaryArea}`)}</Badge>
              )}
              <span className="text-[12px] font-medium text-[var(--color-text)] leading-snug line-clamp-1">{a.title}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
