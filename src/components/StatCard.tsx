type Props = {
  label: string;
  value: string | number;
  subtitle?: string;
  accent?: boolean;
};

export function StatCard({ label, value, subtitle, accent = false }: Props) {
  return (
    <div
      style={{
        background: accent ? '#1a1a2e' : '#fff',
        color: accent ? '#fff' : '#1a1a2e',
        border: `1px solid ${accent ? '#1a1a2e' : '#e5e7eb'}`,
        borderRadius: '12px',
        padding: '20px 24px',
        minWidth: '140px',
      }}
    >
      <div style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
      {subtitle && (
        <div style={{ fontSize: '0.8rem', opacity: 0.65, marginTop: 4 }}>{subtitle}</div>
      )}
    </div>
  );
}
