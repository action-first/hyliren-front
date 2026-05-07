export default function Loading() {
  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          background: '#fff', borderRadius: 12, padding: 20,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          <div style={{ width: '60%', height: 14, background: '#f1f5f9', borderRadius: 6, marginBottom: 12 }} />
          <div style={{ width: '90%', height: 10, background: '#f1f5f9', borderRadius: 6, marginBottom: 8 }} />
          <div style={{ width: '40%', height: 10, background: '#f1f5f9', borderRadius: 6 }} />
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }`}</style>
    </div>
  );
}
