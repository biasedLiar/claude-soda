const COLOR_MAP: Record<string, { bg: string; text: string; label: string }> = {
  red: { bg: '#fde8e8', text: '#c0392b', label: 'Red' },
  brown: { bg: '#f5ebe0', text: '#6b3a2a', label: 'Brown' },
  green: { bg: '#e8f5e9', text: '#2e7d32', label: 'Green' },
  pink: { bg: '#fce4ec', text: '#c2185b', label: 'Pink' },
  orange: { bg: '#fff3e0', text: '#e65100', label: 'Orange' },
};

const DEFAULT = { bg: '#f3f4f6', text: '#374151', label: 'Unknown' };

type Props = { color: string };

export function ColorBadge({ color }: Props) {
  const style = COLOR_MAP[color] ?? DEFAULT;
  return (
    <span
      style={{
        backgroundColor: style.bg,
        color: style.text,
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'inline-block',
      }}
    >
      {style.label}
    </span>
  );
}
