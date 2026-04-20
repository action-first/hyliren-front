'use client';

import { useState } from 'react';
import { Button } from '@hyliren/ui';
import { X, Mail, CheckCircle, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useLocaleStore } from '@/store/locale';
import { MOCK_USERS } from '@hyliren/shared';

interface Props {
  open: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

type Step = 'methods' | 'email' | 'code' | 'password' | 'profile' | 'welcome';

export function AuthModal({ open, onSuccess, onClose }: Props) {
  const t = useLocaleStore(s => s.t);
  const { login } = useAuthStore();

  const [step, setStep] = useState<Step>('methods');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'other' | null>(null);
  const [country, setCountry] = useState('');
  const [sending, setSending] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  if (!open) return null;

  const passwordError = password.length > 0 && password.length < 8 ? t('auth.passwordTooShort') : '';
  const passwordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm ? t('auth.passwordMismatch') : '';
  const passwordValid = password.length >= 8 && password === passwordConfirm;

  async function handleSendCode() {
    setSending(true);
    await new Promise(r => setTimeout(r, 1000));
    setSending(false);
    setStep('code');
  }

  async function handleVerifyCode() {
    setSending(true);
    await new Promise(r => setTimeout(r, 800));
    setSending(false);

    // Mock: 기존 회원이면 바로 로그인, 신규면 PW 설정으로
    const existingUser = MOCK_USERS.find(u => u.email === email);
    if (existingUser) {
      login(existingUser);
      setIsNewUser(false);
      setStep('welcome');
    } else {
      setIsNewUser(true);
      setStep('password');
    }
  }

  function handleSetPassword() {
    if (!passwordValid) return;
    setStep('profile');
  }

  function handleSaveProfile() {
    // Mock: 신규 유저 생성
    const mockUser = MOCK_USERS.find(u => u.role === 'buyer') || MOCK_USERS[0];
    login({
      ...mockUser,
      id: mockUser.id, // 시연용: mock user id 유지 (u-001)
      email,
      name: name || email.split('@')[0],
    });
    setStep('welcome');
  }

  function handleWechatLogin() {
    const mockUser = MOCK_USERS.find(u => u.role === 'buyer') || MOCK_USERS[0];
    login(mockUser);
    setStep('welcome');
  }

  function handleContinue() {
    resetState();
    onSuccess();
  }

  function handleSkip() {
    resetState();
    onClose?.();
  }

  function resetState() {
    setStep('methods');
    setEmail('');
    setCode('');
    setPassword('');
    setPasswordConfirm('');
    setName('');
    setBirthYear('');
    setGender(null);
    setCountry('');
    setIsNewUser(false);
  }

  const canGoBack = step !== 'methods' && step !== 'welcome';
  const backMap: Record<string, Step> = {
    email: 'methods',
    code: 'email',
    password: 'code',
    profile: 'password',
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50"
        onClick={step !== 'welcome' && step !== 'password' && step !== 'profile' ? handleSkip : undefined} />
      <div className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-[var(--fo-frame-max-width)] z-50 rounded-t-3xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
        <div className="bg-white px-6 pt-5 pb-8 max-h-[85vh] overflow-y-auto hide-scrollbar"
          style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>

          {/* Handle + close */}
          {step !== 'welcome' && (
            <div className="relative mb-5">
              <div className="w-10 h-1 rounded-full bg-[var(--color-border-light)] mx-auto" />
              {onClose && step !== 'password' && step !== 'profile' && (
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

              {/* WeChat */}
              <button type="button" onClick={handleWechatLogin}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#07C160] text-white text-[14px] font-medium border-0 cursor-pointer mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.986a.96.96 0 0 1 0 1.92.96.96 0 0 1 0-1.92zm5.812 0a.96.96 0 0 1 0 1.92.96.96 0 0 1 0-1.92zm3.2 4.394c-3.627 0-6.593 2.427-6.593 5.45 0 3.022 2.966 5.45 6.593 5.45a8.08 8.08 0 0 0 2.258-.32.672.672 0 0 1 .56.078l1.493.872a.268.268 0 0 0 .13.044c.122 0 .228-.104.228-.232 0-.056-.024-.11-.038-.166l-.305-1.161a.46.46 0 0 1 .166-.52C20.87 18.858 21.8 17.17 21.8 15.29v-.54c-.27-2.723-3.1-4.91-6.503-4.91h-.5zm-1.612 2.754a.768.768 0 1 1 0 1.536.768.768 0 0 1 0-1.536zm4.023 0a.768.768 0 1 1 0 1.536.768.768 0 0 1 0-1.536z"/>
                </svg>
                {t('auth.wechatLogin')}
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[var(--color-border-light)]" />
                <span className="text-[11px] text-[var(--color-text-dim)]">{t('common.or')}</span>
                <div className="flex-1 h-px bg-[var(--color-border-light)]" />
              </div>

              <button type="button" onClick={() => setStep('email')}
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
              <BackButton onClick={() => setStep(backMap[step])} />
            </>
          )}

          {/* ═══ STEP: Code ═══ */}
          {step === 'code' && (
            <>
              <h2 className="text-[1.125rem] font-bold text-[var(--color-text)] mb-1.5">
                {t('auth.verifyCode')}
              </h2>
              <p className="text-[12px] text-[var(--color-text-dim)] mb-4">{email}</p>
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
              <BackButton onClick={() => setStep(backMap[step])} />
            </>
          )}

          {/* ═══ STEP: Password (신규 가입 시만) ═══ */}
          {step === 'password' && (
            <>
              <h2 className="text-[1.125rem] font-bold text-[var(--color-text)] mb-1.5">
                {t('auth.passwordTitle')}
              </h2>
              <p className="text-[12px] text-[var(--color-text-dim)] mb-5">
                {t('auth.passwordDesc')}
              </p>

              {/* Password input */}
              <div className="relative mb-3">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full px-4 py-3.5 pr-12 rounded-xl bg-[var(--color-bg-secondary)] border-0 text-[14px] text-[var(--color-text)] outline-none"
                  style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06) inset' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer p-1">
                  {showPassword ? <EyeOff size={16} className="text-[var(--color-text-dim)]" /> : <Eye size={16} className="text-[var(--color-text-dim)]" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[11px] text-red-400 mb-2 px-1">{passwordError}</p>
              )}

              {/* Confirm */}
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                placeholder={t('auth.passwordConfirmPlaceholder')}
                className="w-full px-4 py-3.5 rounded-xl bg-[var(--color-bg-secondary)] border-0 text-[14px] text-[var(--color-text)] outline-none mb-2"
                style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06) inset' }}
              />
              {passwordMismatch && (
                <p className="text-[11px] text-red-400 mb-2 px-1">{passwordMismatch}</p>
              )}

              {/* Strength indicator */}
              <div className="flex gap-1.5 mb-5">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`flex-1 h-1 rounded-full ${
                    password.length >= i * 4 ? (password.length >= 12 ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-[var(--color-border-light)]'
                  }`} />
                ))}
              </div>

              <Button variant="accent" size="lg" fullWidth
                onClick={handleSetPassword}
                disabled={!passwordValid}>
                {t('auth.setPassword')}
              </Button>
            </>
          )}

          {/* ═══ STEP: Profile (신규 가입 시만) ═══ */}
          {step === 'profile' && (
            <>
              <h2 className="text-[1.125rem] font-bold text-[var(--color-text)] mb-1.5">
                {t('auth.profileTitle')}
              </h2>
              <p className="text-[12px] text-[var(--color-text-dim)] mb-5">
                {t('auth.profileDesc')}
              </p>

              {/* Name */}
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('auth.namePlaceholder')}
                className="w-full px-4 py-3.5 rounded-xl bg-[var(--color-bg-secondary)] border-0 text-[14px] text-[var(--color-text)] outline-none mb-3"
                style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06) inset' }}
              />

              {/* Birth year */}
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={birthYear}
                onChange={e => setBirthYear(e.target.value.replace(/\D/g, ''))}
                placeholder={t('auth.birthYearPlaceholder')}
                className="w-full px-4 py-3.5 rounded-xl bg-[var(--color-bg-secondary)] border-0 text-[14px] text-[var(--color-text)] outline-none mb-3"
                style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06) inset' }}
              />

              {/* Gender */}
              <div className="mb-3">
                <span className="text-[12px] text-[var(--color-text-dim)] block mb-2">{t('auth.genderLabel')}</span>
                <div className="flex gap-2">
                  {(['female', 'male', 'other'] as const).map(g => (
                    <button key={g} type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium border-0 cursor-pointer transition-colors ${
                        gender === g
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                      }`}>
                      {t(`auth.gender${g.charAt(0).toUpperCase() + g.slice(1)}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Country */}
              <input
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder={t('auth.countryPlaceholder')}
                className="w-full px-4 py-3.5 rounded-xl bg-[var(--color-bg-secondary)] border-0 text-[14px] text-[var(--color-text)] outline-none mb-5"
                style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06) inset' }}
              />

              <Button variant="accent" size="lg" fullWidth
                onClick={handleSaveProfile}
                disabled={!name.trim()}>
                {t('auth.saveProfile')}
              </Button>

              {/* Skip profile (최소 정보만) */}
              <button type="button" onClick={handleSaveProfile}
                className="w-full mt-2 py-2 text-[12px] text-[var(--color-text-dim)] bg-transparent border-0 cursor-pointer">
                {t('auth.skip')}
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

function BackButton({ onClick }: { onClick: () => void }) {
  const t = useLocaleStore(s => s.t);
  return (
    <button type="button" onClick={onClick}
      className="w-full mt-3 py-2 text-[12px] text-[var(--color-text-dim)] bg-transparent border-0 cursor-pointer">
      {t('common.back')}
    </button>
  );
}
