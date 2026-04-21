'use client';

/**
 * 스켈레톤 UI 컴포넌트 — BO/PO 공통
 * 페이지 전환 시 즉시 표시되어 로딩 피드백 제공
 */

const shimmer = `
@keyframes skeleton-shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
`;

function Bone({ width, height, radius = 6, style }: {
  width?: number | string; height?: number | string; radius?: number; style?: React.CSSProperties;
}) {
  return (
    <>
      <style>{shimmer}</style>
      <div style={{
        width: width ?? '100%', height: height ?? 14, borderRadius: radius,
        background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%)',
        backgroundSize: '800px 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
        ...style,
      }} />
    </>
  );
}

/** 목록 페이지 스켈레톤 — 검색 패널 + 결과 바 + 테이블 행 */
export function ListPageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 검색 패널 */}
      <div style={{
        background: '#fff', borderRadius: 10, padding: '20px 24px',
        border: '1px solid #f1f5f9',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Bone width="25%" height={34} />
          <Bone width="15%" height={34} />
          <Bone width="15%" height={34} />
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <Bone height={34} />
          <Bone width={80} height={34} />
          <Bone width={80} height={34} />
        </div>
      </div>

      {/* 결과 바 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' }}>
        <Bone width={120} height={16} />
        <Bone width={100} height={32} radius={6} />
      </div>

      {/* 테이블 */}
      <div style={{
        background: '#fff', borderRadius: 8, border: '1px solid #f1f5f9', overflow: 'hidden',
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', gap: 16, padding: '10px 14px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
          {[60, 100, 180, 80, 80, 70].map((w, i) => (
            <Bone key={i} width={w} height={12} />
          ))}
        </div>
        {/* 행 */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '10px 14px', borderBottom: '1px solid #f8fafc' }}>
            {[60, 100, 180, 80, 80, 70].map((w, j) => (
              <Bone key={j} width={w} height={14} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** 대시보드 스켈레톤 — KPI 카드 + 차트 */
export function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            background: '#fff', borderRadius: 14, padding: '16px 20px',
            border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <Bone width={36} height={36} radius={9} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Bone width={60} height={10} />
              <Bone width={80} height={22} />
            </div>
          </div>
        ))}
      </div>
      {/* 차트 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[1, 2].map(i => (
          <div key={i} style={{
            background: '#fff', borderRadius: 16, padding: 24,
            border: '1px solid #f1f5f9',
          }}>
            <Bone width={120} height={16} style={{ marginBottom: 8 }} />
            <Bone width={80} height={12} style={{ marginBottom: 20 }} />
            <Bone height={200} radius={8} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 모바일 카드 목록 스켈레톤 — FO 공통 */
export function MobileCardListSkeleton({ count = 3, padding = '20px 16px' }: { count?: number; padding?: string }) {
  return (
    <div style={{ padding, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{shimmer}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          background: '#fff', borderRadius: 16, padding: 16,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%)',
              backgroundSize: '800px 100%',
              animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
            }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Bone width="55%" height={14} />
              <Bone width="85%" height={10} />
              <Bone width="35%" height={10} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 상세 페이지 스켈레톤 — 2열 레이아웃 */
export function DetailPageSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
      {/* 좌측 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1, 2].map(i => (
          <div key={i} style={{
            background: '#fff', borderRadius: 10, padding: '20px 24px',
            border: '1px solid #f1f5f9',
          }}>
            <Bone width={140} height={16} style={{ marginBottom: 16 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[1, 2, 3].map(j => (
                <div key={j} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Bone width={50} height={10} />
                  <Bone width={90} height={14} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* 우측 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          background: '#fff', borderRadius: 10, padding: '20px 24px',
          border: '1px solid #f1f5f9',
        }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 4 ? '1px solid #f8fafc' : 'none' }}>
              <Bone width={60} height={12} />
              <Bone width={80} height={14} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
