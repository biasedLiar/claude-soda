import { useState } from 'react';

type Column<T> = {
  key: string;
  label: string;
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
};

export function SortableTable<T>({ columns, data, defaultSort, defaultDir = 'desc', rowKey, onRowClick }: Props<T>) {
  const [sortKey, setSortKey] = useState<string>(defaultSort ?? columns[0].key);
  const [dir, setDir] = useState<'asc' | 'desc'>(defaultDir);

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
                  background: '#f9fafb',
                  borderBottom: '2px solid #e5e7eb',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  cursor: c.sortValue ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  color: sortKey === c.key ? '#1a1a2e' : '#6b7280',
                }}
              >
                {c.label}
                {c.sortValue && sortKey === c.key && (
                  <span style={{ marginLeft: 4 }}>{dir === 'desc' ? '↓' : '↑'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              style={{
                cursor: onRowClick ? 'pointer' : 'default',
                borderBottom: '1px solid #f3f4f6',
              }}
              onMouseEnter={(e) => {
                if (onRowClick) (e.currentTarget as HTMLTableRowElement).style.background = '#f9fafb';
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
    </div>
  );
}
