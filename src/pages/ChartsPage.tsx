import { useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, Legend, ReferenceLine,
} from 'recharts';
import { allSodasSummary } from '../lib/stats';
import { db } from '../lib/data';
import { sodaColorHex } from '../components/ColorBadge';
import { Tooltip as InfoTooltip } from '../components/Tooltip';
import { ADJUSTED_ID_RATE_TOOLTIP } from '../lib/tooltips';
import type { Competition } from '../lib/types';

function shortName(comp: Competition): string {
  return comp.name.replace(/Julebrus\s*/i, '').replace(/\s*\(.*\)/, '').trim() || comp.name;
}

function avg(nums: number[]): number {
  return nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;
}

const PLAYER_PALETTE = ['#00ffff', '#ff006e', '#39ff14', '#ff8c00', '#c084fc', '#facc15', '#f472b6', '#38bdf8'];

const tooltipStyle: React.CSSProperties = {
  background: 'var(--bg-lighter)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--text)',
  fontFamily: 'Chakra Petch, sans-serif',
  fontSize: '0.85rem',
  padding: '8px 12px',
};

const sortedComps = [...db.competitions].sort(
  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
);

// Scatter 1 & 2 data
const sodaScatter = allSodasSummary(db)
  .filter((s) => s.totalGuesses > 0)
  .map((s) => ({
    name: s.soda.name,
    color: s.soda.color,
    taste: s.avgTaste,
    perceivedTaste: s.avgTasteWhenGuessed,
    adjRate: Math.round(s.adjustedCorrectRate * 100),
  }));

const minTaste = Math.min(...sodaScatter.map((s) => s.taste));
const maxTaste = Math.max(...sodaScatter.map((s) => s.taste));
const minAdjRate = Math.min(...sodaScatter.map((s) => s.adjRate));
const maxAdjRate = Math.max(...sodaScatter.map((s) => s.adjRate));
const adjRatePad = 5;
const adjRateDomain: [number, number] = [minAdjRate - adjRatePad, maxAdjRate + adjRatePad];
const adjRateTicks = Array.from(
  { length: Math.floor((adjRateDomain[1] - adjRateDomain[0]) / 10) + 1 },
  (_, i) => Math.ceil(adjRateDomain[0] / 10) * 10 + i * 10
).filter((v) => v >= adjRateDomain[0] && v <= adjRateDomain[1]);
const tastePad = 0.3;
const tasteAdjDomain: [number, number] = [minTaste - tastePad, maxTaste + tastePad];
const tasteAdjTicks = Array.from(
  { length: Math.floor(tasteAdjDomain[1]) - Math.ceil(tasteAdjDomain[0]) + 1 },
  (_, i) => Math.ceil(tasteAdjDomain[0]) + i
);
const minPerceived = Math.min(...sodaScatter.map((s) => s.perceivedTaste));
const maxPerceived = Math.max(...sodaScatter.map((s) => s.perceivedTaste));

const scatterPad = 0.3;
const tasteDomain: [number, number] = [minTaste - scatterPad, maxTaste + scatterPad];
const perceivedDomain: [number, number] = [minPerceived - scatterPad, maxPerceived + scatterPad];
const tasteTicks = Array.from(
  { length: Math.floor(tasteDomain[1]) - Math.ceil(tasteDomain[0]) + 1 },
  (_, i) => Math.ceil(tasteDomain[0]) + i
);
const perceivedTicks = Array.from(
  { length: Math.floor(perceivedDomain[1]) - Math.ceil(perceivedDomain[0]) + 1 },
  (_, i) => Math.ceil(perceivedDomain[0]) + i
);

// Diagonal line covers the intersection of both axes' ranges, extended by scatterPad on each end.
const diagMin = Math.max(minTaste, minPerceived) - scatterPad;
const diagMax = Math.min(maxTaste, maxPerceived) + scatterPad;

// Equal pixels-per-unit on both axes makes the y=x line sit at exactly 45°.
const scatterAspect = (tasteDomain[1] - tasteDomain[0]) / (perceivedDomain[1] - perceivedDomain[0]);

// Scatter 3 data: competition difficulty
const compScatter = sortedComps.map((comp) => {
  const N = db.competitionSodas.filter((cs) => cs.competitionId === comp.id).length;
  const compGuesses = db.guesses.filter((g) => g.competitionId === comp.id);
  const playerIds = [...new Set(compGuesses.map((g) => g.playerId))];
  if (playerIds.length === 0) return null;
  const correct = compGuesses.filter((g) => g.guessedSodaId === g.actualSodaId).length;
  const avgCorrect = Math.round((correct / playerIds.length) * 10) / 10;
  return { name: shortName(comp), sodaCount: N, avgCorrect };
}).filter((d): d is NonNullable<typeof d> => d !== null && d.sodaCount > 0);

