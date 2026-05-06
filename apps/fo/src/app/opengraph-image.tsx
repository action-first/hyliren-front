import { ImageResponse } from 'next/og';
import { getServerLocale } from '@/lib/server-locale';

/**
 * MIMYO Open Graph 이미지 (1200×630).
 *
 * 정본은 brand book (`pitch/src/components/brand/OGImagePreview.tsx`).
 * 본 파일은 fo 가 SSR 단계에서 locale 별 OG 를 그려 metadata.openGraph.images 로 자동
 * 노출되도록 한 dynamic 변형 — Next 15 ImageResponse 사용.
 *
 * 결: 따뜻한 한 톤 (#FAFAF8) · 좌측 wordmark + tagline · 우측 거대 Held bowl (curl scale 30, low opacity).
 * 갤러리·grid 금지, ONE mark 원칙 그대로.
 */

export const alt = 'MIMYO — 고민부터 해도 괜찮아요.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const MIMYO_ACCENT = '#FF385C';
const MIMYO_PAPER = '#FAFAF8';
const MIMYO_INK = '#0A0A0A';
const MIMYO_CURL_PATH = 'M 0 6 C 3 10 13 10 18 0';

const TAGLINE: Record<'ko' | 'zh-CN' | 'ja' | 'en', { line1: string; line2: string }> = {
  'ko':    { line1: '고민부터 해도', line2: '괜찮아요.' },
  'zh-CN': { line1: '先聊聊',         line2: '也没关系。' },
  'ja':    { line1: '迷ってから',     line2: '相談しても大丈夫。' },
  'en':    { line1: "It's OK",       line2: 'to start with worries.' },
};

export default async function Image() {
  const locale = await getServerLocale();
  const text = locale === 'zh-CN' ? 'meimiao' : 'mimyo';
  const copy = TAGLINE[locale];

  // Pretendard variable woff2 — jsdelivr CDN. ImageResponse 가 fetch 후 임베드.
  const fontData = await fetch(
    new URL(
      'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Medium.otf',
    ),
  )
    .then((res) => (res.ok ? res.arrayBuffer() : null))
    .catch(() => null);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: MIMYO_PAPER,
          fontFamily: 'Pretendard, sans-serif',
        }}
      >
        {/* Right — Held bowl: brand curl path scale 30 · low opacity */}
        <svg
          width={1200}
          height={630}
          viewBox="0 0 1200 630"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <g transform="translate(700 195) scale(30)" opacity={0.13}>
            <path
              d={MIMYO_CURL_PATH}
              stroke={MIMYO_ACCENT}
              strokeWidth={0.4}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        </svg>

        {/* Left — wordmark + tagline + url */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '62px 80px 58px',
            width: '100%',
            height: '100%',
            justifyContent: 'space-between',
          }}
        >
          {/* Wordmark — text + curl */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            <span style={{ fontSize: 40, fontWeight: 500, color: MIMYO_INK, letterSpacing: -1, lineHeight: 1 }}>
              {text}
            </span>
            <svg width={13} height={7.2} viewBox="0 0 18 10" style={{ marginBottom: 4 }}>
              <path
                d={MIMYO_CURL_PATH}
                stroke={MIMYO_ACCENT}
                strokeWidth={5}
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Tagline */}
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 30 }}>
            <span style={{ fontSize: 92, fontWeight: 500, color: MIMYO_INK, letterSpacing: -4.14, lineHeight: 1.22 }}>
              {copy.line1}
            </span>
            <span style={{ fontSize: 92, fontWeight: 500, color: MIMYO_INK, letterSpacing: -4.14, lineHeight: 1.22 }}>
              {copy.line2}
            </span>
          </div>

          {/* URL */}
          <div style={{ display: 'flex' }}>
            <span style={{ fontSize: 18, fontWeight: 400, color: '#6B665B', letterSpacing: 0.9 }}>
              mi-myo.com
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: 'Pretendard',
              data: fontData,
              style: 'normal',
              weight: 500,
            },
          ]
        : undefined,
    },
  );
}
