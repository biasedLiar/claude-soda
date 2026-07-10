import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { allPlayersSummary, competitionLeaderboard } from '../lib/stats';
import { db, pct, rating } from '../lib/data';
import { Tooltip } from '../components/Tooltip';
import { ACCURACY_TOOLTIP } from '../lib/tooltips';
import type { Player } from '../lib/types';

const players = allPlayersSummary(db).filter((p) => p.totalGuesses > 0);
const byTaste = [...players].sort((a, b) => b.avgTasteGiven - a.avgTasteGiven);

const medalMap = new Map<number, { gold: number; silver: number; bronze: number }>();
for (const comp of db.competitions) {
  const lb = competitionLeaderboard(comp.id, db);
  if (lb.length <= 1) continue;
  for (const r of lb) {
    if (r.rank > 3) continue;
    const entry = medalMap.get(r.player.id) ?? { gold: 0, silver: 0, bronze: 0 };
    if (r.rank === 1) entry.gold++;
    else if (r.rank === 2) entry.silver++;
    else if (r.rank === 3) entry.bronze++;
    medalMap.set(r.player.id, entry);
  }
}
const byMedals = [...medalMap.entries()]
  .map(([id, m]) => ({ player: db.players.find((p) => p.id === id)!, ...m, total: m.gold + m.silver + m.bronze }))
  .filter((m) => m.player != null)
  .sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze);

type MedalRow = { player: Player; gold: number; silver: number; bronze: number; total: number };
type MedalSortMode = 'medals' | 'total';

function MedalTable({ medals }: { medals: MedalRow[] }) {
  const navigate = useNavigate();
  const [sortMode, setSortMode] = useState<MedalSortMode>('medals');

  const sorted = [...medals].sort((a, b) =>
    sortMode === 'total'
      ? b.total - a.total
      : b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze
  );

  const headerStyle: React.CSSProperties = {
    padding: '10px 14px',
    fontWeight: 700,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    background: 'var(--bg-lighter)',
    borderBottom: '2px solid var(--border)',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    fontFamily: 'Chakra Petch, sans-serif',
  };

  function medalHeader(label: string) {
    const active = sortMode === 'medals';
    return (
      <th
        key={label}
        onClick={() => setSortMode('medals')}
        style={{ ...headerStyle, textAlign: 'right', cursor: 'pointer', color: active ? 'var(--secondary)' : 'var(--text-muted)' }}
      >
        {label}{active && ' ↓'}
      </th>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr>
            <th style={{ ...headerStyle, textAlign: 'left', color: 'var(--text-muted)', cursor: 'default' }}>Player</th>
            {medalHeader('🥇')}
            {medalHeader('🥈')}
            {medalHeader('🥉')}
            <th
              onClick={() => setSortMode('total')}
              style={{ ...headerStyle, textAlign: 'right', cursor: 'pointer', color: sortMode === 'total' ? 'var(--secondary)' : 'var(--text-muted)' }}
            >
              Total{sortMode === 'total' && ' ↓'}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => (
            <tr
              key={m.player.id}
              onClick={() => navigate(`/players/${m.player.id}`)}
              style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-lighter)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
            >
              <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text)' }}>{m.player.name}</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: m.gold > 0 ? '#ffd700' : 'var(--text-muted)' }}>{m.gold}</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: m.silver > 0 ? '#c0c0c0' : 'var(--text-muted)' }}>{m.silver}</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: m.bronze > 0 ? '#cd7f32' : 'var(--text-muted)' }}>{m.bronze}</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--text)' }}>{m.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontWeight: 700,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
  background: 'var(--bg-lighter)',
};

export function LeaderboardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.8rem' }}>Leaderboard</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>All-time rankings across all competitions</p>
      </div>

      <section>
        <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Medal table</h2>
        <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Podium finishes across all competitions with more than one competitor.
        </p>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <MedalTable medals={byMedals} />
        </div>
      </section>

      <section>
        <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Accuracy ranking</h2>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ ...thStyle, textAlign: 'left' }}>Rank</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Player</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Events</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Correct / Total</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>
                  <Tooltip text={ACCURACY_TOOLTIP}>Accuracy<span className="tooltip-icon">i</span></Tooltip>
                </th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr
                  key={p.player.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: i === 0 ? 'rgba(0, 255, 255, 0.05)' : undefined,
                    borderLeft: i === 0 ? '2px solid var(--secondary)' : undefined,
                  }}
                >
                  <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: '1.1rem', color: i === 0 ? 'var(--secondary)' : 'var(--text-muted)' }}>
                    {i === 0 ? '🏆' : i + 1}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <Link to={`/players/${p.player.id}`} style={{ color: 'var(--text)', fontWeight: 600 }}>
                      {p.player.name}
                    </Link>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>{p.competitionsPlayed}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>{p.correctGuesses} / {p.totalGuesses}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: p.accuracy >= 0.2 ? 'var(--cta)' : 'var(--primary)' }}>
                    {pct(p.accuracy)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Taste rating generosity</h2>
        <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Who gives the highest average taste ratings — ranked from most generous to harshest critic.
        </p>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ ...thStyle, textAlign: 'left' }}>Rank</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Player</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total Tastings</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Avg Taste Given</th>
              </tr>
            </thead>
            <tbody>
              {byTaste.map((p, i) => (
                <tr
                  key={p.player.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: i === 0 ? 'rgba(0, 255, 255, 0.05)' : undefined,
                    borderLeft: i === 0 ? '2px solid var(--secondary)' : undefined,
                  }}
                >
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: i === 0 ? 'var(--secondary)' : 'var(--text-muted)' }}>
                    {i === 0 ? '🌟' : i + 1}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <Link to={`/players/${p.player.id}`} style={{ color: 'var(--text)', fontWeight: 600 }}>
                      {p.player.name}
                    </Link>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>{p.totalGuesses}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--secondary)' }}>
                    ★ {rating(p.avgTasteGiven)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>
    </div>
  );
}
