import { NextRequest, NextResponse } from 'next/server';
import { analysisRequestSchema } from '@/modules/concern-analysis/schema';
import { analyzeConcernService } from '@/modules/concern-analysis/service';
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
      bodyArea: result.extractedSummary.bodyArea,
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

    // Never return empty — provide generic guidance
    return NextResponse.json({
      empathy: '고민을 나눠주셔서 감사합니다. 어떤 변화를 원하시는지 이해하고 있어요.',
      education: '한국은 다양한 미용 시술 분야에서 세계적인 수준을 갖추고 있습니다. 고객님의 상황에 맞는 방법을 여러 병원의 의견을 통해 비교해 보시는 것을 권합니다.',
      options: [{
        key: 'generic_consultation',
        name: '맞춤 상담',
        description: '고객님의 상황에 맞는 최적의 방법을 병원과 함께 찾아보세요.',
      }],
      extractedTags: { symptoms: [], preferences: [], budget: [], timing: [] },
      extractedSummary: {},
      disclaimer: '정확한 적용 여부는 실제 병원의 상담과 진단을 통해 결정됩니다.',
      ruleVersion: 'fallback',
    });
  }
}
