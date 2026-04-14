'use client';

import { useRef } from 'react';
import { Camera, X, User, ScanFace } from 'lucide-react';

interface Props {
  photos: string[];
  onAdd: (url: string) => void;
  onRemove: (index: number) => void;
}

const SLOTS = [
  { label: '정면', icon: User, guide: '얼굴 정면' },
  { label: '측면', icon: ScanFace, guide: '45도 측면' },
  { label: '확대', icon: Camera, guide: '고민 부위' },
] as const;

export function PhotoUploadPanel({ photos, onAdd, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSlotClick(index: number) {
    if (photos[index]) return;
    inputRef.current?.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onAdd(URL.createObjectURL(file));
    e.target.value = '';
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-3 gap-2.5">
        {SLOTS.map((slot, i) => {
          const photo = photos[i];
          const Icon = slot.icon;
          return (
            <div key={i} className="relative">
              {photo ? (
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                  <img src={photo} alt={slot.label} className="w-full h-full object-cover" />
                  <button onClick={() => onRemove(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center border-0 cursor-pointer">
                    <X size={14} className="text-white" />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/40 text-[10px] text-white font-medium">
                    {slot.label}
                  </span>
                </div>
              ) : (
                <button onClick={() => handleSlotClick(i)}
                  className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[var(--color-text-dim)]">
                    <Icon size={18} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--color-text-secondary)]">{slot.label}</span>
                  <span className="text-[8.5px] text-[var(--color-text-dim)]">{slot.guide}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 px-0.5">
        <span className="text-[10px]">🔒</span>
        <span className="text-[10.5px] text-[var(--color-text-dim)]">사진은 병원 외 공개되지 않으며 익명 처리됩니다</span>
      </div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
    </div>
  );
}
