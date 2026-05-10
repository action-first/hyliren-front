/**
 * R2 storage upload — admin BE 의 `/api/v1/uploads/presign` 사용.
 * 사용 흐름:
 *   1. presign() — BE 에 PUT URL + objectKey + publicUrl 요청
 *   2. PUT 으로 R2 직접 업로드 (Content-Type 동일 헤더)
 *   3. publicUrl 을 article cover / inline image src 로 사용
 */
import { request } from './client';

export type AssetCategory = 'article_image' | 'user_avatar' | 'concern_photo' | 'proposal_image';

// BE constants.ts (libs/common/src/storage) 와 정합. BE 가 SSOT 이지만 FE 즉시 피드백 위해 동일 값 미러링.
const ALLOWED_IMAGE_MIME: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/** FE pre-validation — BE 400 영문 메시지 도달 전에 한국어로 즉시 거부. */
export function validateImageFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_IMAGE_MIME.includes(file.type)) {
    return { ok: false, error: '이미지 형식이 올바르지 않습니다. (jpg, png, webp만 가능)' };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { ok: false, error: `파일 크기가 너무 큽니다. (최대 ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB)` };
  }
  return { ok: true };
}

/**
 * BE BadRequestException 영문 메시지 → 한국어 매핑.
 * 우회 케이스 또는 정책 변경으로 BE 만 거부 시 fallback.
 */
export function translateUploadError(e: unknown): string {
  const msg = e instanceof Error ? e.message : '';
  if (/is not allowed/i.test(msg)) return '이미지 형식이 올바르지 않습니다. (jpg, png, webp만 가능)';
  if (/exceeds the limit/i.test(msg)) return '파일 크기가 너무 큽니다. (최대 10MB)';
  if (/R2 업로드 실패|publicUrl 미발급/.test(msg)) return msg;
  return msg || '업로드 실패';
}

interface PresignResponse {
  uploadUrl: string;
  method: 'PUT';
  objectKey: string;
  publicUrl: string | null;
  expiresAt: string;
}

interface PresignParams {
  category: AssetCategory;
  filename: string;
  contentType: string;
  size: number;
}

export async function presignUpload(params: PresignParams): Promise<PresignResponse> {
  return request<PresignResponse>('/api/v1/uploads/presign', {
    method: 'POST',
    body: params,
  });
}

/**
 * 파일을 R2 에 업로드하고 publicUrl 을 반환.
 * article cover image / TinyMCE 인라인 이미지 모두 동일 helper 사용.
 */
export async function uploadArticleImage(file: File): Promise<string> {
  const presign = await presignUpload({
    category: 'article_image',
    filename: file.name,
    contentType: file.type,
    size: file.size,
  });
  const putRes = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(`R2 업로드 실패 (${putRes.status})`);
  }
  if (!presign.publicUrl) {
    throw new Error('publicUrl 미발급 — 이미지는 public bucket 이어야 함');
  }
  return presign.publicUrl;
}
