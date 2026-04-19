'use client';

import { useState } from 'react';
import { ARTICLE_STATUS_KR, ARTICLE_CATEGORY_KR, BODY_AREA_BADGE } from '@hyliren/shared';
import {
  AdminPage, DataGrid,
  badgeCellRenderer, detailLinkRenderer,
} from '@hyliren/ui';
import type { SearchField } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';
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

const ARTICLES = [
  { slug: 'korea-surgery-recovery-first-2-weeks', title: '한국에서 시술 받고 14일, 회복 진짜 어떻게 흘러가?', category: '안전 정보', bodyArea: '전체', status: 'published', publishedAt: '2026-04-17', views: 11600 },
  { slug: 'nose-tip-plasty-mini-rhinoplasty-korea', title: '코 전체 안 건드려도 되더라고요. 미니 코성형 이야기', category: '시술 가이드', bodyArea: '코', status: 'published', publishedAt: '2026-04-17', views: 7300 },
  { slug: 'under-eye-dark-circles-types-approach', title: '내 다크서클, 혈관? 색소? 그림자? 타입부터 찾아봐요', category: '시술 가이드', bodyArea: '눈', status: 'published', publishedAt: '2026-04-17', views: 6100 },
  { slug: 'pigment-laser-picosure-picoway-toning', title: '피코슈어·피코웨이·토닝, 뭐가 달라?', category: '시술 비교', bodyArea: '피부', status: 'published', publishedAt: '2026-04-16', views: 8200 },
  { slug: 'lifting-ulthera-thermage-inmode', title: '울쎄라·써마지·인모드, 솔직히 뭐가 다른 건데?', category: '시술 비교', bodyArea: '리프팅', status: 'published', publishedAt: '2026-04-15', views: 15200 },
  { slug: 'ssangkkeopul-maemol-vs-jeolgae-natural-eyes', title: '매몰이 좋아요, 절개가 좋아요? 쌍꺼풀 고민 정리', category: '시술 비교', bodyArea: '눈', status: 'published', publishedAt: '2026-04-15', views: 12400 },
  { slug: 'skin-booster-rejuran-juvelook-aquashine', title: '리쥬란·쥬베룩·물광주사, 뭐부터 해야 해?', category: '시술 가이드', bodyArea: '피부', status: 'published', publishedAt: '2026-04-15', views: 9800 },
  { slug: '2026-spring-korea-trend-microbotox-thread-sculptra', title: '요즘 한국에서 진짜 뜨는 시술 3가지 — 자연스러움 시대 시술 메뉴판', category: '트렌드', bodyArea: '전체', status: 'published', publishedAt: '2026-04-19', views: 4200 },
  { slug: 'double-chin-jawline-fat-vs-skin-vs-muscle', title: '이중턱, 살 빼면 되는 거 아니야? 턱 아래 3층 구조부터 체크해봐요', category: '시술 가이드', bodyArea: '다이어트', status: 'published', publishedAt: '2026-04-19', views: 3800 },
  { slug: 'lip-shape-3types-filler-corner-reduction', title: '내 입술, 필러야? 입꼬리야? 축소야? 입술 고민 3유형 Q&A', category: '시술 가이드', bodyArea: '기타', status: 'published', publishedAt: '2026-04-19', views: 2900 },
  { slug: 'postpartum-face-change-1-year-friend-story', title: '둘째 낳고 거울 앞에서 한참 서 있던 언니, 결국 1년 동안 한 일은…', category: '사례', bodyArea: '전체', status: 'published', publishedAt: '2026-04-19', views: 5100 },
];

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
    cellRenderer: badgeCellRenderer(BODY_AREA_BADGE),
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
  const rowData: ArticleRow[] = ARTICLES.map(a => ({
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
        onRowClick={(data) => { window.location.href = `/articles/${data.id}`; }}
      />
    </AdminPage>
  );
}
