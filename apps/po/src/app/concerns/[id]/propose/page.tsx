'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import type { AnesthesiaType } from '@hyliren/shared';
import { Card, Button, Input, Textarea, SectionHeader, AdminPage, Select } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';
import { usePOAuthStore } from '@/store/po-auth';
import { useTreatmentsStore } from '@/store/treatments';
import { useSubmittedProposalsStore } from '@/store/submitted-proposals';
import { useCreditsStore } from '@/store/credits';
import { useToastStore } from '@/store/toast';
import { ChevronDown } from 'lucide-react';
import { CREDIT_COST } from '@hyliren/shared';
import { getConcern, type ConcernDetailWire } from '@/lib/api/concern';

interface FormItem {
  name: string;
  nameZh: string;
  price: number;
}

interface Props {
  params: Promise<{ id: string }>;
}

const ANESTHESIA_OPTIONS = [
  { value: 'local', label: '부분마취' },
  { value: 'sedation', label: '수면마취' },
  { value: 'general', label: '전신마취' },
] as const;

export default function ProposePage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [concern, setConcern] = useState<ConcernDetailWire | null>(null);
  useEffect(() => {
    if (!id) return;
    getConcern(id).then(setConcern).catch(() => { /* notFound 시 silent — 페이지 렌더가 concern null 가드 */ });
  }, [id]);
  const { member } = usePOAuthStore();
  const { treatments } = useTreatmentsStore();
  const { submit } = useSubmittedProposalsStore();
  const { balance, deduct } = useCreditsStore();
  const { showToast } = useToastStore();

  const [items, setItems] = useState<FormItem[]>([{ name: '', nameZh: '', price: 0 }]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [recoveryDays, setRecoveryDays] = useState(7);
  const [anesthesia, setAnesthesia] = useState<AnesthesiaType>('sedation');
  const [stayDays, setStayDays] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [note, setNote] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);

  const activeTreatments = treatments.filter(t => t.isActive);

  function addItem() {
    setItems(prev => [...prev, { name: '', nameZh: '', price: 0 }]);
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof FormItem, value: string | number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function addFromCatalog(t: { name: string; nameZh: string; priceMin: number; priceMax: number }) {
    const midPrice = Math.round((t.priceMin + t.priceMax) / 2);
    setItems(prev => {
      const hasEmpty = prev.some(i => !i.name.trim());
      if (hasEmpty) {
        return prev.map((item, idx) =>
          idx === prev.findIndex(i => !i.name.trim())
            ? { name: t.name, nameZh: t.nameZh, price: midPrice }
            : item
        );
      }
      return [...prev, { name: t.name, nameZh: t.nameZh, price: midPrice }];
    });
    setShowCatalog(false);
  }

  const canSend = totalPrice > 0 && recoveryDays > 0 && items.some(i => i.name.trim()) && balance >= CREDIT_COST;
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (balance < CREDIT_COST) {
      showToast(`크레딧이 부족합니다. 현재 잔액: ${balance}개`, 'error');
      return;
    }
    if (sending) return;
    setSending(true);

    const payload = {
      concernId: id,
      memberId: member?.id ?? 'm-001',
      items: items.filter(i => i.name.trim()),
      totalPrice,
      recoveryDays,
      anesthesiaType: anesthesia,
      hospitalStayDays: stayDays,
      availableDateFrom: dateFrom || null,
      availableDateTo: dateTo || null,
      consultationNote: note.trim() || null,
      creditsCharged: CREDIT_COST,
    };

    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || '제안서 발송에 실패했습니다.', 'error');
        return;
      }

      // API 성공 후에만 크레딧 차감 + 로컬 저장
      const ok = deduct(CREDIT_COST, `제안서 발송 (${id})`);
      if (!ok) {
        showToast('크레딧 차감에 실패했습니다.', 'error');
        return;
      }
      submit(payload);
      showToast('제안서가 발송되었습니다. 크레딧 3개 차감.', 'success');
      router.push('/proposals');
    } catch {
      showToast('네트워크 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <AdminPage
      sidebar={<POSidebar active="/concerns" />}
      title={`제안서 작성 — ${concern?.primaryArea ?? ''} ${concern?.bodyAreaDetail ?? ''}`}
      prefix="po"
      actions={
        <span style={{ fontSize: 13, color: '#6b7280' }}>
          잔액 <strong style={{ color: '#0f172a' }}>{balance}</strong>크레딧 · 발송 시 {CREDIT_COST}개 차감
        </span>
      }
    >
          <div className="propose-form">

            {/* 시술 항목 */}
            <Card padding="md">
              <SectionHeader
                title="시술 항목"
                action={
                  <div className="flex gap-2">
                    <div className="relative">
                      <Button variant="ghost" size="sm" onClick={() => setShowCatalog(v => !v)}>
                        카탈로그에서 추가 <ChevronDown size={13} className="ml-1" />
                      </Button>
                      {showCatalog && (
                        <div className="catalog-dropdown">
                          {activeTreatments.length === 0 ? (
                            <p className="catalog-empty">등록된 시술이 없습니다.</p>
                          ) : (
                            activeTreatments.map(t => (
                              <button
                                key={t.id}
                                type="button"
                                className="catalog-item"
                                onClick={() => addFromCatalog(t)}
                              >
                                <span className="font-medium">{t.name}</span>
                                <span className="text-[var(--color-text-dim)] ml-2 text-xs">{t.priceMin}~{t.priceMax}만</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={addItem}>+ 직접 추가</Button>
                  </div>
                }
              />
              <div className="propose-items-list mt-4">
                {items.map((item, idx) => (
                  <div key={idx} className="propose-item-row">
                    <Input
                      label={idx === 0 ? '시술명' : undefined}
                      placeholder="시술명 (한국어)"
                      value={item.name}
                      onChange={e => updateItem(idx, 'name', e.target.value)}
                    />
                    <Input
                      label={idx === 0 ? '가격 (만원)' : undefined}
                      type="number"
                      placeholder="0"
                      value={item.price || ''}
                      onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                    />
                    {items.length > 1 && (
                      <button className="propose-item-remove" onClick={() => removeItem(idx)}>×</button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* 총 비용 */}
            <Card padding="md">
              <SectionHeader title="총 비용" subtitle="총 비용은 직접 입력합니다 (항목 합계와 다를 수 있음)" />
              <div className="propose-total-row mt-4">
                <span className="propose-total-label">총 예상 비용</span>
                <div className="flex items-baseline gap-2">
                  <input
                    type="number"
                    value={totalPrice || ''}
                    onChange={e => setTotalPrice(Number(e.target.value))}
                    placeholder="0"
                    className="propose-total-input"
                  />
                  <span className="text-[var(--color-text-secondary)]">만원</span>
                </div>
              </div>
            </Card>

            {/* 시술 정보 */}
            <Card padding="md">
              <SectionHeader title="시술 정보" />
              <div className="propose-form-row mt-4">
                <Input
                  label="회복 기간 (일)"
                  type="number"
                  value={recoveryDays}
                  onChange={e => setRecoveryDays(Number(e.target.value))}
                />
                <Select
                  label="마취 유형"
                  value={anesthesia}
                  options={ANESTHESIA_OPTIONS}
                  onChange={nextValue => setAnesthesia(nextValue as AnesthesiaType)}
                />
              </div>
              <div className="propose-form-row mt-4">
                <Input
                  label="입원 기간 (일)"
                  type="number"
                  value={stayDays}
                  onChange={e => setStayDays(Number(e.target.value))}
                />
                <div />
              </div>
              <div className="propose-form-row mt-4">
                <Input label="시술 가능 시작일" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                <Input label="시술 가능 종료일" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
            </Card>

            {/* 부연 설명 */}
            <Card padding="md">
              <Textarea
                label="부연 설명 (선택)"
                placeholder="고객에게 전달할 추가 설명이 있으면 적어주세요"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
              />
            </Card>

            {/* 발송 */}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => router.back()}>취소</Button>
              <Button variant="accent" onClick={handleSend} disabled={!canSend || sending}>
                {sending ? '발송 중...' : `제안서 발송 (크레딧 ${CREDIT_COST}개)`}
              </Button>
            </div>

            {balance < CREDIT_COST && (
              <p className="text-right text-sm text-[var(--color-danger)]">
                크레딧이 부족합니다. 현재 잔액: {balance}개
              </p>
            )}
          </div>
    </AdminPage>
  );
}
