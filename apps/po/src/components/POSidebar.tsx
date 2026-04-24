'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building2,
  Stethoscope,
  MessageSquareText,
  Activity,
  CreditCard,
  CircleUserRound,
  ShieldCheck,
  Plus,
  LogOut,
} from 'lucide-react';
import { useCreditsStore } from '@/store/credits';
import { usePOAuthStore } from '@/store/po-auth';
import { useToastStore } from '@/store/toast';
import { Button, Modal } from '@hyliren/ui';
import { MOCK_PARTNER_PROFILES } from '@hyliren/shared';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: '대시보드' },
  { href: '/concerns', icon: MessageSquareText, label: '고민' },
  { href: '/activity', icon: Activity, label: '활동 내역' },
  { href: '/treatments', icon: Stethoscope, label: '시술 관리' },
  { href: '/profile', icon: Building2, label: '파트너 정보' },
] as const;

const CHARGE_OPTIONS = [
  { amount: 10, price: '30,000' },
  { amount: 30, price: '80,000' },
  { amount: 50, price: '120,000' },
  { amount: 100, price: '200,000' },
];

export function POSidebar({ active }: { active: string }) {
  const balance = useCreditsStore(s => s.balance);
  const charge = useCreditsStore(s => s.charge);
  const member = usePOAuthStore(s => s.member);
  const profile = usePOAuthStore(s => s.profile);
  const logout = usePOAuthStore(s => s.logout);
  const { showToast } = useToastStore();

  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  function handleCharge() {
    if (!selected) return;
    const opt = CHARGE_OPTIONS.find(o => o.amount === selected);
    charge(selected);
    fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'credit_charge',
        amount: parseInt((opt?.price || '0').replace(/,/g, '')),
        currency: 'KRW',
        actorType: 'partner',
        actorId: member?.id ?? 'm-001',
        actorName: MOCK_PARTNER_PROFILES.find(p => p.memberId === (member?.id ?? 'm-001'))?.hospitalName || '',
        status: 'paid',
      }),
    }).catch(() => {});
    showToast(`${selected}크레딧이 충전되었습니다.`, 'success');
    setShowModal(false);
    setSelected(null);
  }

  async function handleLogout() {
    try {
      await logout();
      showToast('로그아웃되었습니다.', 'info');
    } catch {
      showToast('로그아웃되었습니다. 일부 정리는 재접속 시 자동 처리됩니다.', 'warning');
    }
  }

  return (
    <>
      <aside className="po-sidebar">
        <Link href="/dashboard" className="po-sidebar-logo">Partner Office</Link>
        <nav className="po-sidebar-nav">
          {NAV.map(n => {
            const Icon = n.icon;
            const isActive = active === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`po-sidebar-link ${isActive ? 'po-sidebar-link--active' : ''}`}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                {n.label}
              </Link>
            );
          })}
          <div className="po-sidebar-footer">
            <div className="po-sidebar-credit">
              <div className="po-sidebar-credit__label">
                <CreditCard size={12} />
                <span>크레딧 잔액</span>
              </div>
              <div className="po-sidebar-credit__row">
                <div className="po-sidebar-credit__value">
                  <span>{balance}</span>
                  <span className="po-sidebar-credit__unit">CR</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '5px 12px', borderRadius: 6,
                    fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                    background: 'var(--interactive-default, #2C6ECB)', color: '#fff',
                    border: 'none', cursor: 'pointer',
                    transition: 'opacity 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  <Plus size={12} />
                  충전
                </button>
              </div>
            </div>

            <div className="po-sidebar-account">
              <Link href="/profile" className="po-sidebar-account__profile" aria-label="현재 로그인한 파트너 계정 정보 보기">
                <div className="po-sidebar-account__avatar">
                  <CircleUserRound size={18} />
                </div>
                <div className="po-sidebar-account__body">
                  <div className="po-sidebar-account__topline">
                    <strong className="po-sidebar-account__hospital">
                      {profile?.hospitalName ?? '파트너 계정'}
                    </strong>
                    {profile?.verified ? (
                      <span className="po-sidebar-account__verified">
                        <ShieldCheck size={12} />
                        인증
                      </span>
                    ) : null}
                  </div>
                  <span className="po-sidebar-account__identity">
                    {member?.name ?? '계정 정보 없음'}
                    {member?.email ? ` · ${member.email}` : ''}
                  </span>
                </div>
              </Link>
              {member ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="로그아웃"
                  className="po-sidebar-account__logout"
                >
                  <LogOut size={14} />
                </button>
              ) : (
                <Link href="/login" className="po-sidebar-account__login">로그인</Link>
              )}
            </div>
          </div>
        </nav>
      </aside>

      {/* 충전 모달 — 사이드바 외부에 렌더링 (z-index 보장) */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setSelected(null); }} title="크레딧 충전">
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>충전할 크레딧을 선택하세요</p>
        <div className="charge-options">
          {CHARGE_OPTIONS.map(opt => (
            <button key={opt.amount} type="button" onClick={() => setSelected(opt.amount)}
              className={`charge-option ${selected === opt.amount ? 'charge-option--active' : ''}`}
            >
              <span style={{ fontSize: 18, fontWeight: 700 }}>{opt.amount}</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>크레딧</span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{opt.price}원</span>
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 12, textAlign: 'center' }}>결제는 데모 모드입니다</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={() => { setShowModal(false); setSelected(null); }}>취소</Button>
          <Button variant="accent" size="sm" onClick={handleCharge} disabled={!selected}>
            {selected ? `${selected}크레딧 충전` : '충전'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