// Line chart data: player accuracy over time
const activePlayers = db.players.filter((p) => {
  const compIds = new Set(db.guesses.filter((g) => g.playerId === p.id).map((g) => g.competitionId));
  return compIds.size >= 2;
});

// Fast attendance lookup
const playerCompAttendance = new Set(db.guesses.map((g) => `${g.playerId}:${g.competitionId}`));

// Group competitions by short name so same-label events are merged into one data point
const compGroups: Array<{ label: string; ids: number[] }> = [];
const seenLabels = new Map<string, number>();
for (const comp of sortedComps) {
  const label = shortName(comp);
  const existing = seenLabels.get(label);
  if (existing !== undefined) {
    compGroups[existing].ids.push(comp.id);
  } else {
    seenLabels.set(label, compGroups.length);
    compGroups.push({ label, ids: [comp.id] });
  }
}

// Line chart data: soda taste over time
const sodaLines = db.sodas.filter((s) => {
  const sodaCompIds = new Set(
    db.competitionSodas.filter((cs) => cs.sodaId === s.id).map((cs) => cs.competitionId)
  );
  return compGroups.filter(({ ids }) => ids.some((id) => sodaCompIds.has(id))).length >= 3;
});

const sodaTasteData = compGroups.map(({ label, ids }) => {
  const row: Record<string, unknown> = { name: label };
  for (const soda of sodaLines) {
    const gs = db.guesses.filter((g) => g.actualSodaId === soda.id && ids.includes(g.competitionId));
    if (gs.length > 0) row[`s${soda.id}`] = Math.round(avg(gs.map((g) => g.score)) * 100) / 100;
  }
  return row;
});

// Gap endpoints: compGroup indices where a player has a gap just before or after
const playerGapEndpoints = new Map<number, Set<number>>();
for (const player of activePlayers) {
  const attendedIdxs = compGroups
    .map(({ ids }, idx) => ({ idx, attended: ids.some((cid) => playerCompAttendance.has(`${player.id}:${cid}`)) }))
    .filter((x) => x.attended)
    .map((x) => x.idx);
  const endpoints = new Set<number>();
  for (let k = 0; k + 1 < attendedIdxs.length; k++) {
    if (attendedIdxs[k + 1] > attendedIdxs[k] + 1) {
      endpoints.add(attendedIdxs[k]);
      endpoints.add(attendedIdxs[k + 1]);
    }
  }
  playerGapEndpoints.set(player.id, endpoints);
}

const playerAccuracyData = compGroups.map(({ label, ids }, idx) => {
  const yearMatch = /(\d{4})/.exec(label);
  const year = yearMatch ? parseInt(yearMatch[1]) : 0;
  const row: Record<string, unknown> = { name: label, year };
  for (const player of activePlayers) {
    const allGs = ids.flatMap((compId) =>
      db.guesses.filter((g) => g.playerId === player.id && g.competitionId === compId)
    );
    if (allGs.length === 0) continue;
    const correct = allGs.filter((g) => g.guessedSodaId === g.actualSodaId).length;
    row[`p${player.id}`] = correct;
    if (playerGapEndpoints.get(player.id)?.has(idx)) {
      row[`gap_p${player.id}`] = correct;
    }
  }
  return row;
});

const playerTasteData = compGroups.map(({ label, ids }, idx) => {
  const yearMatch = /(\d{4})/.exec(label);
  const year = yearMatch ? parseInt(yearMatch[1]) : 0;
  const row: Record<string, unknown> = { name: label, year };
  for (const player of activePlayers) {
    const allGs = ids.flatMap((compId) =>
      db.guesses.filter((g) => g.playerId === player.id && g.competitionId === compId)
    );
    if (allGs.length === 0) continue;
    const avgTaste = Math.round(avg(allGs.map((g) => g.score)) * 100) / 100;
    row[`pt${player.id}`] = avgTaste;
    if (playerGapEndpoints.get(player.id)?.has(idx)) {
      row[`gap_pt${player.id}`] = avgTaste;
    }
  }
  return row;
});

const playerYearTicks = compGroups
  .map(({ label }) => { const m = /(\d{4})/.exec(label); return m ? parseInt(m[1]) : null; })
  .filter((y): y is number => y !== null);
const playerYearDomain: [number, number] = [
  Math.min(...playerYearTicks) - 0.3,
  Math.max(...playerYearTicks) + 0.3,
];


