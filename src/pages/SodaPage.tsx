import { useParams, Link, Navigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { StatCard } from '../components/StatCard';
import { ColorBadge } from '../components/ColorBadge';
import { sodaStats } from '../lib/stats';
import { db, pct, rating } from '../lib/data';

export function SodaPage() {
  const { id } = useParams<{ id: string }>();
  const sodaId = Number(id);
  const stats = sodaStats(sodaId, db);

  if (!stats) return <Navigate to="/sodas" replace />;

  const compMap = new Map(db.competitions.map((c) => [c.id, c]));

  const competitionIds = db.competitionSodas
    .filter((cs) => cs.sodaId === sodaId)
    .map((cs) => cs.competitionId);

  const chartData = competitionIds
    .map((cid) => {
      const comp = compMap.get(cid)!;
      const guesses = db.guesses.filter((g) => g.actualSodaId === sodaId && g.competitionId === cid);
      const avgTaste = guesses.length > 0 ? guesses.reduce((sum, g) => sum + g.score, 0) / guesses.length : 0;
      return {
        name: comp.name.replace(/Julebrus\s*/i, '').replace(/\s*\(.*\)/, '').trim() || comp.name,
        avgTaste: Number(avgTaste.toFixed(2)),
      };
    })
    .filter((d) => d.avgTaste > 0);

  const perPlayer = db.players.map((p) => {
    const guesses = db.guesses.filter((g) => g.actualSodaId === sodaId && g.playerId === p.id);
    if (guesses.length === 0) return null;
    const avg = guesses.reduce((sum, g) => sum + g.score, 0) / guesses.length;
    const correct = guesses.filter((g) => g.guessedSodaId === sodaId).length;
    return { player: p, avgTaste: Number(avg.toFixed(2)), guesses: guesses.length, correct };
  }).filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.avgTaste - a.avgTaste);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <Link to="/sodas" style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}>← Sodas</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 0' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#1a1a2e' }}>{stats.soda.name}</h1>
          <ColorBadge color={stats.soda.color} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatCard label="Avg Taste Rating" value={`★ ${rating(stats.avgTaste)}`} accent />
        <StatCard label="Correct ID Rate" value={stats.totalGuesses > 0 ? pct(stats.correctRate) : '—'} />
        <StatCard label="Times tasted" value={stats.totalGuesses} />
        <StatCard label="Events" value={stats.appearances} />
      </div>

      {stats.topConfusions.length > 0 && (
        <section>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>Most often confused with</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {stats.topConfusions.map(({ soda, count }) => (
              <Link key={soda.id} to={`/sodas/${soda.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <ColorBadge color={soda.color} />
                  <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{soda.name}</span>
                  <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.85rem' }}>{count}×</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {chartData.length > 1 && (
        <section>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>Taste rating per competition</h2>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 8px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Avg Taste']} />
                <Bar dataKey="avgTaste" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>Per-player ratings</h2>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Player</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Times tasted</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Identified</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Avg Taste</th>
              </tr>
            </thead>
            <tbody>
              {perPlayer.map((r) => (
                <tr key={r.player.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <Link to={`/players/${r.player.id}`} style={{ color: '#1a1a2e', fontWeight: 600, textDecoration: 'none' }}>{r.player.name}</Link>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>{r.guesses}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    {r.correct > 0 ? <span style={{ color: '#059669', fontWeight: 700 }}>✓ {r.correct}</span> : <span style={{ color: '#9ca3af' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#d97706' }}>★ {r.avgTaste}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
