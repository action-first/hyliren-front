'use client';

import { useState } from 'react';
import { Button, BottomSheet } from '@hyliren/ui';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useLocaleStore } from '@/store/locale';
import { ApiError } from '@/lib/api';
import { checkEmailExists } from '@/lib/api/auth';
import { PrivacyContent } from '@/components/legal/PrivacyContent';
import { TermsContent } from '@/components/legal/TermsContent';

interface Props {
  open: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

/**
 * AuthModal — 단일 이메일 입력 → 회원 존재 여부 분기 → 로그인 / 가입 통합 흐름.
 *
 * 흐름:
 *   1) email      — 이메일 입력 + "다음"
 *      → BE `auth/check-email` 호출 → exists ? 'login-password' : 'signup-info'
 *   2) login-password — 비밀번호 + 로그인 (회원 케이스)
 *      signup-info  — 비밀번호 + 비밀번호확인 + 이름 + 동의 체크박스 + 가입 (비회원 케이스)
 *   3) view-terms / view-privacy — 같은 sheet 안 본문 (signup-info → register 복귀)
 *   4) welcome — 성공 후 onSuccess 콜백
 *
 * 디자인 결정:
 *   - 기존 'methods' (wechat 등 외부 인증 선택) step 제거 — 사용자 명시:
 *     "최초 진입 시 회원가입도 없고 이메일 입력하게끔" 흐름 단순화.
 *   - step 전환 시 `key={step}` + .sheet-step-in CSS animation 으로 slide-up + fade-in
 *     일관 모션 (외부 deps 없이 CSS only).
 */

type Step = 'email' | 'login-password' | 'signup-confirm' | 'signup-info' | 'view-terms' | 'view-privacy' | 'welcome';

// API RegisterDto와 동일한 규칙 — 영문+숫자 포함 8자 이상, 72자 이하.
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

export function AuthModal({ open, onSuccess, onClose }: Props) {
  const t = useLocaleStore(s => s.t);
  const locale = useLocaleStore(s => s.locale);
  const { loginWithPassword, registerWithPassword } = useAuthStore();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // 한국 개인정보보호법 제22조 — 약관·개인정보처리방침 개별 동의 필수.
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  if (!open) { return null; }

  const emailValid = /.+@.+\..+/.test(email);
  const passwordValid = PASSWORD_RULE.test(password);
  const passwordMatch = password === passwordConfirm;
  const consentsValid = agreeTerms && agreePrivacy;

  function resetState() {
    setStep('email');
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setName('');
    setSubmitting(false);
    setErrorMessage(null);
    setAgreeTerms(false);
    setAgreePrivacy(false);
  }

  function mapError(err: unknown): string {
    if (err instanceof ApiError) {
      if (err.code?.startsWith('ERR_')) {
        const i18nKey = `error.${err.code}`;
        const translated = t(i18nKey);
        if (translated !== i18nKey) { return translated; }
      }
      if (err.message?.startsWith('ERR_')) {
        const i18nKey = `error.${err.message}`;
        const translated = t(i18nKey);
        if (translated !== i18nKey) { return translated; }
      }
      if (err.status === 0) { return t('auth.error.network'); }
      if (err.status === 401) { return t('auth.error.invalidCredentials'); }
      if (err.status === 409) { return t('auth.error.emailTaken'); }
      if (err.status === 400) { return t('auth.error.passwordRule'); }
      if (err.status >= 500) { return t('auth.error.server'); }
    }
    return t('auth.error.server');
  }

  async function handleEmailContinue() {
    if (!emailValid) { return; }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const exists = await checkEmailExists(email);
      // 회원이면 비밀번호 입력으로 직진. 비회원이면 "가입 의사 확인" 중간 step —
      // 사용자가 이메일 오타/잘못 입력한 케이스 분리.
      setStep(exists ? 'login-password' : 'signup-confirm');
    } catch (err) {
      setErrorMessage(mapError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLoginSubmit() {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await loginWithPassword({ email, password });
      setStep('welcome');
    } catch (err) {
      setErrorMessage(mapError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegisterSubmit() {
    if (!passwordValid || !passwordMatch || !name.trim() || !consentsValid) { return; }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await registerWithPassword({
        email,
        password,
        name: name.trim(),
        locale,
      });
      setStep('welcome');
    } catch (err) {
      setErrorMessage(mapError(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleContinue() {
    resetState();
    onSuccess();
  }

  function handleSkip() {
    resetState();
    onClose?.();
  }

  const backMap: Record<Step, Step | null> = {
    email: null,
    'login-password': 'email',
    'signup-confirm': 'email',
    'signup-info': 'signup-confirm',
    welcome: null,
    'view-terms': 'signup-info',
    'view-privacy': 'signup-info',
  };

  const canDismissBackdrop = step !== 'welcome' && step !== 'login-password' && step !== 'signup-info';
  const showCloseBtn = !!onClose && canDismissBackdrop;

  return (
    <BottomSheet
      open={open}
      onClose={canDismissBackdrop ? handleSkip : () => {}}
      showHandle={step !== 'welcome'}
      showClose={showCloseBtn}
      scrollable
      backdropOpacity="40"
    >
      {/* 모든 step 의 body 영역을 key={step} 으로 감싸 step 전환 시 slide-up + fade-in 일관 모션 */}
      <div key={step} className="sheet-step-in">
        {/* ═══ STEP: Email — 단일 진입 ═══ */}
        {step === 'email' && (
          <>
            <h2 className="text-[1.125rem] font-bold text-[var(--color-text)] mb-1.5">
              {t('auth.emailLogin')}
            </h2>
            <p className="text-[12px] text-[var(--color-text-dim)] mb-4">
              {t('auth.modalDesc')}
            </p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value.trim())}
              onKeyDown={e => {
                if (e.key === 'Enter' && emailValid && !submitting) {
                  e.preventDefault();
                  void handleEmailContinue();
                }
              }}
              autoFocus
              placeholder={t('auth.emailPlaceholder')}
              className="fo-input mb-3"
            />
            {errorMessage && (
              <p className="text-[11px] text-[var(--color-danger)] mb-3 px-1">{errorMessage}</p>
            )}
            <Button variant="primary" size="xl" fullWidth
              onClick={handleEmailContinue}
              disabled={!emailValid || submitting}>
              {submitting ? t('common.loading') : t('common.next')}
            </Button>
            {onClose && (
              <button type="button" onClick={handleSkip}
                className="w-full mt-3 py-2 text-[12px] text-[var(--color-text-dim)] bg-transparent border-0 cursor-pointer">
                {t('auth.skip')}
              </button>
            )}
          </>
        )}

        {/* ═══ STEP: Login Password (회원 케이스) ═══ */}
        {step === 'login-password' && (
          <>
            <h2 className="text-[1.125rem] font-bold text-[var(--color-text)] mb-1.5">
              {t('auth.passwordTitle')}
            </h2>
            <p className="text-[12px] text-[var(--color-text-dim)] mb-4">{email}</p>

            <div className="relative mb-3">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && password.length > 0 && !submitting) {
                    e.preventDefault();
                    void handleLoginSubmit();
                  }
                }}
                autoFocus
                placeholder={t('auth.passwordPlaceholder')}
                className="fo-input pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer p-1">
                {showPassword ? <EyeOff size={16} className="text-[var(--color-text-dim)]" /> : <Eye size={16} className="text-[var(--color-text-dim)]" />}
              </button>
            </div>

            {errorMessage && (
              <p className="text-[11px] text-[var(--color-danger)] mb-3 px-1">{errorMessage}</p>
            )}

            <Button variant="primary" size="xl" fullWidth
              onClick={handleLoginSubmit}
              disabled={password.length === 0 || submitting}>
              {submitting ? t('common.loading') : t('auth.continue')}
            </Button>
            <BackButton onClick={() => setStep(backMap[step] ?? 'email')} />
          </>
        )}

        {/* ═══ STEP: Signup Confirm — "계정 없음 + 가입 의사 확인" 중간 단계 ═══ */}
        {step === 'signup-confirm' && (
          <>
            <h2 className="text-[1.125rem] font-bold text-[var(--color-text)] mb-1.5">
              {t('auth.noAccountTitle')}
            </h2>
            <p className="text-[12px] text-[var(--color-text-dim)] mb-1">{email}</p>
            <p className="text-[13px] text-[var(--color-text)] leading-[1.55] mt-3 mb-5">
              {t('auth.noAccountDesc')}
            </p>
            <Button variant="primary" size="xl" fullWidth onClick={() => setStep('signup-info')}>
              {t('auth.continueToSignup')}
            </Button>
            <button type="button"
              onClick={() => { setErrorMessage(null); setStep('email'); }}
              className="w-full mt-3 py-3 text-[13px] text-[var(--color-text-dim)] bg-transparent border-0 cursor-pointer underline underline-offset-2">
              {t('auth.tryAnotherEmail')}
            </button>
          </>
        )}

        {/* ═══ STEP: Signup Info (비회원 케이스 — 가입) ═══ */}
        {step === 'signup-info' && (
          <>
            <h2 className="text-[1.125rem] font-bold text-[var(--color-text)] mb-1.5">
              {t('auth.registerTitle')}
            </h2>
            <p className="text-[12px] text-[var(--color-text-dim)] mb-4">{email}</p>

            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && name.trim() && passwordValid && passwordMatch && consentsValid && !submitting) {
                  e.preventDefault();
                  void handleRegisterSubmit();
                }
              }}
              autoFocus
              placeholder={t('auth.namePlaceholder')}
              className="fo-input mb-3"
            />

            <p className="text-[11px] text-[var(--color-text-dim)] mb-2">
              {t('auth.passwordHint')}
            </p>

            <div className="relative mb-3">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && name.trim() && passwordValid && passwordMatch && consentsValid && !submitting) {
                    e.preventDefault();
                    void handleRegisterSubmit();
                  }
                }}
                placeholder={t('auth.passwordPlaceholder')}
                className="fo-input pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer p-1">
                {showPassword ? <EyeOff size={16} className="text-[var(--color-text-dim)]" /> : <Eye size={16} className="text-[var(--color-text-dim)]" />}
              </button>
            </div>
            {password.length > 0 && !passwordValid && (
              <p className="text-[11px] text-[var(--color-danger)] mb-2 px-1">{t('auth.error.passwordRule')}</p>
            )}

            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && name.trim() && passwordValid && passwordMatch && consentsValid && !submitting) {
                  e.preventDefault();
                  void handleRegisterSubmit();
                }
              }}
              placeholder={t('auth.passwordConfirmPlaceholder')}
              className="fo-input mb-2"
            />
            {passwordConfirm.length > 0 && !passwordMatch && (
              <p className="text-[11px] text-[var(--color-danger)] mb-2 px-1">{t('auth.passwordMismatch')}</p>
            )}

            {errorMessage && (
              <p className="text-[11px] text-[var(--color-danger)] mb-3 px-1">{errorMessage}</p>
            )}

            {/* 약관 / 개인정보처리방침 — 개별 체크박스. "보기" 는 같은 sheet 안 step 전환. */}
            <div className="flex flex-col gap-2 mb-3 px-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 accent-[var(--color-primary)] cursor-pointer shrink-0"
                />
                <span className="text-[12px] text-[var(--color-text)] leading-[1.4] flex-1">
                  {t('auth.agreeTermsRequired')}
                </span>
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); setStep('view-terms'); }}
                  className="text-[12px] text-[var(--color-primary)] bg-transparent border-0 p-0 cursor-pointer shrink-0"
                >
                  {t('auth.viewTerms')}
                </button>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={e => setAgreePrivacy(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 accent-[var(--color-primary)] cursor-pointer shrink-0"
                />
                <span className="text-[12px] text-[var(--color-text)] leading-[1.4] flex-1">
                  {t('auth.agreePrivacyRequired')}
                </span>
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); setStep('view-privacy'); }}
                  className="text-[12px] text-[var(--color-primary)] bg-transparent border-0 p-0 cursor-pointer shrink-0"
                >
                  {t('auth.viewPrivacy')}
                </button>
              </label>
            </div>

            <Button variant="primary" size="xl" fullWidth
              onClick={handleRegisterSubmit}
              disabled={!name.trim() || !passwordValid || !passwordMatch || !consentsValid || submitting}>
              {submitting ? t('common.loading') : t('auth.createAccount')}
            </Button>
            <BackButton onClick={() => setStep(backMap[step] ?? 'email')} />
          </>
        )}

        {/* ═══ STEP: View Terms ═══ */}
        {step === 'view-terms' && (
          <div className="flex flex-col">
            <h2 className="text-[1.125rem] font-bold text-[var(--color-text)] mb-3">
              {t('footer.terms')}
            </h2>
            <div className="max-h-[60vh] overflow-y-auto -mx-5 px-5 pb-2 text-[13px] leading-[1.7] text-[var(--color-text)]">
              <TermsContent locale={locale} />
            </div>
            <Button variant="primary" size="xl" fullWidth onClick={() => setStep('signup-info')}>
              {t('common.back')}
            </Button>
          </div>
        )}

        {/* ═══ STEP: View Privacy ═══ */}
        {step === 'view-privacy' && (
          <div className="flex flex-col">
            <h2 className="text-[1.125rem] font-bold text-[var(--color-text)] mb-3">
              {t('footer.privacy')}
            </h2>
            <div className="max-h-[60vh] overflow-y-auto -mx-5 px-5 pb-2 text-[13px] leading-[1.7] text-[var(--color-text)]">
              <PrivacyContent locale={locale} />
            </div>
            <Button variant="primary" size="xl" fullWidth onClick={() => setStep('signup-info')}>
              {t('common.back')}
            </Button>
          </div>
        )}

        {/* ═══ STEP: Welcome ═══ */}
        {step === 'welcome' && (
          <div className="flex flex-col items-center pt-4">
            <div className="w-16 h-16 rounded-full bg-[var(--color-success-soft)] flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-[var(--color-success)]" />
            </div>
            <h2 className="text-[1.25rem] font-bold text-[var(--color-text)] mb-1.5">
              {t('auth.welcomeTitle')}
            </h2>
            <p className="text-[13px] text-[var(--color-text-dim)] mb-6">
              {t('auth.welcomeDesc')}
            </p>
            <Button variant="primary" size="xl" fullWidth onClick={handleContinue}>
              {t('auth.continueConsult')}
            </Button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  const t = useLocaleStore(s => s.t);
  return (
    <button type="button" onClick={onClick}
      className="w-full mt-3 py-2 text-[12px] text-[var(--color-text-dim)] bg-transparent border-0 cursor-pointer">
      {t('common.back')}
    </button>
  );
}
