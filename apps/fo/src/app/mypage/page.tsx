import { MOCK_USERS, MOCK_CONCERNS } from '@hyliren/shared';
import { Card, Badge, Avatar } from '@hyliren/ui';

export default function MyPage() {
  const user = MOCK_USERS.find(u => u.role === 'buyer')!;
  const concerns = MOCK_CONCERNS.filter(c => c.userId === user.id && !c.deletedAt);

  return (
    <div className="flex flex-col">
      {/* Profile */}
      <div className="flex items-center gap-4 px-4 pt-6 pb-4">
        <Avatar name={user.name} size="lg" />
        <div className="flex flex-col gap-1">
          <span className="text-xl font-bold text-[var(--color-text)]">{user.name}</span>
          <span className="text-sm text-[var(--color-text-secondary)]">{user.phone || user.email}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mx-4 mb-4 p-4 bg-[var(--color-bg-secondary)] rounded-xl">
        {[
          { value: concerns.length, label: '내 고민' },
          { value: concerns.filter(c => c.status === 'comparing' || c.status === 'proposal_received').length, label: '진행 중' },
          { value: concerns.filter(c => c.status === 'hospital_selected' || c.status === 'completed').length, label: '완료' },
        ].map(s => (
          <div key={s.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xl font-bold text-[var(--color-text)]">{s.value}</span>
            <span className="text-xs text-[var(--color-text-secondary)]">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Concerns */}
      <div className="px-4 pb-4">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">내 고민</h2>
        <div className="flex flex-col gap-3">
          {concerns.map(c => (
            <Card key={c.id} padding="sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="info">{c.bodyArea}</Badge>
                  <span className="text-sm text-[var(--color-text)]">{c.bodyAreaDetail || c.description.slice(0, 20)}</span>
                </div>
                <Badge variant={c.status === 'comparing' ? 'warning' : c.status === 'hospital_selected' ? 'success' : 'default'}>{c.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="px-4 pb-4">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">설정</h2>
        <Card padding="sm">
          <div className="flex items-center justify-between text-sm text-[var(--color-text)]">
            <span>언어</span>
            <Badge>{user.locale}</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}
