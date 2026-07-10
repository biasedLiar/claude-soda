import { useState, useEffect } from 'react';
import { Tooltip } from './Tooltip';

type Column<T> = {
  key: string;
  label: string;
  tooltip?: string;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => number | string;
  align?: 'left' | 'right' | 'center';
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  defaultSort?: string;
  defaultDir?: 'asc' | 'desc';
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  pageSize?: number;
};

const btnStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
  padding: '5px 12px',
  borderRadius: 4,
  border: `1px solid ${active ? 'var(--secondary)' : 'var(--border)'}`,
  background: active ? 'rgba(0, 255, 255, 0.1)' : 'transparent',
  color: disabled ? 'var(--border)' : active ? 'var(--secondary)' : 'var(--text-muted)',
  fontFamily: 'Chakra Petch, sans-serif',
  fontSize: '0.8rem',
  cursor: disabled ? 'default' : 'pointer',
  userSelect: 'none',
});

export function SortableTable<T>({ columns, data, defaultSort, defaultDir = 'desc', rowKey, onRowClick, pageSize }: Props<T>) {
  const [sortKey, setSortKey] = useState<string>(defaultSort ?? columns[0].key);
  const [dir, setDir] = useState<'asc' | 'desc'>(defaultDir);
  const [page, setPage] = useState(0);

  useEffect(() => { setPage(0); }, [sortKey, dir]);

  function handleSort(key: string) {
    if (key === sortKey) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setDir('desc');
    }
  }

  const col = columns.find((c) => c.key === sortKey);
  const sorted = col?.sortValue
    ? [...data].sort((a, b) => {
        const av = col.sortValue!(a);
        const bv = col.sortValue!(b);
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return dir === 'asc' ? cmp : -cmp;
      })
    : data;

  const totalPages = pageSize ? Math.ceil(sorted.length / pageSize) : 1;
  const rows = pageSize ? sorted.slice(page * pageSize, (page + 1) * pageSize) : sorted;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                onClick={() => c.sortValue && handleSort(c.key)}
                style={{
                  padding: '10px 14px',
                  textAlign: c.align ?? 'left',
                  background: 'var(--bg-lighter)',
                  borderBottom: '2px solid var(--border)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  cursor: c.sortValue ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  color: sortKey === c.key ? 'var(--secondary)' : 'var(--text-muted)',
                  fontFamily: 'Chakra Petch, sans-serif',
                }}
              >
                {c.tooltip ? (
                  <Tooltip text={c.tooltip}>
                    {c.label}
                    <span className="tooltip-icon">i</span>
                  </Tooltip>
                ) : c.label}
                {c.sortValue && sortKey === c.key && (
                  <span style={{ marginLeft: 4 }}>{dir === 'desc' ? '↓' : '↑'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              style={{
                cursor: onRowClick ? 'pointer' : 'default',
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (onRowClick) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-lighter)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.background = '';
              }}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  style={{
                    padding: '12px 14px',
                    textAlign: c.align ?? 'left',
                    verticalAlign: 'middle',
                  }}
                >
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {pageSize && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <button style={btnStyle(false, page === 0)} disabled={page === 0} onClick={() => setPage(0)}>«</button>
          <button style={btnStyle(false, page === 0)} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>‹</button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'Chakra Petch, sans-serif', minWidth: 80, textAlign: 'center' }}>
            {page + 1} / {totalPages}
          </span>
          <button style={btnStyle(false, page === totalPages - 1)} disabled={page === totalPages - 1} onClick={() => setPage((p) => p + 1)}>›</button>
          <button style={btnStyle(false, page === totalPages - 1)} disabled={page === totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</button>
        </div>
      )}
    </div>
  );
}
