import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SortableTable } from '../components/SortableTable';
import { ColorBadge } from '../components/ColorBadge';
import { allSodasSummary } from '../lib/stats';
import { db, pct, rating } from '../lib/data';
import type { SodaStats } from '../lib/types';
import { ID_RATE_TOOLTIP, ADJUSTED_ID_RATE_TOOLTIP } from '../lib/tooltips';

const allSodas = allSodasSummary(db);
const colors = ['All', ...Array.from(new Set(db.sodas.map((s) => s.color))).sort()];

const sodaMap = new Map(db.sodas.map((s) => [s.id, s]));
const mistakeCounts = new Map<string, number>();
for (const g of db.guesses) {
  if (g.guessedSodaId === g.actualSodaId) continue;
  const key = `${g.actualSodaId}:${g.guessedSodaId}`;
  mistakeCounts.set(key, (mistakeCounts.get(key) ?? 0) + 1);
}
const topMistakes = [...mistakeCounts.entries()]
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)
  .map(([key, count]) => {
    const [actualId, guessedId] = key.split(':').map(Number);
    return { actual: sodaMap.get(actualId)!, guessed: sodaMap.get(guessedId)!, count };
  })
  .filter((r) => r.actual && r.guessed);

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontWeight: 700,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
  background: 'var(--bg-lighter)',
};

export function SodasPage() {
  const navigate = useNavigate();
  const [colorFilter, setColorFilter] = useState('All');

  const filtered = colorFilter === 'All' ? allSodas : allSodas.filter((s) => s.soda.color === colorFilter);

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem' }}>Sodas</h1>
      <p style={{ margin: '0 0 20px', color: 'var(--text-muted)' }}>{db.sodas.length} sodas across all competitions</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => setColorFilter(c)}
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              border: `1px solid ${colorFilter === c ? 'var(--secondary)' : 'var(--border)'}`,
              background: colorFilter === c ? 'rgba(0, 255, 255, 0.1)' : 'transparent',
              color: colorFilter === c ? 'var(--secondary)' : 'var(--text-muted)',
              fontWeight: colorFilter === c ? 600 : 400,
              fontSize: '0.8rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontFamily: 'Chakra Petch, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <SortableTable<SodaStats>
          key={colorFilter}
          rowKey={(r) => r.soda.id}
          defaultSort="avgTaste"
          defaultDir="desc"
          onRowClick={(r) => navigate(`/sodas/${r.soda.id}`)}
          data={filtered}
          pageSize={10}
          columns={[
            {
              key: 'name',
              label: 'Soda',
              render: (r) => <span style={{ fontWeight: 600, color: 'var(--text)' }}>{r.soda.name}</span>,
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
              render: (r) => <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>★ {rating(r.avgTaste)}</span>,
              sortValue: (r) => r.avgTaste,
            },
            {
              key: 'correctRate',
              label: 'ID Rate',
              tooltip: ID_RATE_TOOLTIP,
              align: 'right',
              render: (r) => (
                <span style={{ fontWeight: 700, color: r.correctRate >= 0.2 ? 'var(--cta)' : 'var(--primary)' }}>
                  {r.totalGuesses > 0 ? pct(r.correctRate) : '—'}
                </span>
              ),
              sortValue: (r) => r.correctRate,
            },
            {
              key: 'adjustedCorrectRate',
              label: 'Adjusted ID Rate',
              tooltip: ADJUSTED_ID_RATE_TOOLTIP,
              align: 'right',
              render: (r) => (
                <span style={{ fontWeight: 700, color: r.adjustedCorrectRate > 0 ? 'var(--cta)' : r.adjustedCorrectRate < 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {r.totalGuesses > 0 ? pct(r.adjustedCorrectRate) : '—'}
                </span>
              ),
              sortValue: (r) => r.adjustedCorrectRate,
            },
          ]}
        />
      </div>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Most common mistakes</h2>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ ...thStyle, textAlign: 'left' }}>Actual soda</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Guessed as</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Times</th>
              </tr>
            </thead>
            <tbody>
              {topMistakes.map((r) => (
                <tr key={`${r.actual.id}:${r.guessed.id}`} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ColorBadge color={r.actual.color} />
                    <Link to={`/sodas/${r.actual.id}`} style={{ color: 'var(--text)', fontWeight: 500 }}>{r.actual.name}</Link>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <Link to={`/sodas/${r.guessed.id}`} style={{ color: 'var(--text-muted)' }}>{r.guessed.name}</Link>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
