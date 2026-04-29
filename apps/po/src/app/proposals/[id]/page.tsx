'use client';

import { useEffect, useState, use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { PROPOSAL_STATUS_BADGE, PROPOSAL_STATUS_KR } from '@hyliren/shared';
import { AdminPage, Badge, Spinner } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';
import { ProposalDetailView } from '@/components/concerns/ProposalDetailView';
import { getConcern, type ConcernDetailWire } from '@/lib/api/concern';
import { listMyProposals, type ProposalDetailWire } from '@/lib/api/proposal';
import { ApiError } from '@/lib/api/errors';
import { useLocaleStore } from '@/store/locale';

function StatusBadge({ label }: { label: string }) {
  const c = PROPOSAL_STATUS_BADGE[label];
  if (!c) return <Badge>{label}</Badge>;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[var(--text-xs)] font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full opacity-50" style={{ background: c.text }} />
      {label}
    </span>
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProposalDetailPage({ params }: Props) {
  const router = useRouter();
  const { id } = use(params);
  const t = useLocaleStore(s => s.t);
  const [proposal, setProposal] = useState<ProposalDetailWire | null>(null);
  const [concern, setConcern] = useState<ConcernDetailWire | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);

  useEffect(() => {
    listMyProposals()
      .then(async (data) => {
        const found = data.proposals.find(p => p.id === id);
        if (!found) {
          setNotFoundError(true);
          setLoading(false);
          return;
        }
        setProposal(found);
        try {
          setConcern(await getConcern(found.concernId));
        } catch (err) {
          if (!(err instanceof ApiError && err.status === 404)) {
            throw err;
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AdminPage
        sidebar={<POSidebar active="/activity" />}
        title={t('po.proposalDetailTitle')}
        prefix="po"
        onBack={() => router.back()}
      >
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      </AdminPage>
    );
  }

  if (notFoundError || !proposal) {
    notFound();
  }

  const statusLabel = PROPOSAL_STATUS_KR[proposal.status] ?? proposal.status;
  const concernLabel = concern
    ? `${concern.primaryArea} ${concern.bodyAreaDetail ?? ''}`.trim()
    : '';
  const title = concernLabel
    ? t('po.proposalDetailTitleConcern', { concern: concernLabel })
    : t('po.proposalDetailTitle');

  return (
    <AdminPage
      sidebar={<POSidebar active="/activity" />}
      title={title}
      prefix="po"
      onBack={() => router.back()}
      actions={<StatusBadge label={statusLabel} />}
    >
      <div className="max-w-[640px] mx-auto">
        <ProposalDetailView proposal={proposal} />
      </div>
    </AdminPage>
  );
}
