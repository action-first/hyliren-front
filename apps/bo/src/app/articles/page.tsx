'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminPage, DataGrid, Spinner,
  badgeCellRenderer, dotTextRenderer, detailLinkRenderer,
} from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import type { ColDef } from 'ag-grid-community';
import { BOSidebar } from '@/components/BOSidebar';
import {
  listArticles,
  type AdminArticleListItem,
  type ArticleStatus,
  type ArticleCategory,
} from '@/lib/api/admin-articles';

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  statusLabel: string;
  featured: string;
  views: string;
  publishedAt: string;
  createdAt: string;
}

const STATUS_KR: Record<ArticleStatus, string> = {
  draft: '초안',
  published: '게시',
  archived: '보관',
};

const CATEGORY_KR: Record<ArticleCategory, string> = {
  guide: '시술 가이드',
  review: '시술 후기',
  news: '뉴스',
  tip: '팁',
};

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  '초안': { bg: '#fef9c3', text: '#854d0e' },
  '게시': { bg: '#dcfce7', text: '#166534' },
  '보관': { bg: '#f3f4f6', text: '#6b7280' },
};

const FEATURED_DOT: Record<string, string> = {
  '★': '#f59e0b',
  '': '#e5e7eb',
};

function formatViews(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}만` : n >= 1000 ? `${(n / 1000).toFixed(1)}천` : String(n);
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function toRow(a: AdminArticleListItem): ArticleRow {
  return {
    id: a.id,
    title: a.title || '(제목 없음)',
    slug: a.slug,
    category: CATEGORY_KR[a.category] ?? a.category,
    statusLabel: STATUS_KR[a.status] ?? a.status,
    featured: a.featured ? '★' : '',
    views: formatViews(a.viewCount),
    publishedAt: formatDate(a.publishedAt),
    createdAt: formatDate(a.createdAt),
  };
}

const searchFields: SearchField[] = [
  // row 1 — 단일/짧은 select 들 (statusLabel / category / featured)
  { key: 'statusLabel', label: '상태', type: 'select', row: 1, options: [
    { value: '초안', label: '초안' },
    { value: '게시', label: '게시' },
    { value: '보관', label: '보관' },
  ]},
  { key: 'category', label: '카테고리', type: 'select', row: 1,
    options: Object.values(CATEGORY_KR).map(v => ({ value: v, label: v })),
  },
  { key: 'featured', label: '추천', type: 'select', row: 1, options: [
    { value: '★', label: '추천만' },
  ]},
  // row 2 — 키워드 (긴 input)
  { key: '_keyword', label: '키워드', placeholder: '제목 검색', row: 2 },
];

const columnDefs: ColDef<ArticleRow>[] = [
  { field: 'title', headerName: '제목', flex: 2, minWidth: 200, filter: true,
    cellStyle: { fontWeight: 500 },
  },
  { field: 'category', headerName: '카테고리', flex: 0.7, minWidth: 100, filter: true },
  { field: 'statusLabel', headerName: '상태', flex: 0.5, minWidth: 80, filter: true,
    cellRenderer: badgeCellRenderer(STATUS_BADGE),
  },
  { field: 'featured', headerName: '추천', flex: 0.4, minWidth: 60, filter: false,
    cellRenderer: dotTextRenderer(FEATURED_DOT),
  },
  { field: 'views', headerName: '조회수', flex: 0.5, minWidth: 80, filter: false,
    cellStyle: { fontVariantNumeric: 'tabular-nums', color: '#6b7280' },
  },
  { field: 'publishedAt', headerName: '발행일', flex: 0.7, minWidth: 100, filter: false,
    cellStyle: { fontVariantNumeric: 'tabular-nums', color: '#9ca3af' },
  },
  { headerName: '액션', flex: 0.4, minWidth: 60, sortable: false, resizable: false, filter: false,
    cellRenderer: detailLinkRenderer<ArticleRow>('/articles', '상세', '#18181b'),
  },
];

export default function ArticlesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ArticleRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listArticles({ limit: 100 })
      .then((res) => {
        if (!cancelled) setRows(res.articles.map(toRow));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '아티클 목록을 불러오지 못했습니다.');
      });
    return () => { cancelled = true; };
  }, []);

  const headerActions = useMemo(() => (
    <button
      type="button"
      onClick={() => router.push('/articles/new')}
      style={{
        padding: '8px 14px', borderRadius: 8, border: 0, cursor: 'pointer',
        background: '#18181b', color: '#fff', fontSize: 13, fontWeight: 600,
      }}
    >
      + 새 아티클
    </button>
  ), [router]);

  return (
    <AdminPage sidebar={<BOSidebar active="/articles" />} title="아티클 콘텐츠 관리" prefix="bo" actions={headerActions}>
      {error ? (
        <div style={{ padding: 24, color: 'var(--color-danger,#d72c0d)', fontSize: 13 }}>{error}</div>
      ) : rows === null ? (
        <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </div>
      ) : (
        <DataGrid<ArticleRow>
          columnDefs={columnDefs}
          rowData={rows}
          searchFields={searchFields}
          exportFileName="아티클"
          title="전체 아티클"
          onRowClick={(data) => router.push(`/articles/${data.id}`)}
        />
      )}
    </AdminPage>
  );
}
