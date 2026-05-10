import React from 'react';

/**
 * Article 본문 표시 컴포넌트 — FO `articles/[slug]` 페이지 + BO 미리보기 모달 양쪽에서
 * 동일 시각 결과를 보장하기 위한 공통 view.
 *
 * body 형태:
 *  - HTML (TinyMCE output, '<' 로 시작) → dangerouslySetInnerHTML 로 그대로 렌더
 *  - markdown (기존 seed body) → 자체 line-by-line parser (h2/h3/blockquote/list/inline bold)
 *  - 두 형태 모두 [IMAGE: lifestyle] placeholder 위치에서 lifestyleSlot 삽입
 *
 * i18n 라벨 / Link / 추가 slot 은 props 로 주입 (i18n hook 의존성 격리).
 */

export type ArticleTagColor = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

export interface ArticleViewProps {
  // 콘텐츠
  title: string;
  body: string;
  coverImageUrl: string | null;
  excerpt?: string | null;
  /** Badge 안에 표시할 카테고리 라벨 (이미 i18n 매핑된 결과 string). */
  categoryLabel: string;
  /** 카테고리 Badge variant. */
  tagColor?: ArticleTagColor;
  /** 부위 라벨 (이미 i18n 매핑된 결과). 없으면 미표시. */
  primaryAreaLabel?: string;
  /** "5분 읽기" 같은 메타. 아이콘 포함 ReactNode 전달 가능. 없으면 미표시. */
  readTimeLabel?: React.ReactNode;
  /** "1.5만" / "15K" 같은 view count. 아이콘 포함 가능. 없으면 미표시. */
  viewCountLabel?: React.ReactNode;
  /** publishedAt 표시. 없으면 미표시. */
  publishedAtLabel?: React.ReactNode;

  // 옵션 slots
  /** body 안 [IMAGE: lifestyle] placeholder 위치에 삽입할 컨텐츠. */
  lifestyleSlot?: React.ReactNode;
  /** Hero 이미지 위 영역 (예: 뒤로가기 링크). */
  topSlot?: React.ReactNode;
  /** 본문 아래 CTA 영역. */
  bottomSlot?: React.ReactNode;
  /** 미묘 마스코트 인사 동영상 URL — 본문 아래 CTA 직전에 자동 등장 (autoplay loop muted). */
  mascotVideoUrl?: string;
}

const TAG_BG: Record<ArticleTagColor, string> = {
  default: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-dim)]',
  success: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  info: 'bg-[var(--color-info-soft)] text-[var(--color-info)]',
  primary: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
};

export function ArticleView({
  title,
  body,
  coverImageUrl,
  categoryLabel,
  tagColor = 'default',
  primaryAreaLabel,
  readTimeLabel,
  viewCountLabel,
  publishedAtLabel,
  lifestyleSlot,
  topSlot,
  bottomSlot,
  mascotVideoUrl,
}: ArticleViewProps) {
  return (
    <div className="flex flex-col pb-10">
      {topSlot && <div className="px-5 pt-4 pb-2">{topSlot}</div>}

      {coverImageUrl && (
        <div className="px-5 mb-4">
          <div className="rounded-[var(--app-radius-md)] overflow-hidden">
            <img
              src={coverImageUrl}
              alt={title}
              className="w-full aspect-[16/9] object-cover"
              loading="lazy"
            />
          </div>
        </div>
      )}

      <div className="px-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center font-medium rounded-[var(--app-radius-sm)] whitespace-nowrap px-2 py-1 text-[11px] ${TAG_BG[tagColor]}`}>
            {categoryLabel}
          </span>
          {primaryAreaLabel && (
            <span className="text-[10px] text-[var(--color-text-dim)]">
              {primaryAreaLabel}
            </span>
          )}
        </div>
        <h1 className="text-[1.25rem] font-bold text-[var(--color-text)] leading-[1.35] tracking-[-0.3px] mb-2">
          {title}
        </h1>
        {(readTimeLabel || viewCountLabel || publishedAtLabel) && (
          <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-dim)]">
            {readTimeLabel && <span>{readTimeLabel}</span>}
            {viewCountLabel && <span>{viewCountLabel}</span>}
            {publishedAtLabel && <span>{publishedAtLabel}</span>}
          </div>
        )}
      </div>

      <div className="px-5">
        <ArticleBody body={body} lifestyleSlot={lifestyleSlot} />
      </div>

      {mascotVideoUrl && (
        <div className="px-5 mt-8 flex flex-col items-center gap-2">
          <video
            src={mascotVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-32 h-32 rounded-[var(--app-radius-md)] object-cover"
            aria-label="미묘 마스코트"
          />
          <span className="text-[11px] text-[var(--color-text-dim)]">미묘가 친구처럼 정리해드릴게요</span>
        </div>
      )}

      {bottomSlot && <div className="px-5 mt-6">{bottomSlot}</div>}
    </div>
  );
}

/* ── body 렌더러 ── */

function ArticleBody({ body, lifestyleSlot }: { body: string; lifestyleSlot?: React.ReactNode }) {
  const isHtml = body.trim().startsWith('<');
  if (isHtml) {
    return <HtmlBody body={body} lifestyleSlot={lifestyleSlot} />;
  }
  return <>{renderMarkdownBody(body, lifestyleSlot)}</>;
}

