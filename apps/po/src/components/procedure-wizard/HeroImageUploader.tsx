'use client';

import { useRef, useState } from 'react';
import { uploadProcedureImage, validateImageFile, translateUploadError } from '@/lib/api/uploads';

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
}

/**
 * Hero image 단일 업로드 — click. R2 PUT 후 publicUrl 저장.
 * BO `CoverImageUploader` 패턴 그대로 — presign → R2 PUT → publicUrl.
 */
export function HeroImageUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(file: File) {
    const v = validateImageFile(file);
    if (!v.ok) {
      setErr(v.error);
      return;
    }
    setUploading(true);
    setErr(null);
    try {
      const url = await uploadProcedureImage(file);
      onChange(url);
    } catch (e: unknown) {
      setErr(translateUploadError(e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {value ? (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
          <img
            src={value}
            alt="hero"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-default)', display: 'block' }}
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{
              position: 'absolute', top: 6, right: 6,
              width: 26, height: 26, borderRadius: '50%', border: 0,
              background: 'rgba(0,0,0,0.6)', color: 'var(--surface-default)', cursor: 'pointer',
              fontSize: 14, lineHeight: 1,
            }}
            aria-label="삭제"
          >×</button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            width: '100%', aspectRatio: '16 / 9', borderRadius: 8,
            border: '2px dashed var(--border-strong)', background: 'var(--surface-subdued)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: uploading ? 'wait' : 'pointer',
            color: 'var(--text-subdued)', fontSize: 13,
          }}
        >
          {uploading ? '업로드 중…' : '+ 대표 이미지 선택 (16:9)'}
        </button>
      )}
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
      {err && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-danger)' }}>{err}</div>}
    </div>
  );
}
