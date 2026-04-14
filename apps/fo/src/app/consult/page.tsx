'use client';

import { useRouter } from 'next/navigation';
import { useConsultStore } from '@/store/consult';
import { analyzeConcern } from '@/lib/mock-llm';
import { PhotoUploader } from '@/components/PhotoUploader';
import { ChatInput, MessageBubble } from '@/components/ChatInput';
import { AISummaryCard } from '@/components/AISummaryCard';
import { Button } from '@hyliren/ui';
import { ArrowRight, Camera, Loader2, MessageCircle, Sparkles, Clock } from 'lucide-react';

export default function ConsultPage() {
  const router = useRouter();
  const {
    step, photos, message, aiSummary, isAnalyzing, isSubmitting,
    setStep, addPhoto, removePhoto, setMessage, setSummary,
    setAnalyzing, setSubmitting, reset,
  } = useConsultStore();

  /* ── Step 0 → 1: photos done ── */
  function handlePhotosNext() {
    setStep(1);
  }

  /* ── Step 1 → 2: analyze message ── */
  async function handleAnalyze() {
    if (!message.trim()) return;
    setAnalyzing(true);
    setStep(2);
    const summary = await analyzeConcern(message, photos.length);
    setSummary(summary);
    setAnalyzing(false);
  }

  /* ── Step 2 → back to 1: edit ── */
  function handleEdit() {
    setStep(1);
  }

  /* ── Step 2 → 3: submit ── */
  async function handleSubmit() {
    setSubmitting(true);
    setStep(3);
    // Mock submission delay
    await new Promise(r => setTimeout(r, 2000));
    setSubmitting(false);
    // Navigate to proposals/waiting
    router.push('/proposals');
    // Reset after navigation
    setTimeout(() => reset(), 500);
  }

  /* ── Progress indicator ── */
  const steps = ['사진', '고민', '확인', '완료'];
  const progressWidth = `${((step + 1) / 4) * 100}%`;

  return (
    <div className="flex flex-col min-h-[calc(100dvh-2.75rem-var(--fo-bottom-bar-height)-var(--fo-safe-area-bottom)-8px)]">

      {/* ── Progress Bar ── */}
      <div className="px-5 pt-3 pb-1">
        <div className="h-1 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
            style={{ width: progressWidth }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          {steps.map((s, i) => (
            <span key={s} className={`text-[10px] font-medium ${
              i <= step ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-dim)]'
            }`}>{s}</span>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-5 pt-4 pb-4 flex flex-col">

        {/* ════ STEP 0: Photo Upload ════ */}
        {step === 0 && (
          <div className="flex-1 flex flex-col">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Camera size={18} className="text-[var(--color-primary)]" />
                <h1 className="text-[1.375rem] font-bold text-[var(--color-text)]">사진을 올려주세요</h1>
              </div>
              <p className="text-[13px] text-[var(--color-text-dim)] leading-relaxed">
                고민 부위를 3장의 사진으로 보여주세요.<br />
                더 정확한 제안을 받을 수 있어요.
              </p>
            </div>

            <PhotoUploader
              photos={photos}
              onAdd={addPhoto}
              onRemove={removePhoto}
            />

            {/* Spacer */}
            <div className="flex-1 min-h-6" />

            {/* CTA */}
            <div className="pb-2">
              <Button
                variant="accent"
                size="lg"
                fullWidth
                onClick={handlePhotosNext}
                disabled={photos.length === 0}
              >
                {photos.length === 0 ? '사진을 1장 이상 올려주세요' : '다음'}
                {photos.length > 0 && <ArrowRight size={18} />}
              </Button>
              {photos.length === 0 && (
                <button
                  onClick={handlePhotosNext}
                  className="w-full mt-2 py-2 text-[13px] text-[var(--color-text-dim)] bg-transparent border-0 cursor-pointer">
                  사진 없이 진행하기
                </button>
              )}
            </div>
          </div>
        )}

        {/* ════ STEP 1: Chat Input ════ */}
        {step === 1 && (
          <div className="flex-1 flex flex-col">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <MessageCircle size={18} className="text-[var(--color-primary)]" />
                <h1 className="text-[1.375rem] font-bold text-[var(--color-text)]">고민을 알려주세요</h1>
              </div>
              <p className="text-[13px] text-[var(--color-text-dim)] leading-relaxed">
                편하게 말씀해주세요. AI가 분석해서 정리해드릴게요.
              </p>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col gap-3 mb-4">
              {/* System greeting */}
              <MessageBubble variant="system">
                어떤 점이 고민이신가요? 원하는 스타일이나 걱정되는 부분을 자유롭게 적어주세요.
              </MessageBubble>

              {/* User message preview */}
              {message.trim() && (
                <MessageBubble variant="user">
                  {message}
                </MessageBubble>
              )}

              {/* Photo thumbnails (if any) */}
              {photos.length > 0 && (
                <div className="flex gap-2 justify-end">
                  {photos.map((p, i) => (
                    <div key={i} className="w-12 h-12 rounded-lg overflow-hidden">
                      <img src={p} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input + CTA */}
            <div className="flex flex-col gap-2 pb-2">
              <ChatInput
                value={message}
                onChange={setMessage}
                onSubmit={handleAnalyze}
                placeholder="코끝이 둥글어서 자연스럽게 높이고 싶어요..."
              />
              <Button
                variant="accent"
                size="lg"
                fullWidth
                onClick={handleAnalyze}
                disabled={!message.trim()}
              >
                분석하기
                <Sparkles size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* ════ STEP 2: AI Summary ════ */}
        {step === 2 && (
          <div className="flex-1 flex flex-col">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles size={18} className="text-[var(--color-primary)]" />
                <h1 className="text-[1.375rem] font-bold text-[var(--color-text)]">
                  {isAnalyzing ? '분석 중...' : '분석이 완료되었어요'}
                </h1>
              </div>
              <p className="text-[13px] text-[var(--color-text-dim)] leading-relaxed">
                {isAnalyzing
                  ? 'AI가 고민을 분석하고 있어요'
                  : '아래 내용으로 병원에 전달할게요'}
              </p>
            </div>

            {isAnalyzing ? (
              /* Loading state */
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[var(--color-primary-soft)] flex items-center justify-center">
                  <Loader2 size={28} className="text-[var(--color-primary)] animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-medium text-[var(--color-text)]">고민을 분석하고 있어요</p>
                  <p className="text-[12px] text-[var(--color-text-dim)] mt-1">잠시만 기다려주세요...</p>
                </div>
              </div>
            ) : aiSummary ? (
              /* Summary result */
              <div className="flex flex-col gap-4">
                {/* User's original message */}
                <MessageBubble variant="user">{message}</MessageBubble>

                {/* AI Summary Card */}
                <AISummaryCard summary={aiSummary} onEdit={handleEdit} />
              </div>
            ) : null}

            {/* Spacer */}
            <div className="flex-1 min-h-6" />

            {/* CTA */}
            {!isAnalyzing && aiSummary && (
              <div className="pb-2">
                <Button variant="accent" size="lg" fullWidth onClick={handleSubmit}>
                  맞춤 제안 받기
                  <ArrowRight size={18} />
                </Button>
                <p className="text-center text-[11px] text-[var(--color-text-dim)] mt-2">
                  평균 48시간 내 제안이 도착합니다
                </p>
              </div>
            )}
          </div>
        )}

        {/* ════ STEP 3: Submitting ════ */}
        {step === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            {isSubmitting ? (
              <>
                <div className="w-16 h-16 rounded-full bg-[var(--color-primary-soft)] flex items-center justify-center">
                  <Loader2 size={32} className="text-[var(--color-primary)] animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-[1.125rem] font-bold text-[var(--color-text)]">제출 중입니다...</p>
                  <p className="text-[13px] text-[var(--color-text-dim)] mt-1.5">검증된 병원에 전달하고 있어요</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Sparkles size={28} className="text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="text-[1.125rem] font-bold text-[var(--color-text)]">상담이 등록되었어요!</p>
                  <p className="text-[13px] text-[var(--color-text-dim)] mt-1.5 leading-relaxed">
                    보통 3개 병원이 맞춤 제안서를 보내드립니다<br />
                    제안서 탭에서 확인하세요
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--color-bg-secondary)]">
                  <Clock size={14} className="text-[var(--color-text-dim)]" />
                  <span className="text-[12px] text-[var(--color-text-secondary)]">평균 48시간 내 도착</span>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
