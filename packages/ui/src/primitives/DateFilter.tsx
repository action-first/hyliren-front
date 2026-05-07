'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import type { Locale as DateFnsLocale } from 'date-fns';

export type DateRange = 'today' | '7d' | '30d' | 'custom';

export interface DateFilterLabels {
  today?: string;
  last7Days?: string;
  last30Days?: string;
  customRange?: string;
  startDate?: string;
  startDatePlaceholder?: string;
  endDate?: string;
  endDatePlaceholder?: string;
  cancel?: string;
  apply?: string;
  /** Intl.DateTimeFormat locale 코드 (예: 'ko', 'en-US', 'zh-CN', 'ja-JP'). 미지정 시 'ko'. */
  intlLocale?: string;
  /** date-fns locale (DatePicker 용). 미지정 시 ko. */
  dateLocale?: DateFnsLocale;
}

const DEFAULT_LABELS: Required<DateFilterLabels> = {
  today: '오늘',
  last7Days: '7일',
  last30Days: '30일',
  customRange: '기간 지정',
  startDate: '시작일',
  startDatePlaceholder: '시작일 선택',
  endDate: '종료일',
  endDatePlaceholder: '종료일 선택',
  cancel: '취소',
  apply: '적용',
  intlLocale: 'ko',
  dateLocale: ko,
};

export interface DateFilterProps {
  value: DateRange;
  onChange: (range: DateRange, customFrom?: Date | null, customTo?: Date | null) => void;
  className?: string;
  /** i18n 라벨. 미지정 시 한국어 기본값 사용. */
  labels?: DateFilterLabels;
}

export function DateFilter({ value, onChange, className = '', labels }: DateFilterProps) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const PRESETS: { value: DateRange; label: string }[] = [
    { value: 'today', label: l.today },
    { value: '7d', label: l.last7Days },
    { value: '30d', label: l.last30Days },
  ];
  const [showPicker, setShowPicker] = useState(false);
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowPicker(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handlePreset(range: DateRange) {
    setShowPicker(false);
    setFrom(null);
    setTo(null);
    onChange(range);
  }

  function handleCustomApply() {
    onChange('custom', from, to);
    setShowPicker(false);
  }

  const customLabel = value === 'custom' && from
    ? `${from.toLocaleDateString(l.intlLocale, { month: 'short', day: 'numeric' })}${to ? ` ~ ${to.toLocaleDateString(l.intlLocale, { month: 'short', day: 'numeric' })}` : ''}`
    : l.customRange;

  return (
    <div ref={ref} className={className} style={{ position: 'relative', display: 'inline-flex' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0, background: '#f8fafc', borderRadius: 8, padding: 3, border: '1px solid #f1f5f9' }}>
        {PRESETS.map(opt => {
          const active = value === opt.value;
          return (
            <button key={opt.value} type="button" onClick={() => handlePreset(opt.value)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '5px 12px', borderRadius: 6,
                fontSize: 12, fontWeight: active ? 600 : 500, fontFamily: 'inherit',
                background: active ? '#fff' : 'transparent',
                color: active ? '#0f172a' : '#94a3b8',
                border: active ? '1px solid #e2e8f0' : '1px solid transparent',
                boxShadow: active ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                cursor: 'pointer', transition: 'all 150ms',
              }}
            >{opt.label}</button>
          );
        })}
        <button type="button" onClick={() => setShowPicker(v => !v)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '5px 12px', borderRadius: 6,
            fontSize: 12, fontWeight: value === 'custom' ? 600 : 500, fontFamily: 'inherit',
            background: value === 'custom' ? '#fff' : 'transparent',
            color: value === 'custom' ? '#0f172a' : '#94a3b8',
            border: value === 'custom' ? '1px solid #e2e8f0' : '1px solid transparent',
            boxShadow: value === 'custom' ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
            cursor: 'pointer', transition: 'all 150ms',
          }}
        >
          <Calendar size={12} />
          {customLabel}
        </button>
      </div>

      {/* 데이트피커 팝업 */}
      {showPicker && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50,
          background: '#fff', borderRadius: 12, padding: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb',
          display: 'flex', flexDirection: 'column', gap: 14,
          minWidth: 340,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{l.customRange}</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{l.startDate}</div>
              <div className="datepicker-wrapper" style={{ width: '100%' }}>
                <DatePicker
                  selected={from}
                  onChange={(date: Date | null) => setFrom(date)}
                  dateFormat="yyyy.MM.dd"
                  placeholderText={l.startDatePlaceholder}
                  locale={l.dateLocale}
                  className="datepicker-input"
                  wrapperClassName="datepicker-full-width"
                />
              </div>
            </div>
            <span style={{ color: '#cbd5e1', fontSize: 14, marginTop: 18 }}>~</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{l.endDate}</div>
              <div className="datepicker-wrapper" style={{ width: '100%' }}>
                <DatePicker
                  selected={to}
                  onChange={(date: Date | null) => setTo(date)}
                  dateFormat="yyyy.MM.dd"
                  placeholderText={l.endDatePlaceholder}
                  locale={l.dateLocale}
                  minDate={from || undefined}
                  className="datepicker-input"
                  wrapperClassName="datepicker-full-width"
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
            <button type="button" onClick={() => setShowPicker(false)}
              style={{ padding: '6px 14px', fontSize: 13, fontFamily: 'inherit', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#64748b', cursor: 'pointer' }}
            >{l.cancel}</button>
            <button type="button" onClick={handleCustomApply} disabled={!from}
              style={{ padding: '6px 14px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', border: 'none', borderRadius: 8, background: from ? '#18181b' : '#e5e7eb', color: from ? '#fff' : '#94a3b8', cursor: from ? 'pointer' : 'default' }}
            >{l.apply}</button>
          </div>
        </div>
      )}
    </div>
  );
}
