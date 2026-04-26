/**
 * Procedure API client — direct backend 호출 (BFF 미경유).
 * memberId 는 JWT 에서 추출되므로 인자로 받지 않는다.
 * FO 의 `lib/api/procedure/` 모듈과 동일 컨벤션 (request<T> 사용).
 */
import type {
  Procedure, ProcedureVariant, ProcedureStatus,
} from '@hyliren/shared';
import type {
  CreateProcedureInput, UpdateProcedureInput,
  VariantInput, UpdateVariantInput,
} from '@/lib/api/procedures-schema';
import { request } from './client';

interface ProceduresListResp {
  procedures: Procedure[];
  total: number;
}

interface ProcedureDetailResp {
  procedure: Procedure;
  variants: ProcedureVariant[];
}

interface ProcedureMutationResp {
  procedure: Procedure;
}

interface VariantMutationResp {
  variant: ProcedureVariant;
}

const BASE = '/api/v1/procedures';

export const proceduresApi = {
  list: async (params: { status?: ProcedureStatus } = {}): Promise<ProceduresListResp> => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    const query = qs.toString();
    return request<ProceduresListResp>(`${BASE}${query ? `?${query}` : ''}`);
  },

  get: async (id: string): Promise<ProcedureDetailResp> => {
    return request<ProcedureDetailResp>(`${BASE}/${encodeURIComponent(id)}`);
  },

  create: async (body: CreateProcedureInput): Promise<ProcedureDetailResp> => {
    return request<ProcedureDetailResp>(BASE, {
      method: 'POST',
      body,
    });
  },

  update: async (id: string, body: UpdateProcedureInput): Promise<ProcedureMutationResp> => {
    return request<ProcedureMutationResp>(`${BASE}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body,
    });
  },

  softDelete: async (id: string): Promise<ProcedureMutationResp> => {
    return request<ProcedureMutationResp>(`${BASE}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  /**
   * 영구 삭제 (논리 삭제) — deletedAt 세팅. archived 상태에서만 호출 허용 (BE 가드).
   * 복구는 admin 도구로만 가능.
   */
  permanentDelete: async (id: string): Promise<void> => {
    await request<void>(`${BASE}/${encodeURIComponent(id)}/permanent`, {
      method: 'DELETE',
    });
  },

  addVariant: async (procedureId: string, body: VariantInput): Promise<VariantMutationResp> => {
    return request<VariantMutationResp>(`${BASE}/${encodeURIComponent(procedureId)}/variants`, {
      method: 'POST',
      body,
    });
  },

  updateVariant: async (
    procedureId: string, variantId: string, body: UpdateVariantInput,
  ): Promise<VariantMutationResp> => {
    return request<VariantMutationResp>(
      `${BASE}/${encodeURIComponent(procedureId)}/variants/${encodeURIComponent(variantId)}`,
      { method: 'PATCH', body },
    );
  },

  removeVariant: async (procedureId: string, variantId: string): Promise<void> => {
    await request<void>(
      `${BASE}/${encodeURIComponent(procedureId)}/variants/${encodeURIComponent(variantId)}`,
      { method: 'DELETE' },
    );
  },
};
