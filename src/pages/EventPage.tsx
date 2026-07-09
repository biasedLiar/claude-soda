import { useParams, Link, Navigate } from 'react-router-dom';
import { StatCard } from '../components/StatCard';
import { ColorBadge } from '../components/ColorBadge';
import { competitionLeaderboard, competitionSodaStats } from '../lib/stats';
import { db, formatDate, pct, rating } from '../lib/data';

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
        <Link to="/events" style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}>← Events</Link>
        <h1 style={{ margin: '8px 0 4px', fontSize: '2rem', fontWeight: 800, color: '#1a1a2e' }}>{competition.name}</h1>
        <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>{formatDate(competition.date)}</div>
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
        <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>🏆 Leaderboard</h2>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Rank</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Player</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Correct</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Accuracy</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Avg Taste Given</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((r) => (
                <tr
                  key={r.player.id}
                  style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: r.rank === 1 ? '#fffbeb' : undefined,
                  }}
                >
                  <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: '1.1rem', color: r.rank === 1 ? '#d97706' : '#9ca3af' }}>
                    {r.rank === 1 ? '🏆' : r.rank}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <Link to={`/players/${r.player.id}`} style={{ color: '#1a1a2e', fontWeight: 600, textDecoration: 'none' }}>
                      {r.player.name}
                    </Link>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>{r.correct} / {r.guesses}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: r.accuracy >= 0.2 ? '#059669' : '#dc2626' }}>
                    {pct(r.accuracy)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>★ {rating(r.avgTaste)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>Sodas in this event</h2>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Soda</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Color</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Tasters</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>ID Rate</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Avg Taste</th>
              </tr>
            </thead>
            <tbody>
              {sodaStats.map((s) => (
                <tr key={s.soda.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <Link to={`/sodas/${s.soda.id}`} style={{ color: '#1a1a2e', fontWeight: 600, textDecoration: 'none' }}>
                      {s.soda.name}
                    </Link>
                  </td>
                  <td style={{ padding: '12px 14px' }}><ColorBadge color={s.soda.color} /></td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>{s.guesses}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: s.correctRate >= 0.2 ? '#059669' : '#dc2626' }}>
                    {s.guesses > 0 ? pct(s.correctRate) : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
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
