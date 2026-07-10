import { useParams, Link, Navigate } from 'react-router-dom';
import { StatCard } from '../components/StatCard';
import { ColorBadge } from '../components/ColorBadge';
import { competitionLeaderboard, competitionSodaStats } from '../lib/stats';
import { db, formatDate, pct, rating } from '../lib/data';

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontWeight: 700,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
  background: 'var(--bg-lighter)',
};

export function EventPage() {
  const { id } = useParams<{ id: string }>();
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
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ ...thStyle, textAlign: 'left' }}>Rank</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Player</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Correct</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Accuracy</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Avg Taste Given</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((r) => (
                <tr
                  key={r.player.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: r.rank === 1 ? 'rgba(0, 255, 255, 0.05)' : undefined,
                    borderLeft: r.rank === 1 ? '2px solid var(--secondary)' : undefined,
                  }}
                >
                  <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: '1.1rem', color: r.rank === 1 ? 'var(--secondary)' : 'var(--text-muted)' }}>
                    {r.rank === 1 && leaderboard.length > 1 ? '🏆' : r.rank}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <Link to={`/players/${r.player.id}`} style={{ color: 'var(--text)', fontWeight: 600 }}>
                      {r.player.name}
                    </Link>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>{r.correct} / {r.guesses}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: r.accuracy >= 0.2 ? 'var(--cta)' : 'var(--primary)' }}>
                    {pct(r.accuracy)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--secondary)' }}>★ {rating(r.avgTaste)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Sodas in this event</h2>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ ...thStyle, textAlign: 'left' }}>Soda</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Color</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Tasters</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ID Rate</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Avg Taste</th>
              </tr>
            </thead>
            <tbody>
              {sodaStats.map((s) => (
                <tr key={s.soda.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <Link to={`/sodas/${s.soda.id}`} style={{ color: 'var(--text)', fontWeight: 600 }}>
                      {s.soda.name}
                    </Link>
                  </td>
                  <td style={{ padding: '12px 14px' }}><ColorBadge color={s.soda.color} /></td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>{s.guesses}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: s.correctRate >= 0.2 ? 'var(--cta)' : 'var(--primary)' }}>
                    {s.guesses > 0 ? pct(s.correctRate) : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--secondary)' }}>
                    {s.avgTaste > 0 ? `★ ${rating(s.avgTaste)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