// Custom scatter dot coloured by soda
function ScatterDot(props: { cx?: number; cy?: number; payload?: { color?: string } }) {
  const { cx = 0, cy = 0, payload } = props;
  return <circle cx={cx} cy={cy} r={6} fill={sodaColorHex(payload?.color ?? '')} opacity={0.85} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />;
}

// Custom scatter dot for competitions (no soda colour)
function CompDot(props: { cx?: number; cy?: number }) {
  const { cx = 0, cy = 0 } = props;
  return <circle cx={cx} cy={cy} r={6} fill="#00ffff" opacity={0.85} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />;
}

function SodaScatterTip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; taste: number; perceivedTaste: number; adjRate: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
      <div>Avg taste: {d.taste}</div>
      <div>Perceived: {d.perceivedTaste}</div>
    </div>
  );
}

function SodaAdjTip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; taste: number; adjRate: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
      <div>Avg taste: {d.taste}</div>
      <div>Adjusted Accuracy: {d.adjRate}%</div>
    </div>
  );
}

type LineTipEntry = { name: string; value: number; color: string; dataKey: string };
type LineTipProps = { active?: boolean; label?: string | number; activeKey?: string | null; payload?: LineTipEntry[] };

function SodaTasteTip({ active, payload, label, activeKey }: LineTipProps) {
  if (!active || !payload?.length) return null;
  let entries = payload.filter((e) => e.value !== undefined).sort((a, b) => b.value - a.value);
  if (activeKey) entries = entries.filter((e) => e.dataKey === activeKey);
  if (entries.length === 0) return null;
  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {entries.map((e) => (
        <div key={e.dataKey} style={{ color: e.color, marginBottom: 2 }}>
          {e.name}: {e.value}
        </div>
      ))}
    </div>
  );
}

function PlayerAccuracyTip({ active, payload, label }: LineTipProps) {
  if (!active || !payload?.length) return null;
  const entries = payload.filter((e) => e.value !== undefined && !String(e.dataKey).startsWith('gap_'));
  if (entries.length === 0) return null;
  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {entries.map((e) => (
        <div key={e.dataKey} style={{ color: e.color, marginBottom: 2 }}>
          {e.name}: {e.value}
        </div>
      ))}
    </div>
  );
}

function CompScatterTip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; sodaCount: number; avgCorrect: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
      <div>Sodas: {d.sodaCount}</div>
      <div>Avg correct per player: {d.avgCorrect}</div>
    </div>
  );
}

const axisProps = {
  tick: { fontSize: 11, fill: '#a0a0b8', fontFamily: 'Chakra Petch' },
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '20px 8px',
};

const legendStyle = { fontFamily: 'Chakra Petch', fontSize: '0.72rem', color: 'var(--text-muted)' };

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-lighter)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text)',
  padding: '6px 10px',
  fontSize: '0.8rem',
  fontFamily: 'Chakra Petch, sans-serif',
  cursor: 'pointer',
  marginBottom: 12,
};

