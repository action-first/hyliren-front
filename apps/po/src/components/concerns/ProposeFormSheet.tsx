'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { AnesthesiaType, Procedure } from '@hyliren/shared';
import { CREDIT_COST } from '@hyliren/shared';
import { pickI18n } from '@hyliren/shared/src/domain/procedure';
import { Button, Card, Input, SectionHeader, Select, SideSheet, Textarea } from '@hyliren/ui';
import { Calendar, ChevronDown, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ko } from 'date-fns/locale';

import { useToastStore } from '@/store/toast';
import { useCreateProposal } from '@/hooks/mutations/proposals';
import { useProcedures } from '@/hooks/queries/procedures';
import { useCreditBalance } from '@/hooks/queries/credits';
import { toUserMessage } from '@/lib/api/error-messages';

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
  // 잔액 = real BE. 발송 후 mutation 이 invalidate → 자동 갱신.
  const balanceQ = useCreditBalance();
  const balance = balanceQ.data?.balance ?? 0;
  const { showToast } = useToastStore();

  // 카탈로그 = PO 가 등록한 real published procedure (BE PR #19+).
  // 이전엔 useTreatmentsStore mock — 시술관리 페이지의 등록 흐름과 분리되어 있어 정합성 버그.
  // 지금은 useProcedures('published') 로 5분 cache 공유.
  const proceduresQ = useProcedures('published');
  const publishedProcedures: Procedure[] = proceduresQ.data?.procedures ?? [];

  const [items, setItems] = useState<FormItem[]>([{ name: '', nameZh: '', price: 0 }]);
  const [totalPrice, setTotalPrice] = useState(0);
  // 사용자가 총 비용을 직접 수정하면 dirty=true → 더 이상 자동 합산 동기화 안 함
  const [totalDirty, setTotalDirty] = useState(false);
  const [recoveryDays, setRecoveryDays] = useState(7);
  const [anesthesia, setAnesthesia] = useState<AnesthesiaType>('sedation');
  const [stayDays, setStayDays] = useState(0);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [note, setNote] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);
  // RQ mutation — 성공 시 proposals + concerns 캐시 자동 invalidate.
  const createMutation = useCreateProposal();
  const sending = createMutation.isPending;

  // Sheet 가 닫히면 폼 초기화 — 같은 concern 에 다시 열어도 깨끗한 상태
  useEffect(() => {
    if (!open) {
      setItems([{ name: '', nameZh: '', price: 0 }]);
      setTotalPrice(0);
      setTotalDirty(false);
      setRecoveryDays(7);
      setAnesthesia('sedation');
      setStayDays(0);
      setDateFrom(null);
      setDateTo(null);
      setNote('');
      setShowCatalog(false);
    }
  }, [open]);

  // 시술 항목 가격 합계
  const itemsSum = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.price) || 0), 0),
    [items],
  );

  // 사용자가 직접 수정 안 한 동안은 합계 = 총비용 자동 동기화
  useEffect(() => {
    if (!totalDirty) {
      setTotalPrice(itemsSum);
    }
  }, [itemsSum, totalDirty]);

  function addItem() {
    setItems(prev => [...prev, { name: '', nameZh: '', price: 0 }]);
  }
  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }
  function updateItem(idx: number, field: keyof FormItem, value: string | number) {
    setItems(prev => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  // 가격 input — 콤마 포맷 + non-digit 입력 제거
  function formatPrice(n: number): string {
    return n > 0 ? n.toLocaleString('ko-KR') : '';
  }
  function parsePrice(s: string): number {
    const digits = s.replace(/[^\d]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  }

  /**
   * Procedure (real BE) 를 form item 으로 매핑.
   * - 가격: priceMin/priceMax 가 KRW (raw) → 만원 단위로 변환 (form 은 만원 입력 기준).
   * - 이름: i18n.ko.title (sourceLocale fallback) / zh-CN 동일.
   * - 비어있는 row 가 있으면 거기를 채움, 없으면 신규 row 추가.
   */
  function addFromCatalog(p: Procedure) {
    const ko = pickI18n(p.i18n, 'ko', p.sourceLocale)?.content.title ?? '';
    const zh = pickI18n(p.i18n, 'zh-CN', p.sourceLocale)?.content.title ?? '';
    const midKrw = Math.round((p.priceMin + p.priceMax) / 2);
    const midMan = Math.round(midKrw / 10000);
    setItems(prev => {
      const hasEmpty = prev.some(i => !i.name.trim());
      if (hasEmpty) {
        return prev.map((item, idx) =>
          idx === prev.findIndex(i => !i.name.trim())
            ? { name: ko, nameZh: zh, price: midMan }
            : item
        );
      }
      return [...prev, { name: ko, nameZh: zh, price: midMan }];
    });
    setShowCatalog(false);
  }

  const canSend =
    totalPrice > 0 &&
    recoveryDays > 0 &&
    items.some(i => i.name.trim()) &&
    balance >= CREDIT_COST;

  function handleSend() {
    if (sending) return;
    if (balance < CREDIT_COST) {
      showToast(`크레딧이 부족합니다. 현재 잔액: ${balance}개`, 'error');
      return;
    }
    createMutation.mutate(
      {
        concernId,
        body: {
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
        },
      },
      {
        onSuccess: () => {
          // BE 가 차감 + 거래기록 작성. mutation onSuccess 가 credits cache invalidate → 잔액 자동 갱신.
          showToast(`제안서가 발송되었습니다. 크레딧 ${CREDIT_COST}개 차감.`, 'success');
          onSuccess?.();
          onClose();
        },
        onError: (err) => {
          showToast(toUserMessage(err, '제안서 발송에 실패했습니다.'), 'error');
        },
      },
    );
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
            <Button variant="primary" onClick={handleSend} disabled={!canSend || sending}>
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
                      {proceduresQ.isLoading ? (
                        <p className="catalog-empty">시술 목록을 불러오는 중...</p>
                      ) : publishedProcedures.length === 0 ? (
                        <div className="catalog-empty">
                          <p className="mb-1">공개된 시술이 없습니다.</p>
                          <Link
                            href="/treatments"
                            className="text-[var(--text-xs)] text-[var(--color-primary)] hover:underline"
                          >
                            시술 관리에서 등록하기 →
                          </Link>
                        </div>
                      ) : (
                        publishedProcedures.map(p => {
                          const koTitle = pickI18n(p.i18n, 'ko', p.sourceLocale)?.content.title || '(제목 없음)';
                          const minMan = Math.round(p.priceMin / 10000);
                          const maxMan = Math.round(p.priceMax / 10000);
                          const priceLabel = minMan === maxMan ? `${minMan}만` : `${minMan}~${maxMan}만`;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              className="catalog-item"
                              onClick={() => addFromCatalog(p)}
                            >
                              <span className="font-medium">{koTitle}</span>
                              <span className="text-[var(--text-disabled)] ml-2 text-xs">{priceLabel}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={addItem}>+ 직접 추가</Button>
              </div>
            }
          />
          {/* 각 시술 항목 카드 — 시술명 헤더 + 가격 풀폭 */}
          <div className="flex flex-col gap-3 mt-4">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-3 p-3 rounded-[var(--app-radius)] bg-[var(--surface-subdued)] border border-[var(--border-subdued)]"
              >
                {/* 카드 헤더: 시술명 input 풀폭 */}
                <input
                  type="text"
                  placeholder="시술명 (한국어)"
                  value={item.name}
                  onChange={e => updateItem(idx, 'name', e.target.value)}
                  className="input-field"
                />

                {/* 가격 row: 좌측 휴지통 ghost / 우측 가격 input + 만원 */}
                <div className="flex items-center justify-between">
                  {items.length > 1 ? (
                    <button
                      type="button"
                      aria-label="항목 삭제"
                      className="w-8 h-8 flex items-center justify-center rounded-[var(--app-radius-sm)] bg-transparent border-0 text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] cursor-pointer transition-colors"
                      onClick={() => removeItem(idx)}
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <div className="w-8 h-8" aria-hidden />
                  )}
                  <div className="flex items-baseline gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formatPrice(item.price)}
                      onChange={e => updateItem(idx, 'price', parsePrice(e.target.value))}
                      className="propose-item-price-input"
                    />
                    <span className="text-[var(--text-sm)] text-[var(--text-subdued)]">만원</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 총 비용 — 시술 항목 합계 자동 동기화 / 사용자 입력 시 override */}
        <Card padding="md">
          <SectionHeader
            title="총 비용"
            subtitle={
              totalDirty
                ? `자동 합계와 다름 (합계 ${formatPrice(itemsSum)}만원)`
                : '시술 항목 합계가 자동 반영됩니다 (직접 수정 가능)'
            }
            action={
              totalDirty ? (
                <button
                  type="button"
                  className="text-[var(--text-xs)] font-medium text-[var(--interactive-default)] hover:underline cursor-pointer bg-transparent border-0 p-0"
                  onClick={() => setTotalDirty(false)}
                >
                  자동 합계로 되돌리기
                </button>
              ) : undefined
            }
          />
          <div className="propose-total-row mt-4">
            <span className="propose-total-label">총 예상 비용</span>
            <div className="flex items-baseline gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={formatPrice(totalPrice)}
                onChange={e => {
                  setTotalPrice(parsePrice(e.target.value));
                  setTotalDirty(true);
                }}
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
