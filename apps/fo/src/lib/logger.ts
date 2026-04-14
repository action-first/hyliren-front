/**
 * Structured logger — 개인식별 원문 로깅 금지
 * 요약/길이/태그 정도만 로깅
 */
export function log(level: 'info' | 'warn' | 'error', event: string, data?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...data,
  };
  if (level === 'error') console.error('[HYLIREN]', JSON.stringify(entry));
  else if (level === 'warn') console.warn('[HYLIREN]', JSON.stringify(entry));
  else console.log('[HYLIREN]', JSON.stringify(entry));
}
