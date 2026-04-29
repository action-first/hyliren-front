'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Locale, Proposal } from '@hyliren/shared';
import { useAuthStore } from '@/store/auth';
import { Badge, BottomSheet, Button, Spinner } from '@hyliren/ui';
import { Check, ChevronRight, FileText, Globe, Bell, HelpCircle, LogOut, ShieldCheck } from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS } from '@/domain/lifecycle';

import { AREA_ACCENT } from '@/lib/area-styles';
import { useReportStore } from '@/store/report';
import { useLocaleStore } from '@/store/locale';
import { useMyConcerns } from '@/lib/hooks/concern';
import { listProposals, mapProposal } from '@/lib/api/proposal';
import { AuthModal } from '@/components/auth/AuthModal';

const LOCALE_OPTIONS: { value: Locale; labelKey: string }[] = [
  { value: 'ko', labelKey: 'common.langKo' },
  { value: 'zh-CN', labelKey: 'common.langZh' },
  { value: 'ja', labelKey: 'common.langJa' },
  { value: 'en', labelKey: 'common.langEn' },
];

function localeToLabelKey(locale: Locale): string {
  const found = LOCALE_OPTIONS.find(o => o.value === locale);
  return found?.labelKey ?? 'common.langKo';
}

export default function MyPage() {
  const { user, isGuest, logout } = useAuthStore();
  const { purchasedIds } = useReportStore();
  const { locale, setLocale, t } = useLocaleStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLocaleSheet, setShowLocaleSheet] = useState(false);

  const { concerns: apiConcerns, loading: concernsLoading } = useMyConcerns();
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  useEffect(() => {
    if (concernsLoading) return;
    if (apiConcerns.length === 0) {
      setProposals([]);
      return;
    }
    Promise.all(
      apiConcerns.map(c => listProposals(c.id).then(w => w.proposals.map(mapProposal)).catch(() => [] as Proposal[])),
    ).then(results => setProposals(results.flat()));
  }, [apiConcerns, concernsLoading]);

  if (isGuest || !user) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 gap-4">
          <p className="text-[15px] font-medium text-[var(--color-text)] text-center whitespace-pre-line">
            {t('mypage.loginToManage')}
          </p>
          <p className="text-[12px] text-[var(--color-text-dim)] text-center mb-2">
            {t('mypage.loginAfterConsultHint')}
          </p>
          <Button variant="primary" size="xl" onClick={() => setShowAuthModal(true)}>
            {t('mypage.loginOrSignup')}
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

  const ready = !concernsLoading && proposals !== null;
  if (!ready) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  }

  const userProposals = proposals ?? [];
  const concerns = apiConcerns.filter(c => !c.deletedAt && c.status !== 'draft');
  const proposalCount = userProposals.length;
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
        <div className="grid grid-cols-4 rounded-[var(--app-radius)] bg-[var(--color-bg-secondary)] py-4">
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
              <Button variant="primary" size="md">{t('mypage.registerConcern')}</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {concerns.slice(0, 3).map(c => {
              const cProposalCount = userProposals.filter(p => p.concernId === c.id).length;
              return (
                <Link key={c.id} href={`/concerns/${c.id}`} className="no-underline block">
                  <div className="px-4 py-3.5 rounded-[var(--app-radius)] bg-[var(--color-bg)]"
                    style={{ boxShadow: 'var(--app-shadow-card-sm)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {c.bodyAreas.slice(0, 2).map(area => (
                          <span key={area} className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${AREA_ACCENT[area] || 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'}`}>
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
                        <span className="text-[11px] text-[var(--color-text-dim)]">{t('decision.proposalCount', { count: cProposalCount })}</span>
                      ) : (
                        <span className="text-[11px] text-[var(--color-text-dim)]">{t('mypage.awaitingProposals')}</span>
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
        <div className="rounded-[var(--app-radius)] bg-[var(--color-bg)] overflow-hidden"
          style={{ boxShadow: 'var(--app-shadow-card-sm)' }}>
          {[
            { icon: FileText, label: t('mypage.purchasedReportsMenu'), value: `${purchasedIds.size}${t('common.items')}`, href: '/mypage/reports', iconColor: 'text-[var(--color-primary)]' },
            { icon: Globe, label: t('mypage.language'), value: t(localeToLabelKey(locale)), action: () => setShowLocaleSheet(true), iconColor: 'text-[var(--color-primary)]' },
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
          className="flex items-center justify-center gap-2 w-full py-3.5 mt-6 rounded-[var(--app-radius)] bg-transparent border border-[var(--color-border-light)] cursor-pointer"
        >
          <LogOut size={14} className="text-[var(--color-text-dim)]" />
          <span className="text-[13px] text-[var(--color-text-dim)]">{t('mypage.logout')}</span>
        </button>
      </section>

      {/* Locale 선택 BottomSheet */}
      <BottomSheet
        open={showLocaleSheet}
        onClose={() => setShowLocaleSheet(false)}
        showHandle
        showClose
      >
        <h3 className="text-[15px] font-bold text-[var(--color-text)] mb-3">{t('mypage.language')}</h3>
        <div className="flex flex-col">
          {LOCALE_OPTIONS.map((opt) => {
            const isActive = locale === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setLocale(opt.value);
                  setShowLocaleSheet(false);
                }}
                className="flex items-center justify-between px-1 py-3.5 border-0 bg-transparent cursor-pointer text-left border-b border-[var(--color-border-light)] last:border-b-0"
              >
                <span className={`text-[14px] ${isActive ? 'font-semibold text-[var(--color-text)]' : 'text-[var(--color-text)]'}`}>
                  {t(opt.labelKey)}
                </span>
                {isActive && <Check size={16} className="text-[var(--color-primary)]" />}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}
