'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ARTICLE_STATUS_KR, ARTICLE_CATEGORY_KR, BODY_AREA_DOT } from '@hyliren/shared';
import {
  AdminPage, DataGrid,
  badgeCellRenderer, dotTextRenderer, detailLinkRenderer,
} from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';
import { BO_ARTICLES } from './_data';
import type { ColDef } from 'ag-grid-community';

interface ArticleRow {
  id: string;
  title: string;
  category: string;
  bodyArea: string;
  statusLabel: string;
  views: string;
  publishedAt: string;
}

function formatViews(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}만` : n >= 1000 ? `${(n / 1000).toFixed(1)}천` : String(n);
}

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  '초안':  { bg: '#fef9c3', text: '#854d0e' },
  '게시':  { bg: '#dcfce7', text: '#166534' },
  '보관':  { bg: '#f3f4f6', text: '#6b7280' },
};

const searchFields: SearchField[] = [
  { key: 'publishedAt', label: '기간', type: 'dateRange', row: 1 },
  { key: 'category', label: '카테고리', type: 'select', row: 1, options: [
    { value: '시술 가이드', label: '시술 가이드' },
    { value: '시술 비교', label: '시술 비교' },
    { value: '안전 정보', label: '안전 정보' },
  ]},
  { key: 'bodyArea', label: '부위', type: 'select', row: 1, options: [
    { value: '눈', label: '눈' }, { value: '코', label: '코' },
    { value: '피부', label: '피부' }, { value: '리프팅', label: '리프팅' },
  ]},
  { key: '_keyword', label: '키워드', placeholder: '제목, 카테고리 통합 검색', row: 2 },
];

const columnDefs: ColDef<ArticleRow>[] = [
  { field: 'title', headerName: '제목', flex: 2, minWidth: 200, filter: true,
    cellStyle: { fontWeight: 500 },
  },
  { field: 'category', headerName: '카테고리', flex: 0.7, minWidth: 90, filter: true },
  { field: 'bodyArea', headerName: '부위', flex: 0.5, minWidth: 70, filter: true,
    cellRenderer: dotTextRenderer(BODY_AREA_DOT),
  },
  { field: 'statusLabel', headerName: '상태', flex: 0.5, minWidth: 70, filter: true,
    cellRenderer: badgeCellRenderer(STATUS_BADGE),
  },
  { field: 'views', headerName: '조회수', flex: 0.5, minWidth: 70, filter: false,
    cellStyle: { color: '#9ca3af', fontVariantNumeric: 'tabular-nums' },
  },
  { field: 'publishedAt', headerName: '발행일', flex: 0.6, minWidth: 85, filter: false,
    cellStyle: { color: '#9ca3af', fontVariantNumeric: 'tabular-nums' },
  },
  { headerName: '액션', flex: 0.4, minWidth: 50, sortable: false, resizable: false, filter: false,
    cellRenderer: detailLinkRenderer<ArticleRow>('/articles', '관리', '#18181b'),
  },
];

export default function ArticlesPage() {
  const router = useRouter();
  const rowData: ArticleRow[] = BO_ARTICLES.map(a => ({
    id: a.slug,
    title: a.title,
    category: a.category,
    bodyArea: a.bodyArea,
    statusLabel: ARTICLE_STATUS_KR[a.status] || a.status,
    views: formatViews(a.views),
    publishedAt: a.publishedAt,
  }));

  return (
    <AdminPage sidebar={<BOSidebar active="/articles" />} title="아티클 관리" prefix="bo">
      <DataGrid<ArticleRow>
        columnDefs={columnDefs}
        rowData={rowData}
        searchFields={searchFields}
        exportFileName="아티클목록"
        title="아티클 목록"
        onRowClick={(data) => router.push(`/articles/${data.id}`)}
      />
    </AdminPage>
  );
}
