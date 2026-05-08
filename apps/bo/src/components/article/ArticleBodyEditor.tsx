'use client';

import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react';
import { uploadArticleImage } from '@/lib/api/admin-uploads';

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

  if (!TINY_API_KEY) {
    return (
      <div style={{
        padding: 16, borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2',
        color: '#991b1b', fontSize: 13,
      }}>
        TinyMCE API key 미설정 — <code>apps/bo/.env.local</code> 에 <code>NEXT_PUBLIC_TINYMCE_API_KEY</code> 추가 필요
      </div>
    );
  }

  return (
    <Editor
      apiKey={TINY_API_KEY}
      value={value}
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
        content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 14px; }',
        // 한국어 입력 정합 (chrome IME)
        browser_spellcheck: true,
        // 인라인 이미지 업로드 — R2 presign 흐름
        images_upload_handler: async (blobInfo: { blob: () => Blob; filename: () => string }) => {
          const blob = blobInfo.blob();
          const file = new File([blob], blobInfo.filename(), { type: blob.type });
          const url = await uploadArticleImage(file);
          return url;
        },
        // 외부 URL 이미지 paste 도 허용 (타 사이트 이미지 인용)
        paste_data_images: true,
        // 자동 saving · session 복원은 기본 제공 (autosave 안 켬 — 명시 저장 버튼 사용)
      }}
    />
  );
}
