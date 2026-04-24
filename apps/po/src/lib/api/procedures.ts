/**
 * Procedure API client — PO wizard 에서 사용.
 * 컴포넌트는 Next route handler(`/api/procedures/*`)만 호출한다.
 * mock 모드 호환을 위해 memberId query 는 유지하지만 real 백엔드에서는 BFF 가 제거한다.
 */
import type {
  Procedure, ProcedureVariant, ProcedureStatus,
} from '@hyliren/shared';
import type {
  CreateProcedureInput, UpdateProcedureInput,
  VariantInput, UpdateVariantInput,
} from '@/app/api/procedures/schema';
import { partnerTokenStore } from '@/lib/auth/token-store';
import { refreshTokens } from './partner-auth';

interface ProceduresListResp {
  procedures: Procedure[];
  total: number;
}
interface ProcedureDetailResp {
  procedure: Procedure;
  variants: ProcedureVariant[];
}

function authHeaders(headers?: HeadersInit): Headers {
  const finalHeaders = new Headers(headers);
  const token = partnerTokenStore.getAccessToken();
  if (token) finalHeaders.set('Authorization', `Bearer ${token}`);
  return finalHeaders;
}

async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}, retry = true): Promise<Response> {
  const res = await fetch(input, {
    ...init,
    headers: authHeaders(init.headers),
  });

  if (res.status === 401 && retry && partnerTokenStore.getRefreshToken()) {
    try {
      await refreshTokens();
      return fetchWithAuth(input, init, false);
    } catch {
      partnerTokenStore.clearTokens();
    }
  }

  return res;
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
    return handle<ProceduresListResp>(await fetchWithAuth(`/api/procedures?${qs}`));
  },

  get: async (id: string, memberId: string) => {
    const qs = new URLSearchParams({ memberId });
    return handle<ProcedureDetailResp>(await fetchWithAuth(`/api/procedures/${id}?${qs}`));
  },

  create: async (body: CreateProcedureInput) => {
    return handle<{ ok: true; procedure: Procedure; variants: ProcedureVariant[] }>(
      await fetchWithAuth('/api/procedures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
  },

  update: async (id: string, memberId: string, body: UpdateProcedureInput) => {
    const qs = new URLSearchParams({ memberId });
    return handle<{ ok: true; procedure: Procedure }>(
      await fetchWithAuth(`/api/procedures/${id}?${qs}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
  },

  softDelete: async (id: string, memberId: string) => {
    const qs = new URLSearchParams({ memberId });
    return handle<{ ok: true; procedure: Procedure }>(
      await fetchWithAuth(`/api/procedures/${id}?${qs}`, { method: 'DELETE' }),
    );
  },

  addVariant: async (procedureId: string, memberId: string, body: VariantInput) => {
    const qs = new URLSearchParams({ memberId });
    return handle<{ ok: true; variant: ProcedureVariant }>(
      await fetchWithAuth(`/api/procedures/${procedureId}/variants?${qs}`, {
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
      await fetchWithAuth(`/api/procedures/${procedureId}/variants/${variantId}?${qs}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
  },

  removeVariant: async (procedureId: string, variantId: string, memberId: string) => {
    const qs = new URLSearchParams({ memberId });
    return handle<{ ok: true }>(
      await fetchWithAuth(`/api/procedures/${procedureId}/variants/${variantId}?${qs}`, {
        method: 'DELETE',
      }),
    );
  },
};
