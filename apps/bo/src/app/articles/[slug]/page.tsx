'use client';

import { use } from 'react';
import Link from 'next/link';
import { Card, Badge, Button, SectionHeader, AdminPage } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';

interface Props { params: Promise<{ slug: string }> }

const ARTICLES_MAP: Record<string, { title: string; category: string; bodyArea: string; excerpt: string; publishedAt: string; views: number; tags: string[] }> = {
  'korea-surgery-recovery-first-2-weeks': { title: '한국에서 시술 받고 14일, 회복 진짜 어떻게 흘러가?', category: '안전 정보', bodyArea: '전체', excerpt: '시술은 결정했는데, 그 다음 2주가 더 불안하죠.', publishedAt: '2026-04-17', views: 11600, tags: ['성형회복', '사후관리', '회복기간'] },
  'lifting-ulthera-thermage-inmode': { title: '울쎄라·써마지·인모드, 솔직히 뭐가 다른 건데?', category: '시술 비교', bodyArea: '리프팅', excerpt: '세 기기를 3층 집 하나로 비유하면 놀랄 만큼 쉽게 정리됩니다.', publishedAt: '2026-04-15', views: 15200, tags: ['울쎄라', '써마지', '인모드'] },
};

export default function ArticleDetailPage({ params }: Props) {
  const { slug } = use(params);
  const article = ARTICLES_MAP[slug];

  return (
    <AdminPage
      sidebar={<BOSidebar active="/articles" />}
      title="아티클 상세"
      prefix="bo"
      actions={article ? <Badge variant="success">발행 중</Badge> : undefined}
    >
      {article ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card padding="md">
            <SectionHeader title={article.title} />
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>카테고리</p>
                <Badge variant="info">{article.category}</Badge>
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>부위</p>
                <p style={{ fontSize: 14 }}>{article.bodyArea}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>조회수</p>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{article.views.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <SectionHeader title="요약" />
            <p style={{ fontSize: 14, color: '#374151', marginTop: 12, lineHeight: 1.6 }}>{article.excerpt}</p>
          </Card>

          <Card padding="md">
            <SectionHeader title="태그" />
            <div className="flex gap-2 mt-3 flex-wrap">
              {article.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
            </div>
          </Card>

          <Card padding="md">
            <SectionHeader title="발행 정보" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>발행일</p>
                <p style={{ fontSize: 14 }}>{article.publishedAt}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>슬러그</p>
                <p style={{ fontSize: 14, color: '#6b7280' }}>{slug}</p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card padding="md">
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#374151', marginBottom: 8 }}>아티클을 찾을 수 없습니다</p>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>슬러그: {slug}</p>
            <Link href="/articles">
              <Button variant="ghost" size="sm">목록으로</Button>
            </Link>
          </div>
        </Card>
      )}
    </AdminPage>
  );
}
