'use client';

import { useRef } from 'react';
import { Camera, X, User, ScanFace } from 'lucide-react';

interface PhotoUploaderProps {
  photos: string[];
  onAdd: (url: string) => void;
  onRemove: (index: number) => void;
}

const SLOTS = [
  { label: '정면', icon: User, guide: '얼굴 정면을 촬영해주세요' },
  { label: '측면', icon: ScanFace, guide: '45도 측면을 촬영해주세요' },
  { label: '확대', icon: Camera, guide: '고민 부위를 가까이 촬영해주세요' },
] as const;

export function PhotoUploader({ photos, onAdd, onRemove }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingSlot = useRef(0);

  function handleSlotClick(index: number) {
    if (photos[index]) return; // already filled
    pendingSlot.current = index;
    inputRef.current?.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Mock: create object URL (real impl → upload to S3)
    const url = URL.createObjectURL(file);
    onAdd(url);
    e.target.value = '';
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        {SLOTS.map((slot, i) => {
          const photo = photos[i];
          const Icon = slot.icon;

          return (
            <div key={i} className="relative">
              {photo ? (
                /* Filled slot */
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[var(--color-bg-secondary)]">
                  <img src={photo} alt={slot.label} className="w-full h-full object-cover" />
                  <button
                    onClick={() => onRemove(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center border-0 cursor-pointer">
                    <X size={14} className="text-white" />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/40 text-[10px] text-white font-medium">
                    {slot.label}
                  </span>
                </div>
              ) : (
                /* Empty slot */
                <button
                  onClick={() => handleSlotClick(i)}
                  className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[var(--color-text-dim)]">
                    <Icon size={20} strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">{slot.label}</span>
                  <span className="text-[9px] text-[var(--color-text-dim)] px-2 text-center leading-tight">{slot.guide}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Trust message */}
      <div className="flex items-center gap-1.5 px-1">
        <div className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
          <span className="text-[8px] text-emerald-600">🔒</span>
        </div>
        <span className="text-[11px] text-[var(--color-text-dim)]">
          사진은 병원 외 공개되지 않으며, 익명으로 처리됩니다
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
