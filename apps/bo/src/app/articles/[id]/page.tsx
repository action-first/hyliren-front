'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPage, Select, Spinner } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';
import { ArticleBodyEditor } from '@/components/article/ArticleBodyEditor';
import { CoverImageUploader } from '@/components/article/CoverImageUploader';
import {
  getArticle, createArticle, updateArticle, updateArticleStatus, deleteArticle,
  type AdminArticleDetail, type AdminArticleTranslation,
  type ArticleCategory, type ArticleIntent, type ArticleLocale, type ArticleStatus,
} from '@/lib/api/admin-articles';
import { ApiError } from '@/lib/api/errors';

const LOCALES: ArticleLocale[] = ['ko', 'zh-CN', 'ja', 'en'];
const LOCALE_LABEL: Record<ArticleLocale, string> = {
  ko: '한국어', 'zh-CN': '中文', ja: '日本語', en: 'English',
};

const CATEGORIES: { value: ArticleCategory; label: string }[] = [
  { value: 'guide', label: '시술 가이드' },
  { value: 'review', label: '시술 후기' },
  { value: 'news', label: '뉴스' },
  { value: 'tip', label: '팁' },
];

const INTENTS: { value: ArticleIntent; label: string }[] = [
  { value: 'education', label: '교육' },
  { value: 'promotion', label: '홍보' },
  { value: 'seo', label: 'SEO' },
];

const STATUSES: { value: ArticleStatus; label: string; color: string }[] = [
  { value: 'draft', label: '초안', color: '#854d0e' },
  { value: 'published', label: '게시', color: '#166534' },
  { value: 'archived', label: '보관', color: '#6b7280' },
];

interface FormState {
  slug: string;
  category: ArticleCategory;
  intent: ArticleIntent;
  coverImageUrl: string | null;
  tags: string[];
  bodyAreas: string[];
  featured: boolean;
  sourceLocale: ArticleLocale;
  status: ArticleStatus;
  translations: Record<ArticleLocale, AdminArticleTranslation>;
}

function emptyTranslation(locale: ArticleLocale): AdminArticleTranslation {
  return { locale, title: '', body: '', excerpt: '' };
}

function emptyForm(): FormState {
  return {
    slug: '',
    category: 'guide',
    intent: 'education',
    coverImageUrl: null,
    tags: [],
    bodyAreas: [],
    featured: false,
    sourceLocale: 'ko',
    status: 'draft',
    translations: {
      ko: emptyTranslation('ko'),
      'zh-CN': emptyTranslation('zh-CN'),
      ja: emptyTranslation('ja'),
      en: emptyTranslation('en'),
    },
  };
}

function fromDetail(d: AdminArticleDetail): FormState {
  const translations = {
    ko: emptyTranslation('ko'),
    'zh-CN': emptyTranslation('zh-CN'),
    ja: emptyTranslation('ja'),
    en: emptyTranslation('en'),
  } as Record<ArticleLocale, AdminArticleTranslation>;
  d.translations.forEach((t) => {
    if (LOCALES.includes(t.locale as ArticleLocale)) {
      translations[t.locale as ArticleLocale] = { locale: t.locale as ArticleLocale, title: t.title, body: t.body, excerpt: t.excerpt };
    }
  });
  return {
    slug: d.slug,
    category: d.category,
    intent: d.intent,
    coverImageUrl: d.coverImageUrl,
    tags: d.tags,
    bodyAreas: d.bodyAreas,
    featured: d.featured,
    sourceLocale: d.sourceLocale,
    status: d.status,
    translations,
  };
}

interface Props { params: Promise<{ id: string }>; }

