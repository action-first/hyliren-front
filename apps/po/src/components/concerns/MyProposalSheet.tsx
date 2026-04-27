'use client';

import { useEffect, useState } from 'react';
import { SideSheet, Spinner } from '@hyliren/ui';

import { findMyProposalByConcern, type ProposalDetailWire } from '@/lib/api/proposal';
import { ApiError } from '@/lib/api/errors';
import { ProposalDetailView } from './ProposalDetailView';

interface MyProposalSheetProps {
  /** 본인 제안서를 조회할 concern id. */
  concernId: string;
  open: boolean;
  onClose: () => void;
}

export function MyProposalSheet({ concernId, open, onClose }: MyProposalSheetProps) {
  const [proposal, setProposal] = useState<ProposalDetailWire | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!open) {
      setProposal(null);
      setNotFound(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    findMyProposalByConcern(concernId)
      .then(p => {
        if (cancelled) return;
        if (!p) {
          setNotFound(true);
        } else {
          setProposal(p);
        }
      })
      .catch(err => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, concernId]);

  return (
    <SideSheet open={open} onClose={onClose} width="lg" title="내 제안서">
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      )}

      {!loading && notFound && (
        <div className="text-center py-16">
          <p className="text-[var(--text-base)] text-[var(--text-subdued)]">
            아직 발송한 제안서가 없습니다.
          </p>
        </div>
      )}

      {!loading && proposal && <ProposalDetailView proposal={proposal} />}
    </SideSheet>
  );
}
