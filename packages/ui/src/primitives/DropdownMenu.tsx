'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';

export interface DropdownMenuItem {
  /** 표시 라벨 */
  label: string;
  /** 클릭 핸들러 */
  onClick: () => void;
  /** 좌측 아이콘 (선택) */
  icon?: ReactNode;
  /** 빨강 강조 — 파괴적 액션 */
  destructive?: boolean;
  /** 비활성 */
  disabled?: boolean;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  /** 트리거 aria-label (기본 '더보기') */
  triggerLabel?: string;
  /** 트리거 아이콘 사이즈 (기본 16) */
  iconSize?: number;
  /** 메뉴 정렬 (기본 right) */
  align?: 'left' | 'right';
}

/**
 * 컴팩트 ⋮ 드롭다운 메뉴.
 * - 클릭 외부·Esc 로 닫힘
 * - 파괴적 액션은 destructive 플래그로 빨강 강조
 * - 빈 items 면 아무것도 렌더 안함 (호출자 조건 분기 불필요)
 */
export function DropdownMenu({ items, triggerLabel = '더보기', iconSize = 16, align = 'right' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-[var(--input-radius,6px)] text-[var(--text-subdued)] hover:bg-[var(--surface-subdued)] hover:text-[var(--text-default)] transition-colors cursor-pointer"
      >
        <MoreVertical size={iconSize} />
      </button>
      {open && (
        <div
          role="menu"
          className={`
            absolute top-full mt-1 min-w-[160px] py-1
            rounded-[var(--app-radius,8px)] border border-[var(--border-default)]
            bg-[var(--surface-default,#fff)] shadow-[var(--shadow-md)]
            z-[var(--z-dropdown,40)]
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                item.onClick();
                setOpen(false);
              }}
              className={`
                w-full px-3 py-2 flex items-center gap-2 text-left text-[var(--text-sm)]
                disabled:opacity-[var(--opacity-disabled)] disabled:cursor-not-allowed
                hover:bg-[var(--surface-subdued)] transition-colors cursor-pointer
                ${item.destructive
                  ? 'text-[var(--color-danger)]'
                  : 'text-[var(--text-default)]'}
              `}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
