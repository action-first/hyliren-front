'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MOCK_CONCERNS, MOCK_PROPOSALS } from '@hyliren/shared';
import { useAuthStore } from '@/store/auth';
import { Badge, Button } from '@hyliren/ui';
import { ChevronRight, FileText, Globe, Bell, HelpCircle, LogOut, ShieldCheck } from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS } from '@/domain/lifecycle';

const AREA_ACCENT: Record<string, string> = {
  '눈': 'bg-blue-50 text-blue-600',
  '코': 'bg-pink-50 text-pink-600',
  '리프팅': 'bg-purple-50 text-purple-600',
  '피부': 'bg-emerald-50 text-emerald-600',
};
import { useReportStore } from '@/store/report';
import { useLocaleStore } from '@/store/locale';
import { AuthModal } from '@/components/auth/AuthModal';

export default function MyPage() {
  const { user, isGuest, logout } = useAuthStore();
  const { purchasedIds } = useReportStore();
  const { locale, setLocale, t } = useLocaleStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (isGuest || !user) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 gap-4">
          <p className="text-[15px] font-medium text-[var(--color-text)] text-center">
            로그인하고 내 고민과 제안을<br/>한 곳에서 관리하세요
          </p>
          <p className="text-[12px] text-[var(--color-text-dim)] text-center mb-2">
            상담 등록 후 자동으로 로그인 화면이 안내됩니다
          </p>
          <Button variant="accent" size="lg" onClick={() => setShowAuthModal(true)}>
            로그인 / 회원가입
          </Button>
        </div>
        <AuthModal
          open={showAuthModal}
          onSuccess={() => setShowAuthModal(false)}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  const concerns = MOCK_CONCERNS.filter(c => c.userId === user.id && !c.deletedAt && c.status !== 'draft');
  const proposalCount = MOCK_PROPOSALS.filter(p => p.isActive && p.status !== 'draft').length;
  const completedCount = concerns.filter(c => c.status === 'hospital_selected' || c.status === 'completed' || c.status === 'service_purchased').length;

  return (
    <div className="flex flex-col pb-10">

      {/* ── Profile ── */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[1.25rem] font-bold text-white ring-2 ring-[var(--color-primary-soft)] ring-offset-2">
            {user.name[0]}
          </div>
          <div>
            <h1 className="text-[1.125rem] font-bold text-[var(--color-text)] leading-tight mb-0.5">{user.name}</h1>
            <span className="text-[11px] text-[var(--color-text-dim)]">{user.email}</span>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-4 rounded-xl bg-[var(--color-bg-secondary)] py-4">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 no-underline">
            <span className="text-[1.125rem] font-bold text-[var(--color-text)]">{concerns.length}</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">{t('mypage.registeredConcerns')}</span>
          </Link>
          <Link href="/decision" className="flex flex-col items-center gap-1 no-underline border-l border-[var(--color-border-light)]">
            <span className="text-[1.125rem] font-bold text-[var(--color-text)]">{proposalCount}</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">{t('mypage.receivedProposals')}</span>
          </Link>
          <Link href="/mypage/reports" className="flex flex-col items-center gap-1 no-underline border-l border-[var(--color-border-light)]">
            <span className="text-[1.125rem] font-bold text-[var(--color-text)]">{purchasedIds.size}</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">{t('mypage.purchasedReports')}</span>
          </Link>
          <Link href="/dashboard" className="flex flex-col items-center gap-1 no-underline border-l border-[var(--color-border-light)]">
            <span className="text-[1.125rem] font-bold text-[var(--color-text)]">{completedCount}</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">{t('mypage.completed')}</span>
          </Link>
        </div>
      </div>

      {/* ── My Concerns ── */}
      <section className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-[var(--color-text)]">{t('mypage.myConcerns')}</h2>
          <Link href="/dashboard" className="flex items-center gap-0.5 text-[11px] text-[var(--color-text-dim)] no-underline">
            {t('common.viewAll')} <ChevronRight size={14} />
          </Link>
        </div>
        {concerns.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[13px] text-[var(--color-text-dim)] mb-3">{t('mypage.noConcerns')}</p>
            <Link href="/consult" className="no-underline">
              <Button variant="accent" size="md">{t('mypage.registerConcern')}</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {concerns.slice(0, 3).map(c => {
              const cProposalCount = MOCK_PROPOSALS.filter(p => p.concernId === c.id && p.isActive).length;
              return (
                <Link key={c.id} href={`/concerns/${c.id}`} className="no-underline block">
                  <div className="px-4 py-3.5 rounded-xl bg-white"
                    style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {c.bodyAreas.slice(0, 2).map(area => (
                          <span key={area} className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${AREA_ACCENT[area] || 'bg-gray-50 text-gray-600'}`}>
                            {area}
                          </span>
                        ))}
                      </div>
                      <Badge variant={STATUS_COLORS[c.status] || 'default'} size="sm">
                        {STATUS_LABELS[c.status] || c.status}
                      </Badge>
                    </div>
                    <p className="text-[13px] text-[var(--color-text-secondary)] line-clamp-1 mb-1.5">{c.description}</p>
                    <div className="flex items-center justify-between">
                      {cProposalCount > 0 ? (
                        <span className="text-[11px] text-[var(--color-text-dim)]">제안 {cProposalCount}건</span>
                      ) : (
                        <span className="text-[11px] text-[var(--color-text-dim)]">대기 중</span>
                      )}
                      <ChevronRight size={14} className="text-[var(--color-text-dim)]" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Menu ── */}
      <section className="px-5">
        <h2 className="text-[15px] font-bold text-[var(--color-text)] mb-3">{t('mypage.settings')}</h2>
        <div className="rounded-xl bg-white overflow-hidden"
          style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}>
          {[
            { icon: FileText, label: t('mypage.purchasedReportsMenu'), value: `${purchasedIds.size}${t('common.items')}`, href: '/mypage/reports', iconColor: 'text-[var(--color-primary)]' },
            { icon: Globe, label: t('mypage.language'), value: locale === 'ko' ? t('common.langKo') : t('common.langZh'), action: () => setLocale(locale === 'ko' ? 'zh-CN' : 'ko'), iconColor: 'text-[var(--color-primary)]' },
            { icon: Bell, label: t('mypage.notifications'), value: '', iconColor: 'text-[var(--color-text-dim)]' },
            { icon: ShieldCheck, label: t('mypage.privacy'), value: '', iconColor: 'text-[var(--color-text-dim)]' },
            { icon: HelpCircle, label: t('mypage.support'), value: '', iconColor: 'text-[var(--color-text-dim)]' },
          ].map((item, i) => {
            const Icon = item.icon;
            const inner = (
              <div className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-[var(--color-border-light)]' : ''}`}>
                <Icon size={16} className={`${item.iconColor} shrink-0`} />
                <span className="text-[13px] text-[var(--color-text)] flex-1">{item.label}</span>
                {item.value && <span className="text-[12px] text-[var(--color-text-dim)]">{item.value}</span>}
                <ChevronRight size={14} className="text-[var(--color-text-dim)]" />
              </div>
            );
            if (item.href) return <Link key={item.label} href={item.href} className="no-underline block">{inner}</Link>;
            if ('action' in item && item.action) return <button key={item.label} type="button" onClick={item.action} className="w-full border-0 bg-transparent p-0 cursor-pointer text-left">{inner}</button>;
            return <div key={item.label}>{inner}</div>;
          })}
        </div>

        {/* Logout */}
        <button type="button"
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full py-3.5 mt-6 rounded-xl bg-transparent border border-[var(--color-border-light)] cursor-pointer"
        >
          <LogOut size={14} className="text-[var(--color-text-dim)]" />
          <span className="text-[13px] text-[var(--color-text-dim)]">{t('mypage.logout')}</span>
        </button>
      </section>
    </div>
  );
}
