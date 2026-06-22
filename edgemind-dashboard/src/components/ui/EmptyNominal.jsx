export default function EmptyNominal({ message = 'System Nominal — no anomalies detected' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      padding: '32px 16px',
      color: 'var(--color-text-tertiary)',
    }}>
      <span style={{ fontSize: 28, color: 'var(--color-success)' }}>✓</span>
      <span style={{ fontSize: 13 }}>{message}</span>
    </div>
  )
}
