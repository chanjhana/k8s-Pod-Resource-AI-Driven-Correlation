export default function DegradedBanner() {
  return (
    <div style={{
      background: 'rgba(248,113,113,0.08)',
      border: '1px solid var(--color-danger-border)',
      borderRadius: 6,
      padding: '8px 12px',
      fontSize: 12,
      color: 'var(--color-danger)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <span>⚠</span>
      <span>LLM analysis unavailable — showing raw agent findings only. Check LLM_API_KEY.</span>
    </div>
  )
}
