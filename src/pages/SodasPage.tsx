import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SortableTable } from '../components/SortableTable';
import { ColorBadge } from '../components/ColorBadge';
import { allSodasSummary } from '../lib/stats';
import { db, pct, rating } from '../lib/data';
import type { SodaStats } from '../lib/types';

const allSodas = allSodasSummary(db);
const colors = ['All', ...Array.from(new Set(db.sodas.map((s) => s.color))).sort()];

export function SodasPage() {
  const navigate = useNavigate();
  const [colorFilter, setColorFilter] = useState('All');

  const filtered = colorFilter === 'All' ? allSodas : allSodas.filter((s) => s.soda.color === colorFilter);

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem', fontWeight: 800, color: '#1a1a2e' }}>Sodas</h1>
      <p style={{ margin: '0 0 20px', color: '#6b7280' }}>{db.sodas.length} sodas across all competitions</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => setColorFilter(c)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: `1px solid ${colorFilter === c ? '#1a1a2e' : '#e5e7eb'}`,
              background: colorFilter === c ? '#1a1a2e' : '#fff',
              color: colorFilter === c ? '#fff' : '#374151',
              fontWeight: colorFilter === c ? 600 : 400,
              fontSize: '0.85rem',
              cursor: 'pointer',
              textTransform: c === 'All' ? 'none' : 'capitalize',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <SortableTable<SodaStats>
          rowKey={(r) => r.soda.id}
          defaultSort="avgTaste"
          defaultDir="desc"
          onRowClick={(r) => navigate(`/sodas/${r.soda.id}`)}
          data={filtered}
          columns={[
            {
              key: 'name',
              label: 'Soda',
              render: (r) => <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{r.soda.name}</span>,
              sortValue: (r) => r.soda.name,
            },
            {
              key: 'color',
              label: 'Color',
              render: (r) => <ColorBadge color={r.soda.color} />,
              sortValue: (r) => r.soda.color,
            },
            {
              key: 'appearances',
              label: 'Events',
              align: 'right',
              render: (r) => r.appearances,
              sortValue: (r) => r.appearances,
            },
            {
              key: 'avgTaste',
              label: 'Avg Taste',
              align: 'right',
              render: (r) => <span style={{ fontWeight: 700, color: '#d97706' }}>★ {rating(r.avgTaste)}</span>,
              sortValue: (r) => r.avgTaste,
            },
            {
              key: 'correctRate',
              label: 'ID Rate',
              align: 'right',
              render: (r) => (
                <span style={{ fontWeight: 700, color: r.correctRate >= 0.2 ? '#059669' : '#dc2626' }}>
                  {r.totalGuesses > 0 ? pct(r.correctRate) : '—'}
                </span>
              ),
              sortValue: (r) => r.correctRate,
            },
          ]}
        />
      </div>
    </div>
  );
}
