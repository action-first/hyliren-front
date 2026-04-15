'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge, Button } from '@hyliren/ui';
import { Clock, Eye, ChevronRight, ArrowRight, BookOpen } from 'lucide-react';
import { useLocaleStore } from '@/store/locale';

/* ── Mock Articles ── */

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  bodyArea: string;
  tagColor: 'info' | 'default' | 'danger' | 'warning';
  gradient: string;
  readTime: number;
  views: number;
  featured?: boolean;
}

const ARTICLES: Article[] = [
  {
    id: 'a-001', title: '쌍꺼풀 수술, 매몰 vs 절개 어떻게 다를까?',
    excerpt: '매몰법은 실로 고정해 흉터가 적고 회복이 빠르지만, 라인이 풀릴 수 있습니다. 절개법은 영구적이지만 회복에 2~3주가 필요합니다. 눈꺼풀 두께와 원하는 라인에 따라 적합한 방법이 다릅니다.',
    category: '시술 비교', bodyArea: '눈', tagColor: 'info', gradient: 'from-[#e3f2fd] to-[#bbdefb]', readTime: 5, views: 12400, featured: true,
  },
  {
    id: 'a-002', title: '코성형 평균 가격과 적정 범위',
    excerpt: '한국 코성형 평균 비용은 250~450만원대입니다. 코끝 성형만 하면 200만원 이하로도 가능하지만, 콧대+코끝 복합 수술은 350만원 이상이 일반적입니다. 너무 싸면 재료비를 줄인 경우가 있어 주의가 필요합니다.',
    category: '비용 가이드', bodyArea: '코', tagColor: 'default', gradient: 'from-[#fff3e0] to-[#ffe0b2]', readTime: 4, views: 9800,
  },
  {
    id: 'a-003', title: '리프팅 부작용, 이것만은 꼭 확인하세요',
    excerpt: '실리프팅은 비절개 시술 중 가장 인기 있지만 당김감, 울퉁불퉁함, 실 돌출 등의 부작용이 있을 수 있습니다. 시술 전 의사의 경력과 사용 실 종류를 반드시 확인하세요.',
    category: '안전 정보', bodyArea: '리프팅', tagColor: 'danger', gradient: 'from-[#fce4ec] to-[#f8bbd0]', readTime: 6, views: 15200, featured: true,
  },
  {
    id: 'a-004', title: '한국 성형 트렌드 2026: 자연스러움이 대세',
    excerpt: '2026년 한국 성형의 키워드는 "자연스러움"과 "최소 침습"입니다. 과도한 변화보다 본인의 얼굴 비율을 살리는 방향으로 트렌드가 변하고 있습니다.',
    category: '트렌드', bodyArea: '전체', tagColor: 'info', gradient: 'from-[#f3e5f5] to-[#e1bee7]', readTime: 3, views: 8200,
  },
  {
    id: 'a-005', title: '피부과 시술, 뭘 먼저 해야 할까?',
    excerpt: '보톡스, 필러, 레이저 토닝... 피부 시술을 처음 접하면 순서가 헷갈립니다. 기본 원칙은 "피부 컨디션 먼저, 볼륨은 나중에"입니다. 레이저로 피부결을 정돈한 후 필러나 보톡스를 진행하면 효과가 오래갑니다.',
    category: '시술 가이드', bodyArea: '피부', tagColor: 'default', gradient: 'from-[#e8f5e9] to-[#c8e6c9]', readTime: 4, views: 7300,
  },
  {
    id: 'a-006', title: '성형 전 꼭 확인해야 할 5가지 체크리스트',
    excerpt: '1) 병원의 전문의 자격 확인 2) 마취 방식과 시설 수준 3) 재수술률 질문하기 4) 기대 결과 사진으로 소통 5) 회복기간과 사후관리 포함 여부. 이 5가지만 확인해도 실패 확률을 크게 줄일 수 있습니다.',
    category: '필수 체크', bodyArea: '전체', tagColor: 'warning', gradient: 'from-[#fff8e1] to-[#ffecb3]', readTime: 5, views: 11600, featured: true,
  },
  {
    id: 'a-007', title: '눈밑지방 재배치, 다크서클이 사라질까?',
    excerpt: '눈밑지방 재배치는 돌출된 지방을 눈 밑 골 부위로 옮기는 수술입니다. 다크서클의 원인이 지방 돌출이라면 효과적이지만, 색소 침착이 원인이면 레이저 치료가 더 적합합니다.',
    category: '시술 설명', bodyArea: '눈', tagColor: 'info', gradient: 'from-[#e3f2fd] to-[#bbdefb]', readTime: 4, views: 6100,
  },
  {
    id: 'a-008', title: '외국인 환자의 한국 성형, 무엇이 다를까?',
    excerpt: '한국 병원은 외국인 환자 전담 코디네이터, 통역 서비스, 공항 픽업까지 제공하는 곳이 많습니다. 하지만 사후관리를 위한 체류 기간과 귀국 후 팔로업 계획은 반드시 미리 확인해야 합니다.',
    category: '가이드', bodyArea: '전체', tagColor: 'default', gradient: 'from-[#e0f2f1] to-[#b2dfdb]', readTime: 5, views: 5400,
  },
];

