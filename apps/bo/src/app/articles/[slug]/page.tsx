import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, Badge, Button, SectionHeader, AdminPage } from '@hyliren/ui';
import { BOSidebar } from '@/components/BOSidebar';
import { BO_ARTICLES } from '../_data';

interface Props { params: Promise<{ slug: string }> }

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = BO_ARTICLES.find(a => a.slug === slug);
  if (!article) notFound();

  return (
    <AdminPage
      sidebar={<BOSidebar active="/articles" />}
      title="아티클 상세"
      prefix="bo"
      actions={
        <Badge variant={article.status === 'published' ? 'success' : 'warning'}>
          {article.status === 'published' ? '발행 중' : '초안'}
        </Badge>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* 좌측 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card padding="md">
            <SectionHeader title={article.title} />
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 12, lineHeight: 1.6 }}>{article.excerpt}</p>
          </Card>

          {article.tags.length > 0 && (
            <Card padding="md">
              <SectionHeader title="태그" />
              <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                {article.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
              </div>
            </Card>
          )}
        </div>

        {/* 우측 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card padding="md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>카테고리</span>
                <Badge variant="info">{article.category}</Badge>
              </div>
              <hr style={{ height: 1, background: '#f1f5f9', border: 0, margin: 0 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>부위</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{article.bodyArea}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>조회수</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{article.views.toLocaleString()}</span>
              </div>
              <hr style={{ height: 1, background: '#f1f5f9', border: 0, margin: 0 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>발행일</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{article.publishedAt}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>슬러그</span>
                <span style={{ fontSize: 12, color: '#94a3b8', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slug}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}
