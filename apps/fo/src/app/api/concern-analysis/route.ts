import { NextRequest, NextResponse } from 'next/server';
import { parseAcceptLanguage } from '@hyliren/shared';
import { analysisRequestSchema } from '@/server/concern-analysis/schema';
import { analyzeConcernService } from '@/server/concern-analysis/service';
import { log } from '@/lib/logger';

/**
 * POST /api/concern-analysis
 *
 * AI 고민 분석 API
 * Extract → Rule → Generation 3-layer pipeline
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  /* ── Parse body ──
   * error 응답은 stable ERR_* code 만 반환 — FE 가 t('error.<code>') 매핑.
   * (BE customer 도 동일 컨벤션, action-first/hyliren-api PR #53 참조)
   */
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'ERR_INVALID_JSON' },
      { status: 400 },
    );
  }

  /* ── Validate ── */
  const parsed = analysisRequestSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    log('warn', 'validation_failed', { path: firstError?.path, message: firstError?.message });
    // schema 의 zod message 는 이미 ERR_* code 형태. fallback 도 generic code.
    const code = firstError?.message?.startsWith('ERR_') ? firstError.message : 'ERR_VALIDATION_FAILED';
    return NextResponse.json(
      { error: code },
      { status: 400 },
    );
  }

  const { photos, narrative, feedbackTurns } = parsed.data;

  // Accept-Language 헤더 → sourceLocale 추론 (extract 키워드 사전 선택용).
  // q-value 우선순위 정렬 후 prefix 매칭 (BE 공통 resolver 와 정책 일치).
  // Customer 앱 fallback 'zh-CN' (i18n-strategy §8-1).
  const acceptLang = request.headers.get('accept-language');
  const sourceLocale: 'ko' | 'zh-CN' | 'ja' | 'en' =
    (acceptLang ? parseAcceptLanguage(acceptLang) : null) ?? 'zh-CN';

  log('info', 'analysis_request_received', {
    photoCount: photos.length,
    narrativeLength: narrative.length,
    feedbackTurnCount: feedbackTurns.length,
    sourceLocale,
  });

  /* ── Run analysis ── */
  try {
    const result = await analyzeConcernService({
      photos,
      narrative,
      feedbackTurns,
      sourceLocale,
    });

    const duration = Date.now() - startTime;

    log('info', 'analysis_response_sent', {
      duration,
      bodyArea: result.extractedSummary.primaryArea,
      optionCount: result.options.length,
      ruleVersion: result.ruleVersion,
      tagCount: result.extractedTags.symptoms.length,
    });

    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    log('error', 'analysis_failed', {
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Never return empty — i18n key 만 반환, FE 가 viewerLocale 기준 번역.
    // options 는 빈 배열 — FE 가 fallback 키 (consult.fallbackOptionGeneric*) 로 자체 표시.
    // bodyArea 는 enum key (etc), bodyAreaDetail 은 빈 문자열로 두어 FE 라벨 매핑 일관성 유지.
    return NextResponse.json({
      empathy: { key: 'concern.analysis.empathy.fallback' },
      education: { key: 'concern.analysis.education.fallback' },
      options: [],
      extractedTags: { symptoms: [], preferences: [], budget: [], timing: [] },
      extractedSummary: { bodyAreas: ['etc'], primaryArea: 'etc', bodyAreaDetail: '' },
      disclaimer: { key: 'concern.analysis.disclaimer' },
      ruleVersion: 'fallback',
    });
  }
}
