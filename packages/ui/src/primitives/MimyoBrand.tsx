'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * MIMYO brand identity — packages/ui port of `pitch/src/components/brand/LogoSymbol.tsx`.
 *
 * 정본은 brand book (pitch repo). 본 파일은 hyliren apps (fo · po · bo) 가 import 할 수
 * 있도록 같은 컴포넌트를 그대로 옮긴 사본입니다. 시각/모션/상수 모두 동일.
 *
 * 동기화 규칙 — pitch repo LogoSymbol.tsx 가 갱신되면 본 파일도 동일 변경을 반영합니다.
 * (브랜드북은 published package 가 아닌 manually-synced source — drift 발견 시 즉시 정합화.)
 */

export type ThemeMode = 'light' | 'dark';
export type MimyoState =
  | 'breathing'
  | 'listening'
  | 'typing'
  | 'settled'
  | 'submitted';

export const MIMYO_ACCENT = '#FF385C';
export const MIMYO_INK_LIGHT = '#0A0A0A';
export const MIMYO_INK_DARK = '#FFFFFF';
export const MIMYO_CURL_PATH = 'M 0 6 C 3 10 13 10 18 0';
export const MIMYO_CURL_STROKE = 13;

let __keyframesInjected = false;
function injectKeyframes() {
  if (typeof document === 'undefined' || __keyframesInjected) return;
  __keyframesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes mimyo-tittle-breath {
      0%, 100% { transform: scale(0.94); }
      50%      { transform: scale(1.06); }
    }
    @keyframes mimyo-tittle-blink {
      0%, 60%  { opacity: 1; }
      80%      { opacity: 0.45; }
      100%     { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

function tittleColor(state: MimyoState, ink: string): string {
  if (state === 'typing' || state === 'submitted') return MIMYO_ACCENT;
  return ink;
}

function tittleAnim(state: MimyoState): string {
  if (state === 'breathing') return 'mimyo-tittle-breath 1.6s ease-in-out infinite';
  if (state === 'listening') return 'mimyo-tittle-blink 1.2s ease-in-out infinite';
  return 'none';
}

function tittleOpacity(state: MimyoState): number {
  return state === 'submitted' ? 0.55 : 1;
}

export function ink(theme: ThemeMode): string {
  return theme === 'light' ? MIMYO_INK_LIGHT : MIMYO_INK_DARK;
}

export function paper(theme: ThemeMode): string {
  return theme === 'light' ? '#FFFFFF' : MIMYO_INK_LIGHT;
}

/* ── Wordmark ─────────────────────────────────────────── */

export type WordmarkTone = 'default' | 'display' | 'subtle' | 'caps';
export type WordmarkLocale = 'ko' | 'zh' | 'kr';

const WORDMARK_LOCALE: Record<
  WordmarkLocale,
  {
    text: string;
    iIndex: number;
    fallbackDotRatio: number;
    letterSpacingOverride?: string;
  }
> = {
  ko: { text: 'mimyo', iIndex: 1, fallbackDotRatio: 0.785 },
  zh: { text: 'meimiao', iIndex: 2, fallbackDotRatio: 1.36 },
  kr: {
    text: '미묘',
    iIndex: -1,
    fallbackDotRatio: 0,
    letterSpacingOverride: '-0.045em',
  },
};

export interface WordmarkProps {
  color?: string;
  fontSize?: number;
  showHanzi?: boolean;
  state?: MimyoState;
  tone?: WordmarkTone;
  locale?: WordmarkLocale;
}

interface ToneSpec {
  fontWeight: number;
  letterSpacing: string;
  textTransform?: 'uppercase' | 'none';
  opacityFactor: number;
  showTittle: boolean;
  showCurl: boolean;
}

function toneSpec(tone: WordmarkTone): ToneSpec {
  switch (tone) {
    case 'display':
      return { fontWeight: 700, letterSpacing: '-0.04em', opacityFactor: 1, showTittle: true, showCurl: true };
    case 'subtle':
      return { fontWeight: 300, letterSpacing: '-0.015em', opacityFactor: 0.55, showTittle: false, showCurl: false };
    case 'caps':
      return { fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', opacityFactor: 1, showTittle: false, showCurl: false };
    default:
      return { fontWeight: 500, letterSpacing: '-0.025em', opacityFactor: 1, showTittle: true, showCurl: true };
  }
}

export function Wordmark({
  color = MIMYO_INK_LIGHT,
  fontSize = 56,
  showHanzi = false,
  state = 'breathing',
  tone = 'default',
  locale = 'ko',
}: WordmarkProps) {
  useEffect(injectKeyframes, []);
  const spec = toneSpec(tone);
  const localeData = WORDMARK_LOCALE[locale];
  const showTittle = spec.showTittle && localeData.iIndex >= 0;

  const wordRef = useRef<HTMLSpanElement>(null);
  const dotSize = fontSize * 0.13;
  const fallbackDotLeft = fontSize * localeData.fallbackDotRatio;
  const [dotLeft, setDotLeft] = useState<number>(fallbackDotLeft);
  const dotCenterY = fontSize * 0.18;

  useEffect(() => {
    if (!showTittle) return;
    const span = wordRef.current;
    if (!span) return;
    const measure = () => {
      const textNode = span.firstChild;
      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
      const range = document.createRange();
      range.setStart(textNode as Text, localeData.iIndex);
      range.setEnd(textNode as Text, localeData.iIndex + 1);
      const iRect = range.getBoundingClientRect();
      const containerRect = span.getBoundingClientRect();
      const stemCenterX = iRect.left + iRect.width * 0.46 - containerRect.left;
      setDotLeft(stemCenterX - dotSize / 2);
    };
    measure();
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(measure);
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [fontSize, dotSize, showTittle, localeData.iIndex]);

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: showHanzi ? fontSize * 0.42 : 0,
        fontFamily: 'Pretendard, "Pretendard Variable", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        fontSize,
        lineHeight: 1,
        letterSpacing: localeData.letterSpacingOverride ?? spec.letterSpacing,
        color,
        fontWeight: spec.fontWeight,
        opacity: spec.opacityFactor,
        textTransform: spec.textTransform,
      }}
    >
      <span ref={wordRef} style={{ position: 'relative' }}>
        {localeData.text}
        {showTittle && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: dotCenterY - dotSize / 2,
              left: dotLeft,
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              background: tittleColor(state, color),
              opacity: tittleOpacity(state),
              animation: tittleAnim(state),
              transition: 'background-color 300ms ease-out, opacity 300ms ease-out',
              transformOrigin: 'center',
              willChange: 'transform, opacity, background-color',
            }}
          />
        )}
      </span>
      {spec.showCurl && !showHanzi && <CurlSwash fontSize={fontSize} />}
      {showHanzi && <Hanzi color={color} fontSize={fontSize} />}
    </span>
  );
}

