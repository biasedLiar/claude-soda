import { Link } from 'react-router-dom';
import { allPlayersSummary } from '../lib/stats';
import { db, pct, rating } from '../lib/data';

const players = allPlayersSummary(db).filter((p) => p.totalGuesses > 0);
const byTaste = [...players].sort((a, b) => b.avgTasteGiven - a.avgTasteGiven);

export function LeaderboardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.8rem', fontWeight: 800, color: '#1a1a2e' }}>Leaderboard</h1>
        <p style={{ margin: 0, color: '#6b7280' }}>All-time rankings across all competitions</p>
      </div>

      <section>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>🎯 Accuracy ranking</h2>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Rank</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Player</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Events</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Correct / Total</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr
                  key={p.player.id}
                  style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: i === 0 ? '#fffbeb' : undefined,
                  }}
                >
                  <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: '1.1rem', color: i === 0 ? '#d97706' : '#9ca3af' }}>
                    {i === 0 ? '🏆' : i + 1}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <Link to={`/players/${p.player.id}`} style={{ color: '#1a1a2e', fontWeight: 600, textDecoration: 'none' }}>
                      {p.player.name}
                    </Link>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>{p.competitionsPlayed}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>{p.correctGuesses} / {p.totalGuesses}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: p.accuracy >= 0.2 ? '#059669' : '#dc2626' }}>
                    {pct(p.accuracy)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>★ Taste rating generosity</h2>
        <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: '0.875rem' }}>
          Who gives the highest average taste ratings — ranked from most generous to harshest critic.
        </p>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Rank</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Player</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Total Tastings</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Avg Taste Given</th>
              </tr>
            </thead>
            <tbody>
              {byTaste.map((p, i) => (
                <tr
                  key={p.player.id}
                  style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: i === 0 ? '#fffbeb' : undefined,
                  }}
                >
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: i === 0 ? '#d97706' : '#9ca3af' }}>
                    {i === 0 ? '🌟' : i + 1}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <Link to={`/players/${p.player.id}`} style={{ color: '#1a1a2e', fontWeight: 600, textDecoration: 'none' }}>
                      {p.player.name}
                    </Link>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>{p.totalGuesses}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#d97706' }}>
                    ★ {rating(p.avgTasteGiven)}
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
