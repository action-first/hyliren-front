'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@hyliren/ui';
import { usePOAuthStore } from '@/store/po-auth';
import { useToastStore } from '@/store/toast';
import { useLocaleStore } from '@/store/locale';
import { toUserMessage } from '@/lib/api/error-messages';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function PartnerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginWithPassword = usePOAuthStore(s => s.loginWithPassword);
  const status = usePOAuthStore(s => s.status);
  const member = usePOAuthStore(s => s.member);
  const { showToast } = useToastStore();
  const t = useLocaleStore(s => s.t);

  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const next = searchParams.get('next') || '/treatments';
  const emailError = emailTouched && email && !EMAIL_PATTERN.test(email)
    ? t('poLogin.emailInvalid')
    : null;

  useEffect(() => {
    if (status === 'authenticated' && member) {
      router.replace(next);
    }
  }, [member, next, router, status]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setEmailTouched(true);
    if (!EMAIL_PATTERN.test(email)) return;

    setSubmitting(true);
    try {
      await loginWithPassword({ email, password });
      showToast(t('poLogin.loginSuccess'), 'success');
      router.replace(next);
    } catch (err) {
      const message = toUserMessage(err, t('poLogin.loginFail'), t);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--surface-bg)] flex">
      <section className="hidden lg:flex w-[42%] min-h-screen bg-[var(--surface-inverse,#111827)] text-white p-10 flex-col justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
            <Building2 size={18} />
            {t('poLogin.heroBrand')}
          </div>
          <h1 className="mt-12 text-[30px] font-bold leading-tight tracking-normal whitespace-pre-line">
            {t('poLogin.heroTitle')}
          </h1>
        </div>
        <div className="grid gap-3 text-[13px] text-white/75">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            <span>{t('poLogin.heroAccessNote')}</span>
          </div>
          <p className="max-w-[360px] leading-6">
            {t('poLogin.heroFooter')}
          </p>
        </div>
      </section>

      <section className="flex-1 min-h-screen flex items-center justify-center px-5 py-10">
        <form
          onSubmit={submit}
          className="w-full max-w-[380px] bg-[var(--surface-default)] border border-[var(--border-subdued)] rounded-[8px] p-6 shadow-sm"
        >
          <div className="mb-6">
            <p className="text-[12px] font-semibold text-[var(--text-subdued)] mb-1">{t('poLogin.formTagline')}</p>
            <h2 className="text-[20px] font-bold text-[var(--text-default)]">{t('poLogin.formTitle')}</h2>
          </div>

          <label className="block mb-3">
            <span className="block text-[12px] font-semibold text-[var(--text-subdued)] mb-1.5">{t('poLogin.emailLabel')}</span>
            <span className="flex items-center gap-2 rounded-[6px] border border-[var(--border-subdued)] px-3 h-10 bg-white">
              <Mail size={15} className="text-[var(--text-disabled)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                autoComplete="email"
                required
                aria-invalid={!!emailError}
                className="min-w-0 flex-1 outline-none text-[14px] bg-transparent"
                placeholder="partner@hospital.kr"
              />
            </span>
            {emailError ? (
              <span className="block mt-1 text-[11px] text-[var(--color-danger,#d72c0d)]">{emailError}</span>
            ) : null}
          </label>

          <label className="block mb-5">
            <span className="block text-[12px] font-semibold text-[var(--text-subdued)] mb-1.5">{t('poLogin.passwordLabel')}</span>
            <span className="flex items-center gap-2 rounded-[6px] border border-[var(--border-subdued)] px-3 h-10 bg-white">
              <LockKeyhole size={15} className="text-[var(--text-disabled)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                minLength={8}
                className="min-w-0 flex-1 outline-none text-[14px] bg-transparent"
                placeholder={t('poLogin.passwordPlaceholder')}
              />
            </span>
          </label>

          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={submitting || !email || !password || !!emailError}
            className="w-full"
          >
            {submitting ? t('poLogin.submitting') : t('poLogin.submit')}
          </Button>
        </form>
      </section>
    </main>
  );
}

export default function PartnerLoginPage() {
  return (
    <Suspense fallback={null}>
      <PartnerLoginForm />
    </Suspense>
  );
}
