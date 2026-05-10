/**
 * R2 storage upload — partner BE 의 `/api/v1/uploads/presign` 사용.
 * BO admin-uploads.ts 와 동일 컨벤션 (presign → R2 PUT → publicUrl).
 *
 * 사용 흐름:
 *   1. presign() — BE 에 PUT URL + objectKey + publicUrl 요청
 *   2. PUT 으로 R2 직접 업로드 (Content-Type 동일 헤더)
 *   3. publicUrl 을 procedure hero / gallery image src 로 사용
 */
import { request } from './client';

export type AssetCategory = 'article_image' | 'user_avatar' | 'concern_photo' | 'proposal_image' | 'procedure_image';

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
 * 시술 hero image / gallery image 모두 동일 helper 사용.
 */
export async function uploadProcedureImage(file: File): Promise<string> {
  const presign = await presignUpload({
    category: 'procedure_image',
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
