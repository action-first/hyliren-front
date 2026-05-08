/**
 * R2 storage upload — admin BE 의 `/api/v1/uploads/presign` 사용.
 * 사용 흐름:
 *   1. presign() — BE 에 PUT URL + objectKey + publicUrl 요청
 *   2. PUT 으로 R2 직접 업로드 (Content-Type 동일 헤더)
 *   3. publicUrl 을 article cover / inline image src 로 사용
 */
import { request } from './client';

export type AssetCategory = 'article_image' | 'user_avatar' | 'concern_photo' | 'proposal_image';

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
