import Link from 'next/link';
import { MOCK_CONCERNS } from '@hyliren/shared';
import { Card, Badge, SectionHeader } from '@hyliren/ui';
import { POSidebar } from '@/components/POSidebar';

export default function ConcernListPage() {
  const concerns = MOCK_CONCERNS
    .filter(c => c.status !== 'draft' && c.status !== 'cancelled' && !c.deletedAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="po-layout">
      <POSidebar active="/concerns" />
      <div className="po-main">
        <div className="po-topbar">
          <span className="po-topbar-title">고민 리스트</span>
        </div>
        <div className="po-content">
          <SectionHeader title={`${concerns.length}건의 고민`} subtitle="고민을 확인하고 제안서를 보내세요" />

          <Card padding="sm" className="data-table-wrapper" style={{ marginTop: 'var(--space-4)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>부위</th>
                  <th>상세</th>
                  <th>고민 내용</th>
                  <th>예산</th>
                  <th>방문 시기</th>
                  <th>여권</th>
                  <th>상태</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {concerns.map(c => (
                  <tr key={c.id}>
                    <td><Badge variant="info">{c.bodyArea}</Badge></td>
                    <td>{c.bodyAreaDetail || '-'}</td>
                    <td style={{ maxWidth: '16rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.description}
                    </td>
                    <td>{c.budgetMin}~{c.budgetMax}만</td>
                    <td>{c.visitDateFrom ? `${c.visitDateFrom.slice(5)} ~ ${c.visitDateTo?.slice(5)}` : '-'}</td>
                    <td>{c.hasPassport ? '✓' : '-'}</td>
                    <td><Badge>{c.status}</Badge></td>
                    <td>
                      <Link href={`/concerns/${c.id}`} className="data-table-link">상세</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
