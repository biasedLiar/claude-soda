import { useState, useRef } from 'react';

type Props = { text: string; children: React.ReactNode };

export function Tooltip({ text, children }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  function handleMouseEnter() {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ x: rect.left + rect.width / 2, y: rect.top });
    }
  }

  return (
    <span ref={ref} className="tooltip-wrap" onMouseEnter={handleMouseEnter} onMouseLeave={() => setPos(null)}>
      {children}
      {pos && (
        <span
          className="tooltip-body"
          style={{ position: 'fixed', left: pos.x, top: pos.y - 8, transform: 'translate(-50%, -100%)' }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
