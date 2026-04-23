'use client';

import { useState } from 'react';
import { Button, BottomSheet } from '@hyliren/ui';
import { Mail, CheckCircle, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useLocaleStore } from '@/store/locale';
import { ApiError } from '@/lib/api';

interface Props {
  open: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

type Step = 'methods' | 'email' | 'password' | 'register' | 'welcome';

// API RegisterDto와 동일한 규칙 — 영문+숫자 포함 8자 이상, 72자 이하.
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

export function AuthModal({ open, onSuccess, onClose }: Props) {
  const t = useLocaleStore(s => s.t);
  const locale = useLocaleStore(s => s.locale);
  const { loginWithPassword, registerWithPassword } = useAuthStore();

  const [step, setStep] = useState<Step>('methods');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!open) { return null; }

  const emailValid = /.+@.+\..+/.test(email);
  const passwordValid = PASSWORD_RULE.test(password);
  const passwordMatch = password === passwordConfirm;

  function resetState() {
    setStep('methods');
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setName('');
    setSubmitting(false);
    setErrorMessage(null);
  }

  function mapError(err: unknown): string {
    if (err instanceof ApiError) {
      if (err.status === 0) { return t('auth.error.network'); }
      if (err.status === 401) { return t('auth.error.invalidCredentials'); }
      if (err.status === 409) { return t('auth.error.emailTaken'); }
      if (err.status === 400) { return t('auth.error.passwordRule'); }
      if (err.status >= 500) { return t('auth.error.server'); }
    }
    return t('auth.error.server');
  }

  async function handleLoginSubmit() {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await loginWithPassword({ email, password });
      setStep('welcome');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setStep('register');
        setErrorMessage(null);
      } else {
        setErrorMessage(mapError(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegisterSubmit() {
    if (!passwordValid || !passwordMatch || !name.trim()) { return; }
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
    methods: null,
    email: 'methods',
    password: 'email',
    register: 'password',
    welcome: null,
  };

  const canDismissBackdrop = step !== 'welcome' && step !== 'password';
  const showCloseBtn = !!onClose && step !== 'password' && step !== 'welcome';

  return (
    <BottomSheet
      open={open}
      onClose={canDismissBackdrop ? handleSkip : () => {}}
      showHandle={step !== 'welcome'}
      showClose={showCloseBtn}
      scrollable
      backdropOpacity="40"
    >
      {/* ═══ STEP: Methods ═══ */}
      {step === 'methods' && (
        <>
          <h2 className="text-[1.25rem] font-bold text-[var(--color-text)] leading-tight mb-1.5">
            {t('auth.modalTitle')}
          </h2>
          <p className="text-[13px] text-[var(--color-text-dim)] mb-5">
            {t('auth.modalDesc')}
          </p>

          <div className="flex flex-col gap-2 mb-5">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[var(--color-bg-secondary)]">
              <Shield size={14} className="text-emerald-500 shrink-0" />
              <span className="text-[12px] text-[var(--color-text-secondary)]">{t('auth.saveConcern')}</span>
            </div>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[var(--color-bg-secondary)]">
              <CheckCircle size={14} className="text-emerald-500 shrink-0" />
              <span className="text-[12px] text-[var(--color-text-secondary)]">{t('auth.receiveProposal')}</span>
            </div>
          </div>

          {/* WeChat — 준비 중(외부 의존) */}
          <button type="button" disabled
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text-dim)] text-[14px] font-medium border-0 mb-3 relative cursor-not-allowed">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="opacity-40">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.986a.96.96 0 0 1 0 1.92.96.96 0 0 1 0-1.92zm5.812 0a.96.96 0 0 1 0 1.92.96.96 0 0 1 0-1.92zm3.2 4.394c-3.627 0-6.593 2.427-6.593 5.45 0 3.022 2.966 5.45 6.593 5.45a8.08 8.08 0 0 0 2.258-.32.672.672 0 0 1 .56.078l1.493.872a.268.268 0 0 0 .13.044c.122 0 .228-.104.228-.232 0-.056-.024-.11-.038-.166l-.305-1.161a.46.46 0 0 1 .166-.52C20.87 18.858 21.8 17.17 21.8 15.29v-.54c-.27-2.723-3.1-4.91-6.503-4.91h-.5zm-1.612 2.754a.768.768 0 1 1 0 1.536.768.768 0 0 1 0-1.536zm4.023 0a.768.768 0 1 1 0 1.536.768.768 0 0 1 0-1.536z"/>
            </svg>
            {t('auth.wechatLogin')}
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[9px] font-bold text-[var(--color-text-dim)]">
              {t('auth.comingSoon')}
            </span>
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[var(--color-border-light)]" />
            <span className="text-[11px] text-[var(--color-text-dim)]">{t('common.or')}</span>
            <div className="flex-1 h-px bg-[var(--color-border-light)]" />
          </div>

          <button type="button" onClick={() => { setErrorMessage(null); setStep('email'); }}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text)] text-[14px] font-medium border-0 cursor-pointer">
            <Mail size={16} />
            {t('auth.emailLogin')}
          </button>

          {onClose && (
            <button type="button" onClick={handleSkip}
              className="w-full mt-3 py-2 text-[12px] text-[var(--color-text-dim)] bg-transparent border-0 cursor-pointer">
              {t('auth.skip')}
            </button>
          )}
        </>
      )}

