import { Tooltip } from './Tooltip';

type Props = {
  label: string;
  value: string | number;
  subtitle?: string;
  accent?: boolean;
  tooltip?: string;
};

export function StatCard({ label, value, subtitle, accent = false, tooltip }: Props) {
  const labelNode = tooltip ? (
    <Tooltip text={tooltip}>
      {label}
      <span className="tooltip-icon">i</span>
    </Tooltip>
  ) : label;

  return (
    <div className={accent ? 'stat-card stat-card-accent' : 'stat-card'}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        {labelNode}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.1, fontFamily: 'Russo One, sans-serif', color: accent ? 'var(--cta)' : 'var(--text)', textShadow: accent ? '0 0 12px rgba(57, 255, 20, 0.5)' : 'none' }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</div>
      )}
    </div>
  );
}
