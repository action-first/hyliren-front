import { NextRequest, NextResponse } from 'next/server';
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

  /* ── Parse body ── */
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: '유효한 JSON 요청이 필요합니다.' },
      { status: 400 },
    );
  }

  /* ── Validate ── */
  const parsed = analysisRequestSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    log('warn', 'validation_failed', { path: firstError?.path, message: firstError?.message });
    return NextResponse.json(
      { error: firstError?.message || '입력값이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const { photos, narrative, feedbackTurns } = parsed.data;

  log('info', 'analysis_request_received', {
    photoCount: photos.length,
    narrativeLength: narrative.length,
    feedbackTurnCount: feedbackTurns.length,
  });

  /* ── Run analysis ── */
  try {
    const result = await analyzeConcernService({
      photos,
      narrative,
      feedbackTurns,
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