export default function ArticleDetailPage({ params }: Props) {
  const { id: rawId } = use(params);
  const router = useRouter();
  const isNew = rawId === 'new';

  const [form, setForm] = useState<FormState | null>(isNew ? emptyForm() : null);
  const [activeLocale, setActiveLocale] = useState<ArticleLocale>('ko');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    getArticle(rawId)
      .then((d) => { if (!cancelled) { setForm(fromDetail(d)); setActiveLocale(d.sourceLocale); } })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) { setNotFound(true); return; }
        setError(e instanceof Error ? e.message : '아티클을 불러오지 못했습니다.');
      });
    return () => { cancelled = true; };
  }, [isNew, rawId]);

  async function handleSave() {
    if (!form) return;
    setSaving(true); setError(null);
    try {
      const enteredTranslations = Object.values(form.translations).filter(t => t.title.trim() || t.body.trim() || t.excerpt.trim());
      if (enteredTranslations.length === 0) {
        throw new Error('최소 1개 lang 의 title / body 입력 필수');
      }
      const sourceTranslation = enteredTranslations.find(t => t.locale === form.sourceLocale);
      if (!sourceTranslation || !sourceTranslation.title.trim() || !sourceTranslation.body.trim()) {
        throw new Error(`source_locale (${form.sourceLocale}) title 과 body 는 필수`);
      }
      const body = {
        slug: form.slug || undefined,
        category: form.category,
        intent: form.intent,
        coverImageUrl: form.coverImageUrl,
        tags: form.tags,
        bodyAreas: form.bodyAreas,
        featured: form.featured,
        sourceLocale: form.sourceLocale,
        translations: enteredTranslations,
      };
      if (isNew) {
        const created = await createArticle({ ...body, status: form.status });
        router.push(`/articles/${created.id}`);
      } else {
        await updateArticle(rawId, body);
        const refreshed = await getArticle(rawId);
        setForm(fromDetail(refreshed));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(next: ArticleStatus) {
    if (isNew || !form) return;
    setSaving(true); setError(null);
    try {
      await updateArticleStatus(rawId, next);
      setForm({ ...form, status: next });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '상태 변경 실패');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (isNew) return;
    if (!confirm('정말 삭제하시겠습니까? (소프트 삭제 — FO 노출 차단)')) return;
    setSaving(true); setError(null);
    try {
      await deleteArticle(rawId);
      router.push('/articles');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '삭제 실패');
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <AdminPage sidebar={<BOSidebar active="/articles" />} title="아티클" prefix="bo">
        <div style={{ padding: 24, fontSize: 14 }}>존재하지 않는 아티클입니다.</div>
      </AdminPage>
    );
  }
  if (!form) {
    return (
      <AdminPage sidebar={<BOSidebar active="/articles" />} title="아티클" prefix="bo">
        <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </div>
      </AdminPage>
    );
  }

  const t = form.translations[activeLocale];
  const headerActions = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {!isNew && (
        <div style={{ width: 120 }}>
          <Select
            value={form.status}
            onChange={(v) => handleStatusChange(v as ArticleStatus)}
            disabled={saving}
            options={STATUSES.map(s => ({ value: s.value, label: s.label }))}
          />
        </div>
      )}
      {!isNew && (
        <button type="button" onClick={handleDelete} disabled={saving}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          삭제
        </button>
      )}
      <button type="button" onClick={handleSave} disabled={saving}
        style={{ padding: '8px 14px', borderRadius: 8, border: 0, background: '#18181b', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'wait' : 'pointer' }}>
        {saving ? '저장 중…' : isNew ? '작성하기' : '저장'}
      </button>
    </div>
  );

  return (
    <AdminPage
      sidebar={<BOSidebar active="/articles" />}
      title={isNew ? '아티클 작성' : '아티클 수정'}
      prefix="bo"
      actions={headerActions}
    >
      {error && (
        <div style={{ padding: 14, marginBottom: 16, borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* ── 좌측: 콘텐츠 (4 lang 탭) ── */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #f1f5f9' }}>
          {/* lang 탭 */}
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
            {LOCALES.map(loc => {
              const isActive = loc === activeLocale;
              const isSource = loc === form.sourceLocale;
              const filled = !!form.translations[loc].title || !!form.translations[loc].body;
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setActiveLocale(loc)}
                  style={{
                    padding: '10px 14px', border: 0,
                    borderBottom: isActive ? '2px solid #18181b' : '2px solid transparent',
                    background: 'transparent', cursor: 'pointer',
                    color: isActive ? '#18181b' : '#6b7280',
                    fontSize: 13, fontWeight: isActive ? 600 : 500,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {LOCALE_LABEL[loc]}
                  {isSource && <span style={{ fontSize: 10, color: '#18181b', background: '#fef3c7', padding: '1px 6px', borderRadius: 8 }}>source</span>}
                  {!isSource && filled && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />}
                </button>
              );
            })}
          </div>

          {/* title */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>제목 *</label>
            <input
              type="text"
              value={t.title}
              onChange={(e) => setForm({
                ...form,
                translations: { ...form.translations, [activeLocale]: { ...t, title: e.target.value } },
              })}
              placeholder={`${LOCALE_LABEL[activeLocale]} 제목`}
              maxLength={300}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }}
            />
          </div>

          {/* excerpt */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>요약</label>
            <textarea
              value={t.excerpt}
              onChange={(e) => setForm({
                ...form,
                translations: { ...form.translations, [activeLocale]: { ...t, excerpt: e.target.value } },
              })}
              placeholder={`${LOCALE_LABEL[activeLocale]} 요약 (목록·미리보기에 노출)`}
              maxLength={500}
              rows={2}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          {/* body — TinyMCE */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>본문 *</label>
            <ArticleBodyEditor
              key={activeLocale}
              value={t.body}
              onChange={(html) => setForm({
                ...form,
                translations: { ...form.translations, [activeLocale]: { ...t, body: html } },
              })}
            />
          </div>
        </div>

        {/* ── 우측: 메타 ── */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="slug">
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="auto-generate (비워두면 title 기반)"
              pattern="[a-z0-9-]*"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }}
            />
          </FormField>

          <FormField label="source 언어">
            <Select
              value={form.sourceLocale}
              onChange={(v) => setForm({ ...form, sourceLocale: v as ArticleLocale })}
              disabled={!isNew}
              options={LOCALES.map(loc => ({ value: loc, label: LOCALE_LABEL[loc] }))}
            />
          </FormField>

          <FormField label="카테고리">
            <Select
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v as ArticleCategory })}
              options={CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
            />
          </FormField>

          <FormField label="콘텐츠 목적">
            <Select
              value={form.intent}
              onChange={(v) => setForm({ ...form, intent: v as ArticleIntent })}
              options={INTENTS.map(i => ({ value: i.value, label: i.label }))}
            />
          </FormField>

          <FormField label="태그 (콤마 구분)">
            <input
              type="text"
              value={form.tags.join(', ')}
              onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="쌍꺼풀, 매몰법, ..."
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }}
            />
          </FormField>

          <FormField label="부위 키워드 (콤마 구분)">
            <input
              type="text"
              value={form.bodyAreas.join(', ')}
              onChange={(e) => setForm({ ...form, bodyAreas: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="eyes, nose, lifting, skin, diet, etc"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }}
            />
          </FormField>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            <span style={{ fontSize: 13, color: '#374151' }}>추천 (FO 메인 hero 노출)</span>
          </label>

          {isNew && (
            <FormField label="등록 시 상태">
              <Select
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v as ArticleStatus })}
                options={STATUSES.map(s => ({ value: s.value, label: s.label }))}
              />
            </FormField>
          )}

          <FormField label="커버 이미지">
            <CoverImageUploader
              value={form.coverImageUrl}
              onChange={(url) => setForm({ ...form, coverImageUrl: url })}
            />
          </FormField>
        </div>
      </div>
    </AdminPage>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
