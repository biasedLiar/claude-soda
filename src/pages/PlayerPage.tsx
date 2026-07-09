import { useParams, Link, Navigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { StatCard } from '../components/StatCard';
import { playerStats, playerCompetitionHistory } from '../lib/stats';
import { db, pct, rating } from '../lib/data';

export function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const playerId = Number(id);
  const stats = playerStats(playerId, db);

  if (!stats) return <Navigate to="/players" replace />;

  const history = playerCompetitionHistory(playerId, db);
  const guesses = db.guesses.filter((g) => g.playerId === playerId);

  const sodaMap = new Map(db.sodas.map((s) => [s.id, s]));
  const compMap = new Map(db.competitions.map((c) => [c.id, c]));

  const chartData = history.map((h) => ({
    name: h.competition.name.replace(/Julebrus\s*/i, '').replace(/\s*\(.*\)/, '').trim() || h.competition.name,
    accuracy: Math.round(h.accuracy * 100),
    avgTaste: h.avgTaste,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <Link to="/players" style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}>← Players</Link>
        <h1 style={{ margin: '8px 0 0', fontSize: '2rem', fontWeight: 800, color: '#1a1a2e' }}>{stats.player.name}</h1>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatCard label="Accuracy" value={pct(stats.accuracy)} />
        <StatCard label="Correct guesses" value={`${stats.correctGuesses} / ${stats.totalGuesses}`} />
        <StatCard label="Avg taste given" value={`★ ${rating(stats.avgTasteGiven)}`} />
        <StatCard label="Events played" value={stats.competitionsPlayed} />
      </div>

      {history.length > 1 && (
        <section>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>Accuracy per competition</h2>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 8px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Accuracy']} />
                <Bar dataKey="accuracy" fill="#1a1a2e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>Competition history</h2>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280' }}>Competition</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280' }}>Guesses</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280' }}>Accuracy</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280' }}>Avg Taste</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.competition.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <Link to={`/events/${h.competition.id}`} style={{ color: '#1a1a2e', fontWeight: 600, textDecoration: 'none' }}>
                      {h.competition.name}
                    </Link>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>{h.correct} / {h.guesses}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: h.accuracy >= 0.2 ? '#059669' : '#dc2626' }}>
                    {pct(h.accuracy)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>★ {rating(h.avgTaste)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>All guesses</h2>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Competition</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Actual soda</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Guessed</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Result</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280' }}>Taste</th>
              </tr>
            </thead>
            <tbody>
              {guesses.map((g) => {
                const actual = sodaMap.get(g.actualSodaId);
                const guessed = sodaMap.get(g.guessedSodaId);
                const comp = compMap.get(g.competitionId);
                const correct = g.guessedSodaId === g.actualSodaId;
                return (
                  <tr key={g.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: '0.85rem' }}>
                      <Link to={`/events/${g.competitionId}`} style={{ color: '#6b7280', textDecoration: 'none' }}>
                        {comp?.name}
                      </Link>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Link to={`/sodas/${g.actualSodaId}`} style={{ color: '#1a1a2e', textDecoration: 'none', fontWeight: 500 }}>
                        {actual?.name}
                      </Link>
                    </td>
                    <td style={{ padding: '10px 14px', color: correct ? '#1a1a2e' : '#9ca3af' }}>
                      <Link to={`/sodas/${g.guessedSodaId}`} style={{ color: correct ? '#1a1a2e' : '#9ca3af', textDecoration: 'none' }}>
                        {guessed?.name}
                      </Link>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      {correct ? '✅' : '❌'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>★ {g.score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
