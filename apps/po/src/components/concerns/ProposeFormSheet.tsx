'use client';

import { useEffect, useState } from 'react';
import type { AnesthesiaType } from '@hyliren/shared';
import { CREDIT_COST } from '@hyliren/shared';
import { Button, Card, Input, SectionHeader, Select, SideSheet, Textarea } from '@hyliren/ui';
import { Calendar, ChevronDown, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ko } from 'date-fns/locale';

import { useTreatmentsStore } from '@/store/treatments';
import { useCreditsStore } from '@/store/credits';
import { useToastStore } from '@/store/toast';
import { createProposal } from '@/lib/api/proposal';
import { ApiError } from '@/lib/api/errors';

interface FormItem {
  name: string;
  nameZh: string;
  price: number;
}

interface ProposeFormSheetProps {
  concernId: string;
  open: boolean;
  onClose: () => void;
  /** 발송 성공 후 호출 — 호출처에서 detail 새로고침 등. */
  onSuccess?: () => void;
}

const ANESTHESIA_OPTIONS = [
  { value: 'local', label: '부분마취' },
  { value: 'sedation', label: '수면마취' },
  { value: 'general', label: '전신마취' },
] as const;

export function ProposeFormSheet({ concernId, open, onClose, onSuccess }: ProposeFormSheetProps) {
  const { treatments } = useTreatmentsStore();
  const { balance, deduct } = useCreditsStore();
  const { showToast } = useToastStore();

  const [items, setItems] = useState<FormItem[]>([{ name: '', nameZh: '', price: 0 }]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [recoveryDays, setRecoveryDays] = useState(7);
  const [anesthesia, setAnesthesia] = useState<AnesthesiaType>('sedation');
  const [stayDays, setStayDays] = useState(0);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [note, setNote] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);
  const [sending, setSending] = useState(false);

  // Sheet 가 닫히면 폼 초기화 — 같은 concern 에 다시 열어도 깨끗한 상태
  useEffect(() => {
    if (!open) {
      setItems([{ name: '', nameZh: '', price: 0 }]);
      setTotalPrice(0);
      setRecoveryDays(7);
      setAnesthesia('sedation');
      setStayDays(0);
      setDateFrom(null);
      setDateTo(null);
      setNote('');
      setShowCatalog(false);
    }
  }, [open]);

  const activeTreatments = treatments.filter(t => t.isActive);

  function addItem() {
    setItems(prev => [...prev, { name: '', nameZh: '', price: 0 }]);
  }
  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }
  function updateItem(idx: number, field: keyof FormItem, value: string | number) {
    setItems(prev => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
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

  const canSend =
    totalPrice > 0 &&
    recoveryDays > 0 &&
    items.some(i => i.name.trim()) &&
    balance >= CREDIT_COST;

  async function handleSend() {
    if (sending) return;
    if (balance < CREDIT_COST) {
      showToast(`크레딧이 부족합니다. 현재 잔액: ${balance}개`, 'error');
      return;
    }
    setSending(true);
    try {
      await createProposal(concernId, {
        items: items
          .filter(i => i.name.trim())
          .map((i, idx) => ({
            treatmentName: i.name.trim(),
            treatmentNameZh: i.nameZh?.trim() || null,
            price: i.price,
            sortOrder: idx,
          })),
        totalPrice,
        recoveryDays,
        anesthesiaType: anesthesia,
        hospitalStayDays: stayDays,
        availableDateFrom: dateFrom ? dateFrom.toISOString().slice(0, 10) : undefined,
        availableDateTo: dateTo ? dateTo.toISOString().slice(0, 10) : undefined,
        consultationNote: note.trim() || undefined,
      });
      // backend 가 차감했으므로 store 도 동기화 (UI 즉시 반영용 — 다음 fetch 시 backend 값으로 덮임)
      deduct(CREDIT_COST, `제안서 발송 (${concernId})`);
      showToast(`제안서가 발송되었습니다. 크레딧 ${CREDIT_COST}개 차감.`, 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(err.message || '제안서 발송에 실패했습니다.', 'error');
      } else {
        showToast('네트워크 오류가 발생했습니다. 다시 시도해주세요.', 'error');
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      width="lg"
      title="제안서 작성"
      footer={
        <div className="w-full flex flex-col gap-2">
          <p className="text-[var(--text-xs)] text-[var(--text-subdued)] text-right">
            잔액 <strong className="text-[var(--text-default)]">{balance}</strong>크레딧 · 발송 시 {CREDIT_COST}개 차감
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>취소</Button>
            <Button variant="accent" onClick={handleSend} disabled={!canSend || sending}>
              {sending ? '발송 중…' : '제안서 발송'}
            </Button>
          </div>
        </div>
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
                            <span className="text-[var(--text-disabled)] ml-2 text-xs">{t.priceMin}~{t.priceMax}만</span>
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
          {/* 컬럼 헤더 */}
          <div
            className="grid gap-3 px-1 pb-2 mt-4 border-b border-[var(--border-subdued)] text-[var(--text-xs)] font-semibold text-[var(--text-subdued)]"
            style={{ gridTemplateColumns: '1fr 6rem 2.25rem' }}
          >
            <span>시술명</span>
            <span>가격 (만원)</span>
            <span aria-hidden />
          </div>

          {/* 각 행 — divider 로 분리, 카드 nesting 없음 */}
          <div className="flex flex-col">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="grid gap-3 items-center py-3 border-b border-[var(--border-subdued)] last:border-b-0"
                style={{ gridTemplateColumns: '1fr 6rem 2.25rem' }}
              >
                <Input
                  placeholder="시술명 (한국어)"
                  value={item.name}
                  onChange={e => updateItem(idx, 'name', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="0"
                  value={item.price || ''}
                  onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                />
                {items.length > 1 ? (
                  <button
                    type="button"
                    aria-label="항목 삭제"
                    className="w-9 h-[var(--input-height,32px)] flex items-center justify-center rounded-[var(--app-radius-sm)] bg-transparent border border-[var(--border-default)] text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] hover:border-[var(--color-danger)] cursor-pointer transition-colors"
                    onClick={() => removeItem(idx)}
                  >
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <div className="w-9 h-[var(--input-height,32px)]" aria-hidden />
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
              <span className="text-[var(--text-subdued)]">만원</span>
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
          <div className="mt-3">
            <Input
              label="입원 기간 (일)"
              type="number"
              value={stayDays}
              onChange={e => setStayDays(Number(e.target.value))}
            />
          </div>
          <div className="propose-form-row mt-3">
            <div className="input-wrapper">
              <label className="input-label">시작일</label>
              <div className="datepicker-wrapper">
                <Calendar size={14} className="datepicker-icon" />
                <DatePicker
                  selected={dateFrom}
                  onChange={(d: Date | null) => setDateFrom(d)}
                  dateFormat="yyyy.MM.dd"
                  placeholderText="선택"
                  locale={ko}
                  className="datepicker-input"
                />
              </div>
            </div>
            <div className="input-wrapper">
              <label className="input-label">종료일</label>
              <div className="datepicker-wrapper">
                <Calendar size={14} className="datepicker-icon" />
                <DatePicker
                  selected={dateTo}
                  onChange={(d: Date | null) => setDateTo(d)}
                  dateFormat="yyyy.MM.dd"
                  placeholderText="선택"
                  locale={ko}
                  className="datepicker-input"
                  minDate={dateFrom || undefined}
                />
              </div>
            </div>
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

        {balance < CREDIT_COST && (
          <p className="text-right text-sm text-[var(--color-danger)]">
            크레딧이 부족합니다. 현재 잔액: {balance}개
          </p>
        )}
      </div>
    </SideSheet>
  );
}
