'use client';

import { useRef } from 'react';
import type { ConcernFormData } from './page';

interface Props {
  form: ConcernFormData;
  update: (partial: Partial<ConcernFormData>) => void;
}

export function StepPhotos({ form, update }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const total = [...form.photos, ...files].slice(0, 5);
    update({ photos: total });
  }

  function removePhoto(idx: number) {
    update({ photos: form.photos.filter((_, i) => i !== idx) });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)]">사진을 올려주세요</h1>
      <p className="text-base text-[var(--color-text-secondary)] mt-2 leading-relaxed">
        고민 부위의 정면·측면 사진을 올리면 더 정확한 제안서를 받을 수 있어요
        <br />
        <span className="text-sm text-[var(--color-text-dim)]">최대 5장 · 선택사항</span>
      </p>

      <div className="grid grid-cols-3 gap-3 mt-6">
        {form.photos.map((file, idx) => (
          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-[var(--color-bg-secondary)]">
            <img src={URL.createObjectURL(file)} alt={`사진 ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white border-none text-sm flex items-center justify-center cursor-pointer"
              onClick={() => removePhoto(idx)}
            >×</button>
          </div>
        ))}

        {form.photos.length < 5 && (
          <button
            className="flex flex-col items-center justify-center gap-1 aspect-square border-2 border-dashed border-[var(--color-border)] rounded-xl bg-transparent cursor-pointer hover:border-[var(--color-primary)] transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <span className="text-2xl text-[var(--color-text-dim)]">+</span>
            <span className="text-xs text-[var(--color-text-dim)]">{form.photos.length === 0 ? '사진 추가' : '추가'}</span>
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
    </div>
  );
}
