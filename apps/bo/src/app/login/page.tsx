'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@hyliren/ui';
import { useBOAuthStore } from '@/store/bo-auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginWithPassword = useBOAuthStore((s) => s.loginWithPassword);
  const status = useBOAuthStore((s) => s.status);
  const member = useBOAuthStore((s) => s.member);

  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const next = searchParams.get('next') || '/dashboard';
  const emailError =
    emailTouched && email && !EMAIL_PATTERN.test(email) ? '이메일 형식을 확인해주세요.' : null;

  useEffect(() => {
    if (status === 'authenticated' && member) {
      router.replace(next);
    }
  }, [member, next, router, status]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setEmailTouched(true);
    setErrorMsg(null);
    if (!EMAIL_PATTERN.test(email)) return;

    setSubmitting(true);
    try {
      await loginWithPassword({ email, password });
      router.replace(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다.';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--surface-bg)] px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-[380px] bg-[var(--surface-default)] border border-[var(--border-subdued)] rounded-[10px] p-7 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-7">
          <span
            style={{
              fontFamily: 'Pretendard, sans-serif',
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: '-0.025em',
              color: 'var(--text-default)',
            }}
          >
            mimyo
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              opacity: 0.55,
              color: 'var(--text-default)',
            }}
          >
            Admin
          </span>
        </div>

        <h1 className="text-[20px] font-bold text-[var(--text-default)] mb-1">관리자 로그인</h1>
        <p className="text-[12px] text-[var(--text-subdued)] mb-6">
          내부 운영 도구입니다. 권한이 있는 계정만 접근하세요.
        </p>

        <label className="block mb-3">
          <span className="block text-[12px] font-semibold text-[var(--text-subdued)] mb-1.5">이메일</span>
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
              placeholder="admin@mi-myo.com"
            />
          </span>
          {emailError ? (
            <span className="block mt-1 text-[11px] text-[var(--color-danger,#d72c0d)]">{emailError}</span>
          ) : null}
        </label>

        <label className="block mb-4">
          <span className="block text-[12px] font-semibold text-[var(--text-subdued)] mb-1.5">비밀번호</span>
          <span className="flex items-center gap-2 rounded-[6px] border border-[var(--border-subdued)] px-3 h-10 bg-white">
            <LockKeyhole size={15} className="text-[var(--text-disabled)]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              minLength={1}
              className="min-w-0 flex-1 outline-none text-[14px] bg-transparent"
              placeholder="비밀번호"
            />
          </span>
        </label>

        {errorMsg ? (
          <div
            role="alert"
            className="mb-4 px-3 py-2 rounded-[6px] bg-[var(--color-danger-soft,#fef2f2)] border border-[var(--color-danger,#d72c0d)]/30 text-[12px] text-[var(--color-danger,#d72c0d)]"
          >
            {errorMsg}
          </div>
        ) : null}

        <Button
          variant="primary"
          size="md"
          type="submit"
          disabled={submitting || !email || !password || !!emailError}
          className="w-full"
        >
          {submitting ? '로그인 중...' : '로그인'}
        </Button>

        <p className="mt-5 flex items-center gap-1.5 text-[11px] text-[var(--text-subdued)]">
          <ShieldCheck size={12} />
          모든 접근은 audit log 에 기록됩니다.
        </p>
      </form>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
