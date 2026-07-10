const COLOR_MAP: Record<string, { bg: string; text: string; label: string }> = {
  red: { bg: 'rgba(255, 77, 109, 0.15)', text: '#ff4d6d', label: 'Red' },
  brown: { bg: 'rgba(201, 145, 90, 0.15)', text: '#c9915a', label: 'Brown' },
  green: { bg: 'rgba(57, 255, 20, 0.15)', text: '#39ff14', label: 'Green' },
  pink: { bg: 'rgba(255, 0, 110, 0.15)', text: '#ff69b4', label: 'Pink' },
  orange: { bg: 'rgba(255, 140, 0, 0.15)', text: '#ff8c00', label: 'Orange' },
};

const DEFAULT = { bg: 'rgba(160, 160, 184, 0.15)', text: '#a0a0b8', label: 'Unknown' };

export function sodaColorHex(color: string): string {
  return (COLOR_MAP[color] ?? DEFAULT).text;
}

type Props = { color: string };

export function ColorBadge({ color }: Props) {
  const style = COLOR_MAP[color] ?? DEFAULT;
  return (
    <span
      style={{
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.text}40`,
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'inline-block',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {style.label}
    </span>
  );
}