const CATEGORIES_KO = ['전체', '시술 비교', '비용 가이드', '안전 정보', '시술 가이드', '트렌드', '필수 체크'];

function formatViews(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}만` : n >= 1000 ? `${(n / 1000).toFixed(1)}천` : String(n);
}

export default function ArticlesPage() {
  const t = useLocaleStore(s => s.t);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = selectedCategory === '전체'
    ? ARTICLES
    : ARTICLES.filter(a => a.category === selectedCategory);

  const featured = ARTICLES.filter(a => a.featured);

  return (
    <div className="flex flex-col pb-10">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[1.375rem] font-bold text-[var(--color-text)] leading-tight mb-1">
          {t('articles.pageTitle')}
        </h1>
        <p className="text-[13px] text-[var(--color-text-dim)]">
          {t('articles.pageDesc')}
        </p>
      </div>

      {/* Featured */}
      <section className="px-5 mb-6">
        <div className="flex gap-3 overflow-x-auto pb-1 -mr-5 pr-5" style={{ scrollbarWidth: 'none' }}>
          {featured.map(a => (
            <button key={a.id} type="button"
              onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
              className={`min-w-[15rem] max-w-[16rem] shrink-0 rounded-2xl overflow-hidden bg-white border-0 p-0 text-left cursor-pointer transition-all ${
                expandedId === a.id ? 'ring-2 ring-[var(--color-primary)] ring-offset-1' : ''
              }`}
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div className={`h-24 bg-gradient-to-br ${a.gradient} relative`}>
                <div className="absolute top-2.5 left-2.5">
                  <Badge variant={a.tagColor} size="sm">{a.category}</Badge>
                </div>
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-[9px] text-white/80 bg-black/20 rounded-full px-2 py-0.5">
                  <Eye size={9} /> {formatViews(a.views)}
                </div>
              </div>
              <div className="px-3.5 py-3">
                <p className="text-[13px] font-semibold text-[var(--color-text)] leading-snug line-clamp-2 mb-1.5">{a.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-dim)]">
                  <Clock size={10} /> {t('articles.readTime', { min: a.readTime })}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Expanded featured article */}
      {expandedId && (() => {
        const article = ARTICLES.find(a => a.id === expandedId);
        if (!article) return null;
        return (
          <div className="px-5 mb-6 animate-[slideUp_0.2s_ease-out]">
            <div className="rounded-2xl bg-white px-4 py-4"
              style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={article.tagColor} size="sm">{article.category}</Badge>
                <span className="text-[10px] text-[var(--color-text-dim)]">{t('articles.readTime', { min: article.readTime })}</span>
              </div>
              <h2 className="text-[15px] font-bold text-[var(--color-text)] leading-snug mb-2">{article.title}</h2>
              <p className="text-[13px] text-[var(--color-text-secondary)] leading-[1.7] mb-4">{article.excerpt}</p>
              <Link href="/consult" className="no-underline block">
                <Button variant="primary" size="md" fullWidth>
                  {t('articles.consultCta')} <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
          </div>
        );
      })()}

      {/* Category filter */}
      <div className="px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES_KO.map(cat => (
            <button key={cat} type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3.5 py-2 rounded-full text-[12px] font-medium border-0 cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-[var(--color-text)] text-white'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Article list */}
      <div className="flex flex-col gap-2.5 px-5">
        {filtered.map(a => (
          <button key={a.id} type="button"
            onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
            className="flex gap-3 p-3 rounded-xl bg-white border-0 text-left cursor-pointer w-full"
            style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)' }}>
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
              <div className={`w-full h-full bg-gradient-to-br ${a.gradient} flex items-center justify-center`}>
                <BookOpen size={18} className="text-white/60" />
              </div>
            </div>
            <div className="flex flex-col gap-1 justify-center min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Badge variant={a.tagColor} size="sm">{a.category}</Badge>
                {a.bodyArea !== '전체' && (
                  <span className="text-[10px] text-[var(--color-text-dim)]">{a.bodyArea}</span>
                )}
              </div>
              <span className="text-[13px] font-medium text-[var(--color-text)] leading-snug line-clamp-2">{a.title}</span>
              <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-dim)]">
                <span className="flex items-center gap-0.5"><Clock size={9} /> {t('articles.readTime', { min: a.readTime })}</span>
                <span className="flex items-center gap-0.5"><Eye size={9} /> {formatViews(a.views)}</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-[var(--color-text-dim)] shrink-0 self-center" />
          </button>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="px-5 mt-6">
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-[var(--color-primary-soft)] to-[#fff5f7]">
          <div className="flex-1">
            <span className="text-[13px] font-semibold text-[var(--color-text)] block">{t('articles.bottomTitle')}</span>
            <span className="text-[11px] text-[var(--color-text-dim)]">{t('articles.bottomDesc')}</span>
          </div>
          <Link href="/consult" className="no-underline">
            <Button variant="accent" size="sm">{t('articles.bottomCta')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
