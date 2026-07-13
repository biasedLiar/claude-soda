import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { StatCard } from '../components/StatCard';
import { SortableTable } from '../components/SortableTable';
import { playerStats, playerCompetitionHistory } from '../lib/stats';
import { db, pct, rating } from '../lib/data';
import { ACCURACY_TOOLTIP } from '../lib/tooltips';
import type { PlayerCompetitionResult, Guess, Soda } from '../lib/types';

const tooltipStyle = {
  background: 'var(--bg-lighter)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--text)',
  fontFamily: 'Chakra Petch, sans-serif',
  fontSize: '0.85rem',
};

type MistakeRow = { actual: Soda; guessed: Soda; count: number; avgTaste: number };

export function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playerId = Number(id);
  const stats = playerStats(playerId, db);

  if (!stats) return <Navigate to="/players" replace />;

  const history = playerCompetitionHistory(playerId, db);
  const sodaMap = new Map(db.sodas.map((s) => [s.id, s]));
  const compMap = new Map(db.competitions.map((c) => [c.id, c]));
  const guesses = db.guesses.filter((g) => g.playerId === playerId);

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
      const matchingGuesses = guesses.filter((g) => g.actualSodaId === actualId && g.guessedSodaId === guessedId);
      const avgTaste = matchingGuesses.reduce((sum, g) => sum + g.score, 0) / matchingGuesses.length;
      return { actual: sodaMap.get(actualId), guessed: sodaMap.get(guessedId), count, avgTaste };
    })
    .filter((r): r is MistakeRow => !!(r.actual && r.guessed));

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
    correct: h.correct,
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
          <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Correct guesses per competition</h2>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 8px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a0a0b8', fontFamily: 'Chakra Petch' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#a0a0b8', fontFamily: 'Chakra Petch' }} />
                <Tooltip formatter={(v) => [v, 'Correct guesses']} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="correct" stroke="#00ffff" strokeWidth={2} dot={{ r: 4, fill: '#00ffff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {frequentMistakes.length > 0 && (
        <section>
          <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Frequent incorrect guesses</h2>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <SortableTable<MistakeRow>
              rowKey={(r) => `${r.actual.id}:${r.guessed.id}`}
              defaultSort="count"
              defaultDir="desc"
              onRowClick={(r) => navigate(`/sodas/${r.actual.id}`)}
              data={frequentMistakes}
              columns={[
                {
                  key: 'actual',
                  label: 'Actual soda',
                  render: (r) => <Link to={`/sodas/${r.actual.id}`} style={{ color: 'var(--text)', fontWeight: 500 }}>{r.actual.name}</Link>,
                  sortValue: (r) => r.actual.name,
                },
                {
                  key: 'guessed',
                  label: 'Guessed as',
                  render: (r) => <Link to={`/sodas/${r.guessed.id}`} style={{ color: 'var(--text-muted)' }}>{r.guessed.name}</Link>,
                  sortValue: (r) => r.guessed.name,
                },
                {
                  key: 'count',
                  label: 'Times',
                  align: 'right',
                  render: (r) => <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.count}</span>,
                  sortValue: (r) => r.count,
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
      )}

      <section>
        <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Competition history</h2>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <SortableTable<PlayerCompetitionResult>
            rowKey={(r) => r.competition.id}
            defaultSort="date"
            defaultDir="desc"
            onRowClick={(r) => navigate(`/events/${r.competition.id}`)}
            data={history}
            columns={[
              {
                key: 'competition',
                label: 'Competition',
                render: (r) => (
                  <Link to={`/events/${r.competition.id}`} style={{ color: 'var(--text)', fontWeight: 600 }}>
                    {r.competition.name}
                  </Link>
                ),
                sortValue: (r) => new Date(r.competition.date).getTime(),
              },
              {
                key: 'date',
                label: 'Date',
                align: 'right',
                render: (r) => <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{/(\d{4})/.exec(r.competition.name)?.[1] ?? ''}</span>,
                sortValue: (r) => new Date(r.competition.date).getTime(),
              },
              {
                key: 'guesses',
                label: 'Correct',
                align: 'right',
                render: (r) => <span style={{ color: 'var(--text-muted)' }}>{r.correct} / {r.guesses}</span>,
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
        <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Sodas</h2>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <SortableTable
            rowKey={(r) => r.soda.id}
            defaultSort="avgTaste"
            defaultDir="desc"
            onRowClick={(r) => navigate(`/sodas/${r.soda.id}`)}
            pageSize={10}
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
          <SortableTable<Guess>
            rowKey={(r) => r.id}
            defaultSort="competition"
            defaultDir="desc"
            pageSize={10}
            data={guesses}
            columns={[
              {
                key: 'competition',
                label: 'Competition',
                render: (r) => (
                  <Link to={`/events/${r.competitionId}`} style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {compMap.get(r.competitionId)?.name}
                  </Link>
                ),
                sortValue: (r) => {
                  const name = compMap.get(r.competitionId)?.name ?? '';
                  return parseInt(/(\d{4})/.exec(name)?.[1] ?? '0');
                },
              },
              {
                key: 'actual',
                label: 'Actual soda',
                render: (r) => (
                  <Link to={`/sodas/${r.actualSodaId}`} style={{ color: 'var(--text)', fontWeight: 500 }}>
                    {sodaMap.get(r.actualSodaId)?.name}
                  </Link>
                ),
                sortValue: (r) => sodaMap.get(r.actualSodaId)?.name ?? '',
              },
              {
                key: 'guessed',
                label: 'Guessed',
                render: (r) => {
                  const correct = r.guessedSodaId === r.actualSodaId;
                  return (
                    <Link to={`/sodas/${r.guessedSodaId}`} style={{ color: correct ? 'var(--text)' : 'var(--text-muted)' }}>
                      {sodaMap.get(r.guessedSodaId)?.name}
                    </Link>
                  );
                },
                sortValue: (r) => sodaMap.get(r.guessedSodaId)?.name ?? '',
              },
              {
                key: 'result',
                label: 'Result',
                align: 'center',
                render: (r) => r.guessedSodaId === r.actualSodaId ? '✅' : '❌',
                sortValue: (r) => r.guessedSodaId === r.actualSodaId ? 1 : 0,
              },
              {
                key: 'score',
                label: 'Taste',
                align: 'right',
                render: (r) => <span style={{ color: 'var(--secondary)' }}>★ {r.score}</span>,
                sortValue: (r) => r.score,
              },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
