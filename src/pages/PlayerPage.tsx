import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { StatCard } from '../components/StatCard';
import { Tooltip as InfoTooltip } from '../components/Tooltip';
import { SortableTable } from '../components/SortableTable';
import { playerStats, playerCompetitionHistory } from '../lib/stats';
import { db, pct, rating } from '../lib/data';
import { ACCURACY_TOOLTIP } from '../lib/tooltips';

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontWeight: 700,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
  background: 'var(--bg-lighter)',
};

const tooltipStyle = {
  background: 'var(--bg-lighter)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--text)',
  fontFamily: 'Chakra Petch, sans-serif',
  fontSize: '0.85rem',
};

export function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playerId = Number(id);
  const stats = playerStats(playerId, db);

  if (!stats) return <Navigate to="/players" replace />;

  const history = playerCompetitionHistory(playerId, db);
  const guesses = db.guesses.filter((g) => g.playerId === playerId);

  const sodaMap = new Map(db.sodas.map((s) => [s.id, s]));
  const compMap = new Map(db.competitions.map((c) => [c.id, c]));

  const incorrectCounts = new Map<string, number>();
  for (const g of guesses) {
    if (g.guessedSodaId === g.actualSodaId) continue;
    const key = `${g.actualSodaId}:${g.guessedSodaId}`;
    incorrectCounts.set(key, (incorrectCounts.get(key) ?? 0) + 1);
  }
  const frequentMistakes = [...incorrectCounts.entries()]
    .filter(([, count]) => count > 1)
    .sort(([, a], [, b]) => b - a)
    .map(([key, count]) => {
      const [actualId, guessedId] = key.split(':').map(Number);
      return { actual: sodaMap.get(actualId), guessed: sodaMap.get(guessedId), count };
    })
    .filter((r) => r.actual && r.guessed);

  const sodaStatsMap = new Map<number, { correct: number; total: number; totalScore: number }>();
  for (const g of guesses) {
    const entry = sodaStatsMap.get(g.actualSodaId) ?? { correct: 0, total: 0, totalScore: 0 };
    entry.total++;
    if (g.guessedSodaId === g.actualSodaId) entry.correct++;
    entry.totalScore += g.score;
    sodaStatsMap.set(g.actualSodaId, entry);
  }
  const sodaRows = [...sodaStatsMap.entries()]
    .map(([sodaId, s]) => ({
      soda: sodaMap.get(sodaId)!,
      total: s.total,
      correct: s.correct,
      accuracy: s.correct / s.total,
      avgTaste: s.totalScore / s.total,
    }))
    .filter((r) => r.soda);

  const chartData = history.map((h) => ({
    name: h.competition.name.replace(/Julebrus\s*/i, '').replace(/\s*\(.*\)/, '').trim() || h.competition.name,
    accuracy: Math.round(h.accuracy * 100),
    avgTaste: h.avgTaste,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <Link to="/players" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>← Players</Link>
        <h1 style={{ margin: '8px 0 0', fontSize: '2rem' }}>{stats.player.name}</h1>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatCard label="Accuracy" value={pct(stats.accuracy)} tooltip={ACCURACY_TOOLTIP} />
        <StatCard label="Correct guesses" value={`${stats.correctGuesses} / ${stats.totalGuesses}`} />
        <StatCard label="Avg taste given" value={`★ ${rating(stats.avgTasteGiven)}`} />
        <StatCard label="Events played" value={stats.competitionsPlayed} />
      </div>

      {history.length > 1 && (
        <section>
          <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Accuracy per competition</h2>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 8px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a0a0b8', fontFamily: 'Chakra Petch' }} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#a0a0b8', fontFamily: 'Chakra Petch' }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Accuracy']} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="accuracy" stroke="#00ffff" strokeWidth={2} dot={{ r: 4, fill: '#00ffff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {frequentMistakes.length > 0 && (
        <section>
          <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Frequent incorrect guesses</h2>
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
                {frequentMistakes.map((r) => (
                  <tr key={`${r.actual!.id}:${r.guessed!.id}`} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <Link to={`/sodas/${r.actual!.id}`} style={{ color: 'var(--text)', fontWeight: 500 }}>{r.actual!.name}</Link>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <Link to={`/sodas/${r.guessed!.id}`} style={{ color: 'var(--text-muted)' }}>{r.guessed!.name}</Link>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Competition history</h2>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ ...thStyle, textAlign: 'left' }}>Competition</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Guesses</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>
                  <InfoTooltip text={ACCURACY_TOOLTIP}>Accuracy<span className="tooltip-icon">i</span></InfoTooltip>
                </th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Avg Taste</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.competition.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <Link to={`/events/${h.competition.id}`} style={{ color: 'var(--text)', fontWeight: 600 }}>
                      {h.competition.name}
                    </Link>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>{h.correct} / {h.guesses}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: h.accuracy >= 0.2 ? 'var(--cta)' : 'var(--primary)' }}>
                    {pct(h.accuracy)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--secondary)' }}>★ {rating(h.avgTaste)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Sodas</h2>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <SortableTable
            rowKey={(r) => r.soda.id}
            defaultSort="total"
            defaultDir="desc"
            onRowClick={(r) => navigate(`/sodas/${r.soda.id}`)}
            data={sodaRows}
            columns={[
              {
                key: 'name',
                label: 'Soda',
                render: (r) => <span style={{ fontWeight: 500, color: 'var(--text)' }}>{r.soda.name}</span>,
                sortValue: (r) => r.soda.name,
              },
              {
                key: 'total',
                label: 'Tastings',
                align: 'right',
                render: (r) => r.total,
                sortValue: (r) => r.total,
              },
              {
                key: 'correct',
                label: 'Correct',
                align: 'right',
                render: (r) => r.correct,
                sortValue: (r) => r.correct,
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
                key: 'avgTaste',
                label: 'Avg Taste',
                align: 'right',
                render: (r) => <span style={{ color: 'var(--secondary)' }}>★ {rating(r.avgTaste)}</span>,
                sortValue: (r) => r.avgTaste,
              },
            ]}
          />
        </div>
      </section>

      <section>
        <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>All guesses</h2>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ ...thStyle, textAlign: 'left' }}>Competition</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Actual soda</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Guessed</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Result</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Taste</th>
              </tr>
            </thead>
            <tbody>
              {guesses.map((g) => {
                const actual = sodaMap.get(g.actualSodaId);
                const guessed = sodaMap.get(g.guessedSodaId);
                const comp = compMap.get(g.competitionId);
                const correct = g.guessedSodaId === g.actualSodaId;
                return (
                  <tr key={g.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontSize: '0.85rem' }}>
                      <Link to={`/events/${g.competitionId}`} style={{ color: 'var(--text-muted)' }}>
                        {comp?.name}
                      </Link>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Link to={`/sodas/${g.actualSodaId}`} style={{ color: 'var(--text)', fontWeight: 500 }}>
                        {actual?.name}
                      </Link>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Link to={`/sodas/${g.guessedSodaId}`} style={{ color: correct ? 'var(--text)' : 'var(--text-muted)' }}>
                        {guessed?.name}
                      </Link>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      {correct ? '✅' : '❌'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--secondary)' }}>★ {g.score}</td>
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
