'use client';

import { Editor } from '@tinymce/tinymce-react';
import { marked } from 'marked';
import { useMemo, useRef } from 'react';
import { uploadArticleImage, validateImageFile, translateUploadError } from '@/lib/api/admin-uploads';

/**
 * body 가 markdown 형식이면 HTML 로 변환.
 * 휴리스틱: HTML tag (`<p>`, `<h1>`, `<div>` 등) 로 시작하면 HTML, 그 외엔 markdown 으로 간주.
 *
 * 기존 articles seed (006a/006b) 가 markdown/plain 으로 저장되어 있고, 신규 입력은
 * TinyMCE HTML output. round-trip 시 첫 load 만 변환, 이후 저장은 HTML 그대로.
 */
function ensureHtml(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.startsWith('<')) return value;
  // marked.parse 는 sync (extensions 없을 때). string 단언.
  return marked.parse(value, { async: false }) as string;
}

/**
 * TinyMCE Cloud 기반 본문 에디터.
 *
 * - HTML output (article_translations.body 에 그대로 저장)
 * - 인라인 이미지: TinyMCE images_upload_handler → admin BE presign → R2 PUT → publicUrl
 * - 4 lang 탭 마다 별도 instance (탭 전환 시 mount/unmount)
 * - API key: NEXT_PUBLIC_TINYMCE_API_KEY (apps/bo/.env.local + Vercel env)
 */
interface Props {
  value: string;
  onChange: (html: string) => void;
  /** 비활성 시 readonly 표시. */
  disabled?: boolean;
}

const TINY_API_KEY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY ?? '';

export function ArticleBodyEditor({ value, onChange, disabled = false }: Props) {
  const editorRef = useRef<unknown>(null);
  // 첫 load 만 markdown → HTML 변환. 이후 onEditorChange 가 HTML 만 흘러서 재변환 X.
  const initialValue = useMemo(() => ensureHtml(value), [value]);

  if (!TINY_API_KEY) {
    return (
      <div style={{
        padding: 16, borderRadius: 8, border: '1px solid var(--color-danger-soft)', background: 'var(--color-danger-soft)',
        color: 'var(--color-danger)', fontSize: 13,
      }}>
        TinyMCE API key 미설정 — <code>apps/bo/.env.local</code> 에 <code>NEXT_PUBLIC_TINYMCE_API_KEY</code> 추가 필요
      </div>
    );
  }

  return (
    <Editor
      apiKey={TINY_API_KEY}
      // initialValue 만 사용 — `value` controlled 모드는 IME 한글 입력 시 cursor jump 문제 일으킴.
      // 첫 mount 시 markdown → HTML 변환된 값 주입, 이후 onEditorChange 로만 동기화.
      initialValue={initialValue}
      disabled={disabled}
      onEditorChange={(html) => onChange(html)}
      onInit={(_evt, editor) => { editorRef.current = editor; }}
      init={{
        height: 480,
        menubar: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
          'preview', 'anchor', 'searchreplace', 'visualblocks', 'code',
          'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount',
        ],
        toolbar:
          'undo redo | blocks | bold italic underline | ' +
          'alignleft aligncenter alignright | ' +
          'bullist numlist outdent indent | link image | ' +
          'removeformat | code preview',
        content_style: [
          'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 14px; }',
          // 업로드/인라인 이미지가 에디터 width 초과 시 스크롤 발생 방지 — 에디터 안에서 자동 축소.
          // 저장된 HTML 의 <img> 태그는 그대로. FO 표시는 FO 측 CSS 별도 책임.
          'img { max-width: 100%; height: auto; display: block; }',
        ].join(' '),
        // 한국어 입력 정합 (chrome IME)
        browser_spellcheck: true,
        // 인라인 이미지 업로드 — R2 presign 흐름
        images_upload_handler: async (blobInfo: { blob: () => Blob; filename: () => string }) => {
          const blob = blobInfo.blob();
          const file = new File([blob], blobInfo.filename(), { type: blob.type });
          const v = validateImageFile(file);
          if (!v.ok) throw new Error(v.error);
          try {
            return await uploadArticleImage(file);
          } catch (e: unknown) {
            throw new Error(translateUploadError(e));
          }
        },
        // 외부 URL 이미지 paste 도 허용 (타 사이트 이미지 인용)
        paste_data_images: true,
        // 자동 saving · session 복원은 기본 제공 (autosave 안 켬 — 명시 저장 버튼 사용)
      }}
    />
  );
}