function CurlSwash({ fontSize }: { fontSize: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 18 10"
      width={fontSize * 0.32}
      height={fontSize * 0.18}
      style={{
        display: 'inline-block',
        verticalAlign: 'baseline',
        marginLeft: fontSize * 0.06,
        transform: `translateY(${fontSize * 0.108}px)`,
        overflow: 'visible',
      }}
    >
      <path
        d={MIMYO_CURL_PATH}
        stroke={MIMYO_ACCENT}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Hanzi({ color, fontSize }: { color: string; fontSize: number }) {
  return (
    <span
      lang="zh"
      style={{
        fontFamily: '"Noto Serif SC", "Noto Sans SC", serif',
        fontWeight: 500,
        fontSize: fontSize * 0.46,
        opacity: 0.45,
        letterSpacing: '0.06em',
        color,
      }}
    >
      美妙
    </span>
  );
}

/* ── Symbol ─────────────────────────────────────────── */

export type SymbolVariant = 'primary' | 'outlined' | 'korean' | 'hanzi' | 'mini';

export interface SymbolProps {
  size?: number;
  theme?: ThemeMode;
  state?: MimyoState;
  variant?: SymbolVariant;
}

export function MimyoSymbol({
  size = 64,
  theme = 'light',
  state = 'breathing',
  variant = 'primary',
}: SymbolProps) {
  useEffect(injectKeyframes, []);
  if (variant === 'outlined') return <OutlinedSymbol size={size} theme={theme} state={state} />;
  if (variant === 'korean') return <CharSymbol size={size} theme={theme} state={state} char="미" font='Pretendard, "Pretendard Variable", sans-serif' />;
  if (variant === 'hanzi') return <CharSymbol size={size} theme={theme} state={state} char="妙" font='"Noto Serif SC", "Noto Sans SC", serif' charSizeFactor={0.56} />;
  if (variant === 'mini') return <MiniSymbol size={size} theme={theme} state={state} />;
  return <PrimarySymbol size={size} theme={theme} state={state} />;
}

function CustomMGlyph({ fill, curlColor, showCurl = true }: { fill: string; curlColor: string; showCurl?: boolean }) {
  return (
    <g>
      <path
        d="M 22 84 L 22 44 Q 22 30 36 30 Q 50 30 50 44 L 50 84 M 50 44 Q 50 30 64 30 Q 78 30 78 44 L 78 84"
        fill="none"
        stroke={fill}
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showCurl && (
        <g transform="translate(78 78.6)">
          <SymbolCurl curlColor={curlColor} />
        </g>
      )}
    </g>
  );
}

function SymbolCurl({ curlColor }: { curlColor: string }) {
  return (
    <path
      d={MIMYO_CURL_PATH}
      fill="none"
      stroke={curlColor}
      strokeWidth={MIMYO_CURL_STROKE}
      strokeLinecap="round"
    />
  );
}

function PrimarySymbol({ size, theme, state }: Required<Pick<SymbolProps, 'size' | 'theme' | 'state'>>) {
  const inkColor = ink(theme);
  const paperColor = paper(theme);
  const radius = size * 0.225;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ display: 'block', opacity: tittleOpacity(state), transition: 'opacity 300ms ease-out' }}
    >
      <rect x="0" y="0" width={size} height={size} rx={radius} ry={radius} fill={inkColor} />
      <g transform={`translate(${size * 0.150}, ${size * 0.101}) scale(${size * 0.0070})`}>
        <CustomMGlyph fill={paperColor} curlColor={MIMYO_ACCENT} showCurl />
      </g>
    </svg>
  );
}

