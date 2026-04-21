'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Concern, ConcernPhoto } from '@hyliren/shared';

import { ApiError } from '@/lib/api/errors';
import {
  listConcerns, getConcern, createConcern, updateConcern, submitConcern,
  mapConcernListItem, mapConcernDetail, mapConcernPhoto,
} from '@/lib/api/concern';
import type { CreateConcernBody, UpdateConcernBody } from '@/lib/api/concern';

export function useMyConcerns() {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listConcerns({ limit: 50 });
      setConcerns(data.concerns.map(mapConcernListItem));
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, 'UNKNOWN', String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  return { concerns, loading, error, refetch: fetch };
}

export function useConcern(id: string) {
  const [concern, setConcern] = useState<Concern | null>(null);
  const [photos, setPhotos] = useState<ConcernPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getConcern(id)
      .then((wire) => {
        if (cancelled) { return; }
        setConcern(mapConcernDetail(wire));
        setPhotos((wire.photos ?? []).map((p) => mapConcernPhoto(p, id, wire.createdAt)));
      })
      .catch((err) => {
        if (cancelled) { return; }
        setError(err instanceof ApiError ? err : new ApiError(0, 'UNKNOWN', String(err)));
      })
      .finally(() => {
        if (!cancelled) { setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [id]);

  return { concern, photos, loading, error };
}

export function useCreateConcern() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const create = useCallback(async (body: CreateConcernBody): Promise<{ id: string } | null> => {
    setLoading(true);
    setError(null);
    try {
      return await createConcern(body);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, 'UNKNOWN', String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}

export function useUpdateConcern(id: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const update = useCallback(async (body: UpdateConcernBody): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await updateConcern(id, body);
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, 'UNKNOWN', String(err)));
      return false;
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { update, loading, error };
}

export function useSubmitConcern(id: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const submit = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await submitConcern(id);
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, 'UNKNOWN', String(err)));
      return false;
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { submit, loading, error };
}