      {/* ═══ STEP: Email ═══ */}
      {step === 'email' && (
        <>
          <h2 className="text-[1.125rem] font-bold text-[var(--color-text)] mb-4">
            {t('auth.emailLogin')}
          </h2>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value.trim())}
            onKeyDown={e => {
              if (e.key === 'Enter' && emailValid) {
                e.preventDefault();
                setErrorMessage(null);
                setStep('password');
              }
            }}
            autoFocus
            placeholder={t('auth.emailPlaceholder')}
            className="fo-input mb-3"
          />
          <Button variant="accent" size="xl" fullWidth
            onClick={() => { setErrorMessage(null); setStep('password'); }}
            disabled={!emailValid}>
            {t('common.next')}
          </Button>
          <BackButton onClick={() => setStep(backMap[step] ?? 'methods')} />
        </>
      )}

      {/* ═══ STEP: Password (로그인) ═══ */}
      {step === 'password' && (
        <>
          <h2 className="text-[1.125rem] font-bold text-[var(--color-text)] mb-1.5">
            {t('auth.passwordTitle')}
          </h2>
          <p className="text-[12px] text-[var(--color-text-dim)] mb-2">{email}</p>
          <p className="text-[11px] text-[var(--color-text-dim)] mb-4">
            {t('auth.passwordHint')}
          </p>

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
            <p className="text-[11px] text-red-400 mb-3 px-1">{errorMessage}</p>
          )}

          <Button variant="accent" size="xl" fullWidth
            onClick={handleLoginSubmit}
            disabled={password.length === 0 || submitting}>
            {submitting ? t('common.loading') : t('auth.continue')}
          </Button>

          <button type="button"
            onClick={() => { setErrorMessage(null); setStep('register'); }}
            className="w-full mt-3 py-2 text-[12px] text-[var(--color-text-dim)] bg-transparent border-0 cursor-pointer underline">
            {t('auth.registerInstead')}
          </button>
          <BackButton onClick={() => setStep(backMap[step] ?? 'email')} />
        </>
      )}

      {/* ═══ STEP: Register (신규 가입) ═══ */}
      {step === 'register' && (
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
              if (e.key === 'Enter' && name.trim() && passwordValid && passwordMatch && !submitting) {
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
                if (e.key === 'Enter' && name.trim() && passwordValid && passwordMatch && !submitting) {
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
            <p className="text-[11px] text-red-400 mb-2 px-1">{t('auth.error.passwordRule')}</p>
          )}

          <input
            type={showPassword ? 'text' : 'password'}
            value={passwordConfirm}
            onChange={e => setPasswordConfirm(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && name.trim() && passwordValid && passwordMatch && !submitting) {
                e.preventDefault();
                void handleRegisterSubmit();
              }
            }}
            placeholder={t('auth.passwordConfirmPlaceholder')}
            className="fo-input mb-2"
          />
          {passwordConfirm.length > 0 && !passwordMatch && (
            <p className="text-[11px] text-red-400 mb-2 px-1">{t('auth.passwordMismatch')}</p>
          )}

          {errorMessage && (
            <p className="text-[11px] text-red-400 mb-3 px-1">{errorMessage}</p>
          )}

          <Button variant="accent" size="xl" fullWidth
            onClick={handleRegisterSubmit}
            disabled={!name.trim() || !passwordValid || !passwordMatch || submitting}>
            {submitting ? t('common.loading') : t('auth.createAccount')}
          </Button>
          <BackButton onClick={() => setStep(backMap[step] ?? 'password')} />
        </>
      )}

      {/* ═══ STEP: Welcome ═══ */}
      {step === 'welcome' && (
        <div className="flex flex-col items-center pt-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-[1.25rem] font-bold text-[var(--color-text)] mb-1.5">
            {t('auth.welcomeTitle')}
          </h2>
          <p className="text-[13px] text-[var(--color-text-dim)] mb-6">
            {t('auth.welcomeDesc')}
          </p>
          <Button variant="accent" size="xl" fullWidth onClick={handleContinue}>
            {t('auth.continueConsult')}
          </Button>
        </div>
      )}
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
