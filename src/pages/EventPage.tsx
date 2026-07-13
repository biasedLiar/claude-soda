import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { StatCard } from '../components/StatCard';
import { ColorBadge } from '../components/ColorBadge';
import { SortableTable } from '../components/SortableTable';
import { competitionLeaderboard, competitionSodaStats } from '../lib/stats';
import { db, formatDate, pct, rating } from '../lib/data';
import type { RankedPlayer, CompetitionSodaStat } from '../lib/types';

export function EventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const compId = Number(id);
  const competition = db.competitions.find((c) => c.id === compId);

  if (!competition) return <Navigate to="/events" replace />;

  const leaderboard = competitionLeaderboard(compId, db);
  const sodaStats = competitionSodaStats(compId, db);

  const hardest = sodaStats.filter((s) => s.guesses > 0).sort((a, b) => a.correctRate - b.correctRate)[0];
  const easiest = sodaStats.filter((s) => s.guesses > 0).sort((a, b) => b.correctRate - a.correctRate)[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <Link to="/events" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>← Events</Link>
        <h1 style={{ margin: '8px 0 4px', fontSize: '2rem' }}>{competition.name}</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{formatDate(competition.date)}</div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatCard label="Players" value={leaderboard.length} />
        <StatCard label="Sodas" value={sodaStats.length} />
        {hardest && <StatCard label="Hardest soda" value={hardest.soda.name} subtitle={`Only ${pct(hardest.correctRate)} identified it`} />}
        {easiest && hardest?.soda.id !== easiest.soda.id && (
          <StatCard label="Easiest soda" value={easiest.soda.name} subtitle={`${pct(easiest.correctRate)} identified it`} />
        )}
      </div>

      <section>
        <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Leaderboard</h2>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <SortableTable<RankedPlayer>
            rowKey={(r) => r.player.id}
            defaultSort="accuracy"
            defaultDir="desc"
            onRowClick={(r) => navigate(`/players/${r.player.id}`)}
            data={leaderboard}
            columns={[
              {
                key: 'rank',
                label: 'Rank',
                render: (r) => (
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: r.rank === 1 && leaderboard.length > 1 ? 'var(--secondary)' : 'var(--text-muted)' }}>
                    {r.rank === 1 && leaderboard.length > 1 ? '🏆' : r.rank}
                  </span>
                ),
                sortValue: (r) => r.rank,
              },
              {
                key: 'player',
                label: 'Player',
                render: (r) => (
                  <Link to={`/players/${r.player.id}`} style={{ color: 'var(--text)', fontWeight: 600 }}>
                    {r.player.name}
                  </Link>
                ),
                sortValue: (r) => r.player.name,
              },
              {
                key: 'correct',
                label: 'Correct',
                align: 'right',
                render: (r) => <span style={{ color: 'var(--text-muted)' }}>{r.correct} / {r.guesses}</span>,
                sortValue: (r) => r.correct,
              },
              {
                key: 'accuracy',
                label: 'Accuracy',
                align: 'right',
                render: (r) => (
                  <span style={{ fontWeight: 700, color: r.accuracy >= 0.2 ? 'var(--cta)' : 'var(--primary)' }}>
                    {pct(r.accuracy)}
                  </span>
                ),
                sortValue: (r) => r.accuracy,
              },
              {
                key: 'avgTaste',
                label: 'Avg Taste Given',
                align: 'right',
                render: (r) => <span style={{ color: 'var(--secondary)' }}>★ {rating(r.avgTaste)}</span>,
                sortValue: (r) => r.avgTaste,
              },
            ]}
          />
        </div>
      </section>

      <section>
        <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Sodas in this event</h2>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <SortableTable<CompetitionSodaStat>
            rowKey={(r) => r.soda.id}
            defaultSort="correctRate"
            defaultDir="desc"
            onRowClick={(r) => navigate(`/sodas/${r.soda.id}`)}
            data={sodaStats}
            columns={[
              {
                key: 'soda',
                label: 'Soda',
                render: (r) => (
                  <Link to={`/sodas/${r.soda.id}`} style={{ color: 'var(--text)', fontWeight: 600 }}>
                    {r.soda.name}
                  </Link>
                ),
                sortValue: (r) => r.soda.name,
              },
              {
                key: 'color',
                label: 'Color',
                render: (r) => <ColorBadge color={r.soda.color} />,
                sortValue: (r) => r.soda.color,
              },
              {
                key: 'guesses',
                label: 'Tasters',
                align: 'right',
                render: (r) => <span style={{ color: 'var(--text-muted)' }}>{r.guesses}</span>,
                sortValue: (r) => r.guesses,
              },
              {
                key: 'correctRate',
                label: 'Accuracy',
                align: 'right',
                render: (r) => (
                  <span style={{ fontWeight: 700, color: r.correctRate >= 0.2 ? 'var(--cta)' : 'var(--primary)' }}>
                    {r.guesses > 0 ? pct(r.correctRate) : '—'}
                  </span>
                ),
                sortValue: (r) => r.correctRate,
              },
              {
                key: 'avgTaste',
                label: 'Avg Taste',
                align: 'right',
                render: (r) => (
                  <span style={{ color: 'var(--secondary)' }}>
                    {r.avgTaste > 0 ? `★ ${rating(r.avgTaste)}` : '—'}
                  </span>
                ),
                sortValue: (r) => r.avgTaste,
              },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