function OutlinedSymbol({ size, theme, state }: Required<Pick<SymbolProps, 'size' | 'theme' | 'state'>>) {
  const inkColor = ink(theme);
  const stroke = Math.max(1.5, size * 0.06);
  const radius = size * 0.225;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ display: 'block', opacity: tittleOpacity(state), transition: 'opacity 300ms ease-out' }}
    >
      <rect
        x={stroke / 2}
        y={stroke / 2}
        width={size - stroke}
        height={size - stroke}
        rx={radius}
        ry={radius}
        fill="none"
        stroke={inkColor}
        strokeWidth={stroke}
      />
      <g transform={`translate(${size * 0.150}, ${size * 0.101}) scale(${size * 0.0070})`}>
        <CustomMGlyph fill={inkColor} curlColor={MIMYO_ACCENT} showCurl />
      </g>
    </svg>
  );
}

function CharSymbol({
  size,
  theme,
  state,
  char,
  font,
  charSizeFactor = 0.62,
}: Required<Pick<SymbolProps, 'size' | 'theme' | 'state'>> & { char: string; font: string; charSizeFactor?: number }) {
  const inkColor = ink(theme);
  const paperColor = paper(theme);
  const radius = size * 0.225;
  const charSize = size * charSizeFactor;
  const charY = size * (0.5 + 0.38 * charSizeFactor);
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ display: 'block', opacity: tittleOpacity(state), transition: 'opacity 300ms ease-out' }}
    >
      <rect x="0" y="0" width={size} height={size} rx={radius} ry={radius} fill={inkColor} />
      <text
        x={size / 2}
        y={charY}
        textAnchor="middle"
        fontFamily={font}
        fontSize={charSize}
        fontWeight={500}
        fill={paperColor}
      >
        {char}
      </text>
      <g transform={`translate(${size * 0.67}, ${size * 0.665}) scale(${size * 0.0070})`}>
        <SymbolCurl curlColor={MIMYO_ACCENT} />
      </g>
    </svg>
  );
}

function MiniSymbol({ size, theme, state }: Required<Pick<SymbolProps, 'size' | 'theme' | 'state'>>) {
  const inkColor = ink(theme);
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{
        display: 'block',
        opacity: tittleOpacity(state),
        transition: 'opacity 300ms ease-out',
        overflow: 'visible',
        animation: tittleAnim(state),
        transformOrigin: 'center',
      }}
    >
      <g transform={`translate(${size * 0.05}, ${-size * 0.013}) scale(${size * 0.009})`}>
        <CustomMGlyph fill={inkColor} curlColor={MIMYO_ACCENT} showCurl />
      </g>
    </svg>
  );
}

/* ── Lockup ─────────────────────────────────────────── */

export interface MimyoLogoProps {
  symbolSize?: number;
  theme?: ThemeMode;
  showHanzi?: boolean;
  withSymbol?: boolean;
  state?: MimyoState;
  locale?: WordmarkLocale;
}

export function MimyoLogo({
  symbolSize = 36,
  theme = 'light',
  showHanzi = false,
  withSymbol = false,
  state = 'breathing',
  locale = 'ko',
}: MimyoLogoProps) {
  const color = ink(theme);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: symbolSize * 0.36 }}>
      {withSymbol && <MimyoSymbol size={symbolSize} theme={theme} state={state} />}
      <Wordmark
        color={color}
        fontSize={symbolSize * 1.15}
        showHanzi={showHanzi}
        state={state}
        locale={locale}
      />
    </span>
  );
}

/* ── BCP47 Locale → WordmarkLocale 매핑 helper ───────────── */

/**
 * BCP47 (`'ko' | 'zh-CN' | 'ja' | 'en'`) → WordmarkLocale (`'ko' | 'zh' | 'kr'`).
 *
 * brand book 에 ja/en 전용 wordmark variant 가 없어 ko 변형으로 fallback (design 결정).
 * brand book 에 ja/en variant 가 추가되면 WordmarkLocale 타입과 본 함수에 동시 반영.
 */
export function pickWordmarkLocale(bcp47: string | undefined | null): WordmarkLocale {
  if (bcp47 === 'zh-CN' || bcp47 === 'zh') return 'zh';
  // ja, en 및 기타 → ko fallback (의도된 디자인 결정)
  return 'ko';
}
