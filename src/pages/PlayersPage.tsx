import { useNavigate } from 'react-router-dom';
import { SortableTable } from '../components/SortableTable';
import { allPlayersSummary } from '../lib/stats';
import { db, pct, rating } from '../lib/data';
import type { PlayerStats } from '../lib/types';
import { ACCURACY_TOOLTIP } from '../lib/tooltips';

const players = allPlayersSummary(db);

export function PlayersPage() {
  const navigate = useNavigate();

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem' }}>Players</h1>
      <p style={{ margin: '0 0 28px', color: 'var(--text-muted)' }}>{players.length} players across all competitions</p>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <SortableTable<PlayerStats>
          rowKey={(r) => r.player.id}
          defaultSort="accuracy"
          defaultDir="desc"
          onRowClick={(r) => navigate(`/players/${r.player.id}`)}
          data={players}
          columns={[
            {
              key: 'name',
              label: 'Player',
              render: (r) => <span style={{ fontWeight: 600, color: 'var(--text)' }}>{r.player.name}</span>,
              sortValue: (r) => r.player.name,
            },
            {
              key: 'competitionsPlayed',
              label: 'Events',
              align: 'right',
              render: (r) => r.competitionsPlayed,
              sortValue: (r) => r.competitionsPlayed,
            },
            {
              key: 'totalGuesses',
              label: 'Guesses',
              align: 'right',
              render: (r) => r.totalGuesses,
              sortValue: (r) => r.totalGuesses,
            },
            {
              key: 'accuracy',
              label: 'Accuracy',
              tooltip: ACCURACY_TOOLTIP,
              align: 'right',
              render: (r) => (
                <span style={{ fontWeight: 700, color: r.accuracy >= 0.2 ? 'var(--cta)' : 'var(--primary)' }}>
                  {pct(r.accuracy)}
                </span>
              ),
              sortValue: (r) => r.accuracy,
            },
            {
              key: 'avgTasteGiven',
              label: 'Avg Taste Given',
              align: 'right',
              render: (r) => <span style={{ color: 'var(--secondary)' }}>★ {rating(r.avgTasteGiven)}</span>,
              sortValue: (r) => r.avgTasteGiven,
            },
          ]}
        />
      </div>
    </div>
  );
}