/**
 * HTML body: [IMAGE: lifestyle] 위치에서 split 후 chunk 별 dangerouslySetInnerHTML.
 * 자식 태그 typography 는 wrapper 의 Tailwind arbitrary 자식 셀렉터로 적용.
 */
function HtmlBody({ body, lifestyleSlot }: { body: string; lifestyleSlot?: React.ReactNode }) {
  const chunks = body.split('[IMAGE: lifestyle]');
  return (
    <div
      className={`
        [&>div_p]:text-[13px] [&>div_p]:leading-[1.8] [&>div_p]:text-[var(--color-text-secondary)] [&>div_p]:mb-3
        [&>div_h2]:text-[1.125rem] [&>div_h2]:font-bold [&>div_h2]:text-[var(--color-text)] [&>div_h2]:mt-6 [&>div_h2]:mb-3
        [&>div_h3]:text-[15px] [&>div_h3]:font-bold [&>div_h3]:text-[var(--color-text)] [&>div_h3]:mt-5 [&>div_h3]:mb-2
        [&>div_blockquote]:border-l-2 [&>div_blockquote]:border-[var(--color-primary)] [&>div_blockquote]:pl-3.5 [&>div_blockquote]:my-4
        [&>div_blockquote]:text-[13px] [&>div_blockquote]:text-[var(--color-text-secondary)] [&>div_blockquote]:italic
        [&>div_ul]:my-3 [&>div_ul]:flex [&>div_ul]:flex-col [&>div_ul]:gap-1.5 [&>div_ul]:pl-4
        [&>div_ol]:my-3 [&>div_ol]:flex [&>div_ol]:flex-col [&>div_ol]:gap-1.5 [&>div_ol]:pl-4
        [&>div_li]:text-[13px] [&>div_li]:text-[var(--color-text-secondary)] [&>div_li]:leading-[1.7]
        [&>div_ul_li]:list-disc [&>div_ol_li]:list-decimal
        [&>div_strong]:font-semibold [&>div_strong]:text-[var(--color-text)]
        [&>div_hr]:my-6 [&>div_hr]:border-[var(--color-border-light)]
        [&>div_img]:max-w-full [&>div_img]:h-auto [&>div_img]:rounded-[var(--app-radius)] [&>div_img]:my-5
      `}
    >
      {chunks.map((chunk, i) => (
        <React.Fragment key={i}>
          <div dangerouslySetInnerHTML={{ __html: chunk }} />
          {i < chunks.length - 1 && lifestyleSlot && <>{lifestyleSlot}</>}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Markdown body — 기존 FO `articles/[slug]/page.tsx` renderBody 와 동일 로직.
 * `[IMAGE: lifestyle]` 위치에 lifestyleSlot 삽입. `[IMAGE: hero]` / `[IMAGE: procedure]`
 * 는 마이그 007 적용 후 body 에서 제거됨 (procedure → <img> 변환). 호환을 위해 skip 처리.
 */
function renderMarkdownBody(body: string, lifestyleSlot?: React.ReactNode): React.ReactNode[] {
  const lines = body.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('[IMAGE:')) {
      const type = line.trim().replace('[IMAGE:', '').replace(']', '').trim();
      if (type === 'lifestyle' && lifestyleSlot) {
        elements.push(<React.Fragment key={`lifestyle-${i}`}>{lifestyleSlot}</React.Fragment>);
      }
      i++;
      continue;
    }

    if (line.trim() === '---') {
      elements.push(<hr key={`hr-${i}`} className="my-6 border-[var(--color-border-light)]" />);
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-[15px] font-bold text-[var(--color-text)] mt-5 mb-2">
          {renderInline(line.slice(4))}
        </h3>,
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-[1.125rem] font-bold text-[var(--color-text)] mt-6 mb-3">
          {renderInline(line.slice(3))}
        </h2>,
      );
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <blockquote key={`bq-${i}`} className="border-l-2 border-[var(--color-primary)] pl-3.5 my-4 text-[13px] text-[var(--color-text-secondary)] italic leading-[1.7]">
          {quoteLines.map((ql, qi) => (
            <p key={qi} className="mb-1 last:mb-0">{renderInline(ql)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-3 flex flex-col gap-1.5 pl-4">
          {items.map((item, li) => (
            <li key={li} className="text-[13px] text-[var(--color-text-secondary)] leading-[1.7] list-disc">
              {renderInline(item)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
        while (i < lines.length && lines[i].startsWith('   ') && !lines[i].startsWith('   -')) {
          items[items.length - 1] += ' ' + lines[i].trim();
          i++;
        }
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-3 flex flex-col gap-1.5 pl-4">
          {items.map((item, li) => (
            <li key={li} className="text-[13px] text-[var(--color-text-secondary)] leading-[1.7] list-decimal">
              {renderInline(item)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    // 인라인 HTML (예: <img src="..." />) 도 paragraph 로 흘려보냄.
    if (line.trim().startsWith('<')) {
      elements.push(
        <div key={`html-${i}`} className="my-3" dangerouslySetInnerHTML={{ __html: line }} />,
      );
      i++;
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="text-[13px] text-[var(--color-text-secondary)] leading-[1.8] mb-3">
        {renderInline(line)}
      </p>,
    );
    i++;
  }

  return elements;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-[var(--color-text)]">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
