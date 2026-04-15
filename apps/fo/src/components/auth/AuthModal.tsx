'use client';

import { useState } from 'react';
import { Button } from '@hyliren/ui';
import { X, Mail, CheckCircle, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useLocaleStore } from '@/store/locale';
import { MOCK_USERS } from '@hyliren/shared';

interface Props {
  open: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

type Step = 'methods' | 'email' | 'code' | 'welcome';

export function AuthModal({ open, onSuccess, onClose }: Props) {
  const t = useLocaleStore(s => s.t);
  const { login } = useAuthStore();
  const [step, setStep] = useState<Step>('methods');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);

  if (!open) return null;

  async function handleSendCode() {
    setSending(true);
    // Mock: 1초 딜레이
    await new Promise(r => setTimeout(r, 1000));
    setSending(false);
    setStep('code');
  }

  async function handleVerifyCode() {
    setSending(true);
    await new Promise(r => setTimeout(r, 800));
    // Mock: 성공 처리
    const mockUser = MOCK_USERS.find(u => u.role === 'buyer') || MOCK_USERS[0];
    login({ ...mockUser, email });
    setSending(false);
    setStep('welcome');
  }

  function handleAppleLogin() {
    // Mock: Apple 로그인 성공
    const mockUser = MOCK_USERS.find(u => u.role === 'buyer') || MOCK_USERS[0];
    login(mockUser);
    setStep('welcome');
  }

  function handleContinue() {
    setStep('methods');
    setEmail('');
    setCode('');
    onSuccess();
  }

  function handleSkip() {
    setStep('methods');
    setEmail('');
    setCode('');
    onClose?.();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={step !== 'welcome' ? handleSkip : undefined} />
      <div className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-[var(--fo-frame-max-width)] z-50 rounded-t-3xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
        <div className="bg-white px-6 pt-5 pb-8"
          style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>

          {/* Handle + close */}
          {step !== 'welcome' && (
            <div className="relative mb-5">
              <div className="w-10 h-1 rounded-full bg-[var(--color-border-light)] mx-auto" />
              {onClose && (
                <button onClick={handleSkip} type="button"
                  className="absolute right-0 top-0 w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center border-0 cursor-pointer">
                  <X size={16} className="text-[var(--color-text-dim)]" />
                </button>
              )}
            </div>
          )}

          {/* ═══ STEP: Methods ═══ */}
          {step === 'methods' && (
            <>
              <h2 className="text-[1.25rem] font-bold text-[var(--color-text)] leading-tight mb-1.5">
                {t('auth.modalTitle')}
              </h2>
              <p className="text-[13px] text-[var(--color-text-dim)] mb-5">
                {t('auth.modalDesc')}
              </p>

              {/* Benefits */}
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

              {/* WeChat Login */}
              <button type="button" onClick={handleAppleLogin}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#07C160] text-white text-[14px] font-medium border-0 cursor-pointer mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.986a.96.96 0 0 1 0 1.92.96.96 0 0 1 0-1.92zm5.812 0a.96.96 0 0 1 0 1.92.96.96 0 0 1 0-1.92zm3.2 4.394c-3.627 0-6.593 2.427-6.593 5.45 0 3.022 2.966 5.45 6.593 5.45a8.08 8.08 0 0 0 2.258-.32.672.672 0 0 1 .56.078l1.493.872a.268.268 0 0 0 .13.044c.122 0 .228-.104.228-.232 0-.056-.024-.11-.038-.166l-.305-1.161a.46.46 0 0 1 .166-.52C20.87 18.858 21.8 17.17 21.8 15.29v-.54c-.27-2.723-3.1-4.91-6.503-4.91h-.5zm-1.612 2.754a.768.768 0 1 1 0 1.536.768.768 0 0 1 0-1.536zm4.023 0a.768.768 0 1 1 0 1.536.768.768 0 0 1 0-1.536z"/>
                </svg>
                {t('auth.wechatLogin')}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[var(--color-border-light)]" />
                <span className="text-[11px] text-[var(--color-text-dim)]">{t('common.or')}</span>
                <div className="flex-1 h-px bg-[var(--color-border-light)]" />
              </div>

              {/* Email */}
              <button type="button" onClick={() => setStep('email')}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text)] text-[14px] font-medium border-0 cursor-pointer">
                <Mail size={16} />
                {t('auth.emailLogin')}
              </button>

              {/* Skip */}
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
                onChange={e => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full px-4 py-3.5 rounded-xl bg-[var(--color-bg-secondary)] border-0 text-[14px] text-[var(--color-text)] outline-none mb-3"
                style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06) inset' }}
              />

              <Button variant="accent" size="lg" fullWidth
                onClick={handleSendCode}
                disabled={!email.includes('@') || sending}>
                {sending ? t('common.loading') : t('auth.sendCode')}
              </Button>

              <button type="button" onClick={() => setStep('methods')}
                className="w-full mt-3 py-2 text-[12px] text-[var(--color-text-dim)] bg-transparent border-0 cursor-pointer">
                {t('common.back')}
              </button>
            </>
          )}

          {/* ═══ STEP: Code ═══ */}
          {step === 'code' && (
            <>
              <h2 className="text-[1.125rem] font-bold text-[var(--color-text)] mb-1.5">
                {t('auth.verifyCode')}
              </h2>
              <p className="text-[12px] text-[var(--color-text-dim)] mb-4">
                {email}
              </p>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder={t('auth.codePlaceholder')}
                className="w-full px-4 py-3.5 rounded-xl bg-[var(--color-bg-secondary)] border-0 text-[14px] text-[var(--color-text)] outline-none text-center tracking-[0.5em] font-mono mb-3"
                style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06) inset' }}
              />

              <Button variant="accent" size="lg" fullWidth
                onClick={handleVerifyCode}
                disabled={code.length < 6 || sending}>
                {sending ? t('common.loading') : t('auth.verifyCode')}
              </Button>

              <button type="button" onClick={() => setStep('email')}
                className="w-full mt-3 py-2 text-[12px] text-[var(--color-text-dim)] bg-transparent border-0 cursor-pointer">
                {t('common.back')}
              </button>
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
              <Button variant="accent" size="lg" fullWidth onClick={handleContinue}>
                {t('auth.continueConsult')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
