import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { StatCard } from '../components/StatCard';
import { ColorBadge } from '../components/ColorBadge';
import { Tooltip as InfoTooltip } from '../components/Tooltip';
import { sodaStats } from '../lib/stats';
import { SortableTable } from '../components/SortableTable';
import { db, pct, rating } from '../lib/data';
import { ID_RATE_TOOLTIP, ADJUSTED_ID_RATE_TOOLTIP, AVG_TASTE_WHEN_GUESSED_TOOLTIP } from '../lib/tooltips';

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

function ConfusionList({ items, label }: { items: Array<{ soda: { id: number; name: string; color: string }; count: number }>; label: string }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 style={{ margin: '0 0 12px', fontSize: '1rem' }}>{label}</h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {items.map(({ soda, count }) => (
          <Link key={soda.id} to={`/sodas/${soda.id}`} className="game-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', textDecoration: 'none' }}>
            <ColorBadge color={soda.color} />
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{soda.name}</span>
            <span className="neon-pink" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{count}×</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function SodaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const idChartData = competitionIds
    .map((cid) => {
      const comp = compMap.get(cid)!;
      const N = db.competitionSodas.filter((cs) => cs.competitionId === cid).length;
      if (N <= 1) return null;
      const guesses = db.guesses.filter((g) => g.actualSodaId === sodaId && g.competitionId === cid);
      if (guesses.length === 0) return null;
      const correct = guesses.filter((g) => g.guessedSodaId === sodaId).length;
      const adjRate = (correct / guesses.length - 1 / N) / (1 - 1 / N);
      return {
        name: comp.name.replace(/Julebrus\s*/i, '').replace(/\s*\(.*\)/, '').trim() || comp.name,
        adjRate: Math.round(adjRate * 100),
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  const perPlayer = db.players.map((p) => {
    const guesses = db.guesses.filter((g) => g.actualSodaId === sodaId && g.playerId === p.id);
    if (guesses.length === 0) return null;
    const avg = guesses.reduce((sum, g) => sum + g.score, 0) / guesses.length;
    const correct = guesses.filter((g) => g.guessedSodaId === sodaId).length;
    return { player: p, avgTaste: Number(avg.toFixed(2)), guesses: guesses.length, correct };
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <Link to="/sodas" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>← Sodas</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 0' }}>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>{stats.soda.name}</h1>
          <ColorBadge color={stats.soda.color} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatCard label="Avg Taste Rating" value={`★ ${rating(stats.avgTaste)}`} accent />
        <StatCard label="Avg Rating When Guessed" value={stats.totalGuesses > 0 ? `★ ${rating(stats.avgTasteWhenGuessed)}` : '—'} tooltip={AVG_TASTE_WHEN_GUESSED_TOOLTIP} />
        <StatCard label="ID Rate" value={stats.totalGuesses > 0 ? pct(stats.correctRate) : '—'} tooltip={ID_RATE_TOOLTIP} />
        <StatCard label="Adjusted ID Rate" value={stats.totalGuesses > 0 ? pct(stats.adjustedCorrectRate) : '—'} tooltip={ADJUSTED_ID_RATE_TOOLTIP} />
        <StatCard label="Times tasted" value={stats.totalGuesses} />
        <StatCard label="Events" value={stats.appearances} />
      </div>

      <ConfusionList items={stats.confusedWith} label="When tasted, often guessed as" />
      <ConfusionList items={stats.guessedAs} label="When guessed, actually is" />

      {chartData.length > 1 && (
        <section>
          <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Taste rating per competition</h2>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 8px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a0a0b8', fontFamily: 'Chakra Petch' }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#a0a0b8', fontFamily: 'Chakra Petch' }} />
                <Tooltip formatter={(v) => [v, 'Avg Taste']} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="avgTaste" stroke="#39ff14" strokeWidth={2} dot={{ r: 4, fill: '#39ff14' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {idChartData.length > 1 && (
        <section>
          <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>
            <InfoTooltip text={ADJUSTED_ID_RATE_TOOLTIP}>Adjusted ID rate per competition<span className="tooltip-icon">i</span></InfoTooltip>
          </h2>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 8px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={idChartData} margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a0a0b8', fontFamily: 'Chakra Petch' }} />
                <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#a0a0b8', fontFamily: 'Chakra Petch' }} />
                <ReferenceLine y={0} stroke="#ff006e" strokeWidth={2} strokeDasharray="6 3" />
                <Tooltip formatter={(v) => [`${v}%`, 'Adjusted ID Rate']} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="adjRate" stroke="#00ffff" strokeWidth={2} dot={{ r: 4, fill: '#00ffff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section>
        <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Per-player ratings</h2>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <SortableTable
            rowKey={(r) => r.player.id}
            defaultSort="avgTaste"
            defaultDir="desc"
            onRowClick={(r) => navigate(`/players/${r.player.id}`)}
            data={perPlayer}
            columns={[
              {
                key: 'name',
                label: 'Player',
                render: (r) => <span style={{ fontWeight: 600, color: 'var(--text)' }}>{r.player.name}</span>,
                sortValue: (r) => r.player.name,
              },
              {
                key: 'guesses',
                label: 'Times tasted',
                align: 'right',
                render: (r) => r.guesses,
                sortValue: (r) => r.guesses,
              },
              {
                key: 'correct',
                label: 'Identified',
                align: 'right',
                render: (r) => r.correct > 0
                  ? <span className="neon-green">✓ {r.correct}</span>
                  : <span style={{ color: 'var(--text-muted)' }}>—</span>,
                sortValue: (r) => r.correct,
              },
              {
                key: 'avgTaste',
                label: 'Avg Taste',
                align: 'right',
                render: (r) => <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>★ {r.avgTaste}</span>,
                sortValue: (r) => r.avgTaste,
              },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
