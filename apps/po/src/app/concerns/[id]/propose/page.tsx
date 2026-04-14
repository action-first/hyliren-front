'use client';

import { useState, use } from 'react';
import { MOCK_CONCERNS, ANESTHESIA_TYPES } from '@hyliren/shared';
import type { AnesthesiaType } from '@hyliren/shared';
import { Card, Button, Input, Textarea, SectionHeader } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';

interface TreatmentItem {
  name: string;
  nameZh: string;
  price: number;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProposePage({ params }: Props) {
  const { id } = use(params);
  const concern = MOCK_CONCERNS.find(c => c.id === id) || MOCK_CONCERNS[0];

  const [items, setItems] = useState<TreatmentItem[]>([{ name: '', nameZh: '', price: 0 }]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [recoveryDays, setRecoveryDays] = useState(7);
  const [anesthesia, setAnesthesia] = useState<AnesthesiaType>('sedation');
  const [stayDays, setStayDays] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  function addItem() {
    setItems([...items, { name: '', nameZh: '', price: 0 }]);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof TreatmentItem, value: string | number) {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function handleSend() {
    setSent(true);
  }

  const canSend = totalPrice > 0 && recoveryDays > 0 && items.some(i => i.name.trim());

  if (sent) {
    return (
      <div className="po-layout">
        <POSidebar active="/concerns" />
        <div className="po-main">
          <div className="po-topbar"><span className="po-topbar-title">제안서 발송 완료</span></div>
          <div className="po-content text-center pt-12">
            <div className="text-5xl mb-4">✅</div>
            <h2>제안서가 발송되었습니다</h2>
            <p className="text-[var(--color-text-secondary)] mt-2">
              크레딧 3개가 차감되었습니다. 고객이 열람하면 알려드리겠습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="po-layout">
      <POSidebar active="/concerns" />
      <div className="po-main">
        <div className="po-topbar">
          <span className="po-topbar-title">제안서 작성 — {concern.bodyArea} {concern.bodyAreaDetail || ''}</span>
        </div>
        <div className="po-content">
          <div className="propose-form">
            {/* Treatment Items */}
            <Card padding="md">
              <SectionHeader
                title="시술 항목"
                action={<Button variant="ghost" size="sm" onClick={addItem}>+ 항목 추가</Button>}
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

            {/* Total Price (권위 값) */}
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
                    style={{
                      width: '6rem', textAlign: 'right', border: 'none', background: 'transparent',
                      fontSize: 'var(--admin-text-h2)', fontWeight: 700, color: 'var(--admin-accent)', outline: 'none',
                    }}
                  />
                  <span className="text-[var(--color-text-secondary)]">만원</span>
                </div>
              </div>
            </Card>

            {/* Specs */}
            <Card padding="md">
              <SectionHeader title="시술 정보" />
              <div className="propose-form-row mt-4">
                <Input
                  label="회복 기간 (일)"
                  type="number"
                  value={recoveryDays}
                  onChange={e => setRecoveryDays(Number(e.target.value))}
                />
                <div className="input-wrapper">
                  <label className="input-label">마취 유형</label>
                  <select
                    className="input-field"
                    value={anesthesia}
                    onChange={e => setAnesthesia(e.target.value as AnesthesiaType)}
                  >
                    <option value="local">부분마취</option>
                    <option value="sedation">수면마취</option>
                    <option value="general">전신마취</option>
                  </select>
                </div>
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

            {/* Note */}
            <Card padding="md">
              <Textarea
                label="부연 설명 (선택)"
                placeholder="고객에게 전달할 추가 설명이 있으면 적어주세요"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
              />
            </Card>

            {/* Send */}
            <div className="flex justify-end gap-3">
              <Button variant="secondary">임시 저장</Button>
              <Button variant="primary" onClick={handleSend} disabled={!canSend}>
                제안서 발송 (크레딧 3개)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
