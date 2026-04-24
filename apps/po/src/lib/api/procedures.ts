/**
 * Procedure API client — PO wizard 에서 사용.
 * 모든 호출은 ?memberId=... 로 소유권 식별 (현재 인증 미구현, 런칭 전 교체 예정).
 */
import type {
  Procedure, ProcedureVariant, ProcedureStatus,
} from '@hyliren/shared';
import type {
  CreateProcedureInput, UpdateProcedureInput,
  VariantInput, UpdateVariantInput,
} from '@/app/api/procedures/schema';

interface ProceduresListResp {
  procedures: Procedure[];
  total: number;
}
interface ProcedureDetailResp {
  procedure: Procedure;
  variants: ProcedureVariant[];
}

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

export const proceduresApi = {
  list: async (params: { memberId: string; status?: ProcedureStatus }) => {
    const qs = new URLSearchParams({ memberId: params.memberId });
    if (params.status) qs.set('status', params.status);
    return handle<ProceduresListResp>(await fetch(`/api/procedures?${qs}`));
  },

  get: async (id: string, memberId: string) => {
    const qs = new URLSearchParams({ memberId });
    return handle<ProcedureDetailResp>(await fetch(`/api/procedures/${id}?${qs}`));
  },

  create: async (body: CreateProcedureInput) => {
    return handle<{ ok: true; procedure: Procedure; variants: ProcedureVariant[] }>(
      await fetch('/api/procedures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
  },

  update: async (id: string, memberId: string, body: UpdateProcedureInput) => {
    const qs = new URLSearchParams({ memberId });
    return handle<{ ok: true; procedure: Procedure }>(
      await fetch(`/api/procedures/${id}?${qs}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
  },

  softDelete: async (id: string, memberId: string) => {
    const qs = new URLSearchParams({ memberId });
    return handle<{ ok: true; procedure: Procedure }>(
      await fetch(`/api/procedures/${id}?${qs}`, { method: 'DELETE' }),
    );
  },

  addVariant: async (procedureId: string, memberId: string, body: VariantInput) => {
    const qs = new URLSearchParams({ memberId });
    return handle<{ ok: true; variant: ProcedureVariant }>(
      await fetch(`/api/procedures/${procedureId}/variants?${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
  },

  updateVariant: async (
    procedureId: string, variantId: string, memberId: string, body: UpdateVariantInput,
  ) => {
    const qs = new URLSearchParams({ memberId });
    return handle<{ ok: true; variant: ProcedureVariant }>(
      await fetch(`/api/procedures/${procedureId}/variants/${variantId}?${qs}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
  },

  removeVariant: async (procedureId: string, variantId: string, memberId: string) => {
    const qs = new URLSearchParams({ memberId });
    return handle<{ ok: true }>(
      await fetch(`/api/procedures/${procedureId}/variants/${variantId}?${qs}`, {
        method: 'DELETE',
      }),
    );
  },
};
