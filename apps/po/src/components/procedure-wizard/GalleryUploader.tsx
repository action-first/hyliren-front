'use client';

import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { uploadProcedureImage } from '@/lib/api/uploads';

interface Props {
  urls: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  addLabel: string;
}

/**
 * Gallery 멀티 업로드 — click 으로 1개씩 추가, max 한도까지.
 * BO `CoverImageUploader` 와 동일한 R2 presign → PUT 패턴, 단 멀티 슬롯 grid.
 *
 * 디자인은 기존 Step3Content gallery grid 와 정합 (5-col, aspect-square, hover × 삭제).
 */
export function GalleryUploader({ urls, onChange, max = 8, addLabel }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function removeAt(i: number) {
    onChange(urls.filter((_, idx) => idx !== i));
  }

  async function handleFile(file: File) {
    if (urls.length >= max) return;
    setUploading(true);
    setErr(null);
    try {
      const url = await uploadProcedureImage(file);
      onChange([...urls, url]);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : '업로드 실패');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {urls.map((url, i) => (
          <div
            key={i}
            className="
              relative group aspect-square rounded-md overflow-hidden
              border border-[var(--border-default)] bg-[var(--surface-subdued)]
            "
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              title="삭제"
              className="
                absolute top-1 right-1 p-1 rounded-full
                bg-black/55 text-white opacity-0 group-hover:opacity-100
                transition-opacity
              "
            >
              <X size={11} />
            </button>
          </div>
        ))}

        {urls.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="
              aspect-square rounded-md border border-dashed border-[var(--border-default)]
              flex flex-col items-center justify-center gap-1
              text-[var(--text-disabled)] hover:text-[var(--interactive-default)]
              hover:border-[var(--interactive-default)] hover:bg-[var(--color-info-soft)]
              transition-colors
              disabled:cursor-wait disabled:opacity-70
            "
          >
            {uploading ? (
              <span className="text-[var(--app-text-micro)]">업로드 중…</span>
            ) : (
              <>
                <Plus size={20} />
                <span className="text-[var(--app-text-micro)]">{addLabel}</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />

      {err && <p className="mt-2 text-[var(--text-xs)] text-[var(--color-danger)]">{err}</p>}
    </div>
  );
}