function LineSelector({ options, value, onChange, placeholder }: {
  options: Array<{ value: string; label: string }>;
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder: string;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      style={selectStyle}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function ChartsPage() {
  const [activeSodaKey, setActiveSodaKey] = useState<string | null>(null);
  const [activePlayerKey, setActivePlayerKey] = useState<string | null>(null);
  const [activePlayerTasteKey, setActivePlayerTasteKey] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.8rem' }}>Charts</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Visual analysis across sodas, players, and competitions</p>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Over Time</h2>

        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Player Correct Guesses Over Competitions
          </h3>
          <LineSelector
            options={activePlayers.map((p) => ({ value: `p${p.id}`, label: p.name }))}
            value={activePlayerKey}
            onChange={setActivePlayerKey}
            placeholder="All players"
          />
          <div style={cardStyle}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={playerAccuracyData} margin={{ left: 0, right: 24, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
                <XAxis type="number" dataKey="year" domain={playerYearDomain} ticks={playerYearTicks} tickFormatter={(v: number) => String(v)} {...axisProps} />
                <YAxis allowDecimals={false} {...axisProps} />
                <Tooltip content={(props) => <PlayerAccuracyTip {...(props as unknown as LineTipProps)} />} />
                <Legend
                  wrapperStyle={{ ...legendStyle, cursor: 'pointer' }}
                  onMouseEnter={(data: { dataKey?: string | number | ((o: unknown) => unknown) }) => { if (typeof data.dataKey === 'string') setActivePlayerKey(data.dataKey); }}
                  onMouseLeave={() => setActivePlayerKey(null)}
                />
                {activePlayers.flatMap((player, i) => {
                  const key = `p${player.id}`;
                  const gapKey = `gap_p${player.id}`;
                  const color = PLAYER_PALETTE[i % PLAYER_PALETTE.length];
                  const dim = activePlayerKey !== null && activePlayerKey !== key;
                  const sw = activePlayerKey === key ? 3 : 2;
                  return [
                    <Line
                      key={gapKey}
                      type="monotone"
                      dataKey={gapKey}
                      stroke={color}
                      strokeWidth={activePlayerKey === key ? 2 : 1}
                      strokeDasharray="4 4"
                      strokeOpacity={dim ? 0.05 : activePlayerKey === key ? 0.8 : 0.35}
                      dot={false}
                      activeDot={false}
                      connectNulls={true}
                      legendType="none"
                    />,
                    <Line
                      key={player.id}
                      type="monotone"
                      dataKey={key}
                      name={player.name}
                      stroke={color}
                      strokeWidth={sw}
                      strokeOpacity={dim ? 0.15 : 1}
                      dot={{ r: 4, fill: color, fillOpacity: dim ? 0.15 : 1 }}
                      activeDot={{ r: 6 }}
                      connectNulls={false}
                      onMouseEnter={() => setActivePlayerKey(key)}
                      onMouseLeave={() => setActivePlayerKey(null)}
                    />,
                  ];
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Player Avg Taste Over Competitions
          </h3>
          <LineSelector
            options={activePlayers.map((p) => ({ value: `pt${p.id}`, label: p.name }))}
            value={activePlayerTasteKey}
            onChange={setActivePlayerTasteKey}
            placeholder="All players"
          />
          <div style={cardStyle}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={playerTasteData} margin={{ left: 0, right: 24, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
                <XAxis type="number" dataKey="year" domain={playerYearDomain} ticks={playerYearTicks} tickFormatter={(v: number) => String(v)} {...axisProps} />
                <YAxis domain={[0, 10]} {...axisProps} />
                <Tooltip content={(props) => <PlayerAccuracyTip {...(props as unknown as LineTipProps)} />} />
                <Legend
                  wrapperStyle={{ ...legendStyle, cursor: 'pointer' }}
                  onMouseEnter={(data: { dataKey?: string | number | ((o: unknown) => unknown) }) => { if (typeof data.dataKey === 'string') setActivePlayerTasteKey(data.dataKey); }}
                  onMouseLeave={() => setActivePlayerTasteKey(null)}
                />
                {activePlayers.flatMap((player, i) => {
                  const key = `pt${player.id}`;
                  const gapKey = `gap_pt${player.id}`;
                  const color = PLAYER_PALETTE[i % PLAYER_PALETTE.length];
                  const dim = activePlayerTasteKey !== null && activePlayerTasteKey !== key;
                  const sw = activePlayerTasteKey === key ? 3 : 2;
                  return [
                    <Line
                      key={gapKey}
                      type="monotone"
                      dataKey={gapKey}
                      stroke={color}
                      strokeWidth={activePlayerTasteKey === key ? 2 : 1}
                      strokeDasharray="4 4"
                      strokeOpacity={dim ? 0.05 : activePlayerTasteKey === key ? 0.8 : 0.35}
                      dot={false}
                      activeDot={false}
                      connectNulls={true}
                      legendType="none"
                    />,
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={player.name}
                      stroke={color}
                      strokeWidth={sw}
                      strokeOpacity={dim ? 0.15 : 1}
                      dot={{ r: 4, fill: color, fillOpacity: dim ? 0.15 : 1 }}
                      activeDot={{ r: 6 }}
                      connectNulls={false}
                      onMouseEnter={() => setActivePlayerTasteKey(key)}
                      onMouseLeave={() => setActivePlayerTasteKey(null)}
                    />,
                  ];
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Soda Taste Over Competitions (≥3 events)
          </h3>
          <LineSelector
            options={sodaLines.map((s) => ({ value: `s${s.id}`, label: s.name }))}
            value={activeSodaKey}
            onChange={setActiveSodaKey}
            placeholder="All sodas"
          />
          <div style={cardStyle}>
            <ResponsiveContainer width="100%" height={480}>
              <LineChart data={sodaTasteData} margin={{ left: 0, right: 24, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis domain={[0, 10]} {...axisProps} />
                <Tooltip content={(props) => <SodaTasteTip {...(props as unknown as LineTipProps)} activeKey={activeSodaKey} />} />
                <Legend
                  wrapperStyle={{ ...legendStyle, cursor: 'pointer' }}
                  onMouseEnter={(data: { dataKey?: string | number | ((o: unknown) => unknown) }) => { if (typeof data.dataKey === 'string') setActiveSodaKey(data.dataKey); }}
                  onMouseLeave={() => setActiveSodaKey(null)}
                />
                {sodaLines.map((soda, i) => {
                  const key = `s${soda.id}`;
                  const dim = activeSodaKey !== null && activeSodaKey !== key;
                  const hex = PLAYER_PALETTE[i % PLAYER_PALETTE.length];
                  return (
                    <Line
                      key={soda.id}
                      type="monotone"
                      dataKey={key}
                      name={soda.name}
                      stroke={hex}
                      strokeWidth={activeSodaKey === key ? 3 : 2}
                      strokeOpacity={dim ? 0.15 : 1}
                      dot={{ r: 4, fill: hex, fillOpacity: dim ? 0.15 : 1 }}
                      activeDot={{ r: 6 }}
                      connectNulls={false}
                      onMouseEnter={() => setActiveSodaKey(key)}
                      onMouseLeave={() => setActiveSodaKey(null)}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Scatterplots</h2>

        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Avg Taste vs. Perceived Taste
          </h3>
          <div style={cardStyle}>
            <ResponsiveContainer width="100%" aspect={scatterAspect}>
              <ScatterChart margin={{ left: 0, right: 24, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
                <XAxis dataKey="taste" name="Avg Taste" domain={tasteDomain} ticks={tasteTicks} type="number" {...axisProps} label={{ value: 'Avg Taste', position: 'insideBottom', offset: -2, fill: '#a0a0b8', fontSize: 11, fontFamily: 'Chakra Petch' }} />
                <YAxis dataKey="perceivedTaste" name="Perceived Taste" domain={perceivedDomain} ticks={perceivedTicks} type="number" {...axisProps} label={{ value: 'Avg Rating When Guessed', angle: -90, position: 'insideLeft', fill: '#a0a0b8', fontSize: 11, fontFamily: 'Chakra Petch' }} />
                <ZAxis range={[36, 36]} />
                <Tooltip content={<SodaScatterTip />} />
                <ReferenceLine segment={[{ x: diagMin, y: diagMin }, { x: diagMax, y: diagMax }]} stroke="#a0a0b8" strokeDasharray="4 4" strokeWidth={1} />
                <Scatter data={sodaScatter} shape={<ScatterDot />} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <InfoTooltip text={ADJUSTED_ID_RATE_TOOLTIP}>
              Avg Taste vs. Adjusted Accuracy<span className="tooltip-icon">i</span>
            </InfoTooltip>
          </h3>
          <div style={cardStyle}>
            <ResponsiveContainer width="100%" aspect={1.3}>
              <ScatterChart margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
                <XAxis dataKey="adjRate" name="Adjusted Accuracy" type="number" domain={adjRateDomain} ticks={adjRateTicks} tickFormatter={(v) => `${v}%`} {...axisProps} label={{ value: 'Adjusted Accuracy', position: 'insideBottom', offset: -2, fill: '#a0a0b8', fontSize: 11, fontFamily: 'Chakra Petch' }} />
                <YAxis dataKey="taste" name="Avg Taste" type="number" domain={tasteAdjDomain} ticks={tasteAdjTicks} {...axisProps} label={{ value: 'Avg Taste', angle: -90, position: 'insideLeft', fill: '#a0a0b8', fontSize: 11, fontFamily: 'Chakra Petch' }} />
                <ZAxis range={[36, 36]} />
                <Tooltip content={<SodaAdjTip />} />
                <ReferenceLine x={0} stroke="#ff006e" strokeWidth={2} strokeDasharray="6 3" />
                <Scatter data={sodaScatter} shape={<ScatterDot />} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Competition Difficulty (Sodas vs. Avg Correct per Player)
          </h3>
          <div style={cardStyle}>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
                <XAxis dataKey="sodaCount" name="No. of Sodas" type="number" allowDecimals={false} {...axisProps} label={{ value: 'No. of Sodas', position: 'insideBottom', offset: -2, fill: '#a0a0b8', fontSize: 11, fontFamily: 'Chakra Petch' }} />
                <YAxis dataKey="avgCorrect" name="Avg Correct / Player" type="number" allowDecimals={false} {...axisProps} label={{ value: 'Avg Correct / Player', angle: -90, position: 'insideLeft', fill: '#a0a0b8', fontSize: 11, fontFamily: 'Chakra Petch' }} />
                <ZAxis range={[36, 36]} />
                <Tooltip content={<CompScatterTip />} />
                <Scatter data={compScatter} shape={<CompDot />} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
