'use client';

import Link from 'next/link';
import { MOCK_USERS, MOCK_CONCERNS, MOCK_PROPOSALS } from '@hyliren/shared';
import { Badge, Button } from '@hyliren/ui';
import { ChevronRight, FileText, Globe, Bell, HelpCircle, LogOut, ShieldCheck } from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS } from '@/domain/lifecycle';
import { useReportStore } from '@/store/report';
import { useLocaleStore } from '@/store/locale';

export default function MyPage() {
  const user = MOCK_USERS.find(u => u.role === 'buyer');
  const { purchasedIds } = useReportStore();
  const { locale, setLocale, t } = useLocaleStore();

  if (!user) return null;

  const concerns = MOCK_CONCERNS.filter(c => c.userId === user.id && !c.deletedAt && c.status !== 'draft');
  const proposalCount = MOCK_PROPOSALS.filter(p => p.isActive && p.status !== 'draft').length;
  const completedCount = concerns.filter(c => c.status === 'hospital_selected' || c.status === 'completed' || c.status === 'service_purchased').length;

  return (
    <div className="flex flex-col pb-10">

      {/* ── Profile ── */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-primary-soft)] to-[#fff5f7] flex items-center justify-center text-[1.25rem] font-bold text-[var(--color-primary)]">
            {user.name[0]}
          </div>
          <div>
            <h1 className="text-[1.125rem] font-bold text-[var(--color-text)] leading-tight">{user.name}</h1>
            <span className="text-[12px] text-[var(--color-text-dim)]">{user.email}</span>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="px-5 mb-5">
        <div className="flex items-center justify-center px-3 py-4 rounded-xl bg-[var(--color-bg-secondary)]">
          <Link href="/dashboard" className="flex-1 flex flex-col items-center gap-0.5 no-underline">
            <span className="text-[1rem] font-bold text-[var(--color-text)]">{concerns.length}</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">{t('mypage.registeredConcerns')}</span>
          </Link>
          <div className="w-px h-7 bg-[var(--color-border-light)]" />
          <Link href="/decision" className="flex-1 flex flex-col items-center gap-0.5 no-underline">
            <span className="text-[1rem] font-bold text-[var(--color-text)]">{proposalCount}</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">{t('mypage.receivedProposals')}</span>
          </Link>
          <div className="w-px h-7 bg-[var(--color-border-light)]" />
          <Link href="/decision" className="flex-1 flex flex-col items-center gap-0.5 no-underline">
            <span className="text-[1rem] font-bold text-[var(--color-text)]">{purchasedIds.size}</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">{t('mypage.purchasedReports')}</span>
          </Link>
          <div className="w-px h-7 bg-[var(--color-border-light)]" />
          <Link href="/dashboard" className="flex-1 flex flex-col items-center gap-0.5 no-underline">
            <span className="text-[1rem] font-bold text-[var(--color-text)]">{completedCount}</span>
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
          <div className="flex flex-col gap-2">
            {concerns.slice(0, 3).map(c => (
              <Link key={c.id} href={`/concerns/${c.id}`} className="no-underline block">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white"
                  style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {c.bodyAreas.slice(0, 2).map(area => (
                        <Badge key={area} variant="info" size="sm">{area}</Badge>
                      ))}
                    </div>
                    <p className="text-[13px] text-[var(--color-text)] line-clamp-1">{c.description}</p>
                  </div>
                  <Badge variant={STATUS_COLORS[c.status] || 'default'} size="sm">
                    {STATUS_LABELS[c.status] || c.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Menu ── */}
      <section className="px-5">
        <h2 className="text-[15px] font-bold text-[var(--color-text)] mb-3">{t('mypage.settings')}</h2>
        <div className="rounded-xl bg-white overflow-hidden"
          style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)' }}>
          {[
            { icon: FileText, label: t('mypage.purchasedReportsMenu'), value: `${purchasedIds.size}${t('common.items')}`, href: '/decision' },
            { icon: Globe, label: t('mypage.language'), value: locale === 'ko' ? t('common.langKo') : t('common.langZh'), action: () => setLocale(locale === 'ko' ? 'zh-CN' : 'ko') },
            { icon: Bell, label: t('mypage.notifications'), value: '' },
            { icon: ShieldCheck, label: t('mypage.privacy'), value: '' },
            { icon: HelpCircle, label: t('mypage.support'), value: '' },
          ].map((item, i) => {
            const Icon = item.icon;
            const inner = (
              <div className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-[var(--color-border-light)]' : ''}`}>
                <Icon size={16} className="text-[var(--color-text-dim)] shrink-0" />
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
          className="flex items-center gap-3 w-full px-4 py-3.5 mt-3 rounded-xl bg-white border-0 cursor-pointer"
          style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }}>
          <LogOut size={16} className="text-red-400" />
          <span className="text-[13px] text-red-400">{t('mypage.logout')}</span>
        </button>
      </section>
    </div>
  );
}
