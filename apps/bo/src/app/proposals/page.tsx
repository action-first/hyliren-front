import { getProposals } from '@hyliren/shared/src/server/data-store';
import { ProposalsClient } from './ProposalsClient';

export default function ProposalsPage() {
  const proposals = getProposals();
  return <ProposalsClient proposals={proposals} />;
}
