import { Link } from '@/components/i18n/Link';
import { ArrowLeft } from 'lucide-react';

/**
 * 법무 페이지 공통 shell — privacy / terms / medical-disclaimer 가 동일한 레이아웃 공유.
 *
 * 디자인 결정:
 *   - 모바일 우선 폭 (fo-frame 환경 안에서 padding 만 조정)
 *   - 마이페이지로 돌아가는 back link (모바일 동선상 마이페이지에서 진입하는 경우가 다수)
 *   - 본문은 children — 페이지별 4 lang content 가 받아옴
 *   - Server component 안에서 사용 가능하도록 useLocaleStore 등 client API 미사용
 *
 * 본 페이지 자체는 server component (static 콘텐츠 4 lang 분기). 검색 인덱싱 + 정적
 * 호스팅 효율 양쪽 정합.
 */
export function LegalPageShell({
  title,
  subtitle,
  backHref,
  backLabel,
  effectiveDateLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel: string;
  effectiveDateLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 pt-4 pb-16 max-w-[640px] mx-auto">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-[12px] text-[var(--color-text-dim)] no-underline mb-4"
      >
        <ArrowLeft size={14} /> {backLabel}
      </Link>

      <h1 className="text-[1.5rem] font-extrabold text-[var(--color-text)] tracking-[-0.3px] mb-2">
        {title}
      </h1>
      {subtitle && (
        <p className="text-[13px] text-[var(--color-text-dim)] leading-[1.6] mb-3 whitespace-pre-line">
          {subtitle}
        </p>
      )}
      {effectiveDateLabel && (
        <p className="text-[11px] text-[var(--color-text-dim)] mb-6">{effectiveDateLabel}</p>
      )}

      <div className="legal-body text-[13.5px] leading-[1.75] text-[var(--color-text)] whitespace-pre-line">
        {children}
      </div>
    </div>
  );
}
