import { Link } from 'react-router-dom';
import { StatCard } from '../components/StatCard';
import { ColorBadge } from '../components/ColorBadge';
import { globalStats, allCompetitionsSummary } from '../lib/stats';
import { db, formatDate, pct, rating } from '../lib/data';

const stats = globalStats(db);
const competitions = allCompetitionsSummary(db);
const latest = competitions.find((c) => c.competition.id === stats.latestCompetition.id);

export function HomePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: '2rem', fontWeight: 800, color: '#1a1a2e' }}>JulebrussStats</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '1rem' }}>
          Blind-tasting statistics for Norwegian Christmas soda (Julebrus) competitions
        </p>
      </div>

      <section>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <StatCard label="Competitions" value={stats.totalCompetitions} />
          <StatCard label="Players" value={stats.totalPlayers} />
          <StatCard label="Sodas" value={stats.totalSodas} />
          <StatCard label="Guesses" value={stats.totalGuesses} />
          <StatCard label="Overall Accuracy" value={pct(stats.overallAccuracy)} accent />
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        <section>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>
            🏆 Best-tasting sodas
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.bestTastingSodas.map((s, i) => (
              <Link
                key={s.soda.id}
                to={`/sodas/${s.soda.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = '')}
                >
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#9ca3af', width: 24, textAlign: 'center' }}>{i + 1}</span>
                  <ColorBadge color={s.soda.color} />
                  <span style={{ fontWeight: 600, color: '#1a1a2e', flex: 1 }}>{s.soda.name}</span>
                  <span style={{ fontWeight: 700, color: '#d97706' }}>★ {rating(s.avgTaste)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>
            🎯 Most identifiable sodas
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.mostAccurateSodas.map((s, i) => (
              <Link
                key={s.soda.id}
                to={`/sodas/${s.soda.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = '')}
                >
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#9ca3af', width: 24, textAlign: 'center' }}>{i + 1}</span>
                  <ColorBadge color={s.soda.color} />
                  <span style={{ fontWeight: 600, color: '#1a1a2e', flex: 1 }}>{s.soda.name}</span>
                  <span style={{ fontWeight: 700, color: '#059669' }}>{pct(s.correctRate)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>
            🫣 Hardest to identify
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.leastAccurateSodas.map((s, i) => (
              <Link
                key={s.soda.id}
                to={`/sodas/${s.soda.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = '')}
                >
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#9ca3af', width: 24, textAlign: 'center' }}>{i + 1}</span>
                  <ColorBadge color={s.soda.color} />
                  <span style={{ fontWeight: 600, color: '#1a1a2e', flex: 1 }}>{s.soda.name}</span>
                  <span style={{ fontWeight: 700, color: '#dc2626' }}>{pct(s.correctRate)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {latest && (
        <section>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>
            📅 Latest competition
          </h2>
          <Link to={`/events/${latest.competition.id}`} style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                flexWrap: 'wrap',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = '')}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a2e' }}>{latest.competition.name}</div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 2 }}>{formatDate(latest.competition.date)}</div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#1a1a2e' }}>{latest.playerCount}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Players</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#1a1a2e' }}>{latest.sodaCount}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Sodas</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#059669' }}>{pct(latest.avgAccuracy)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Avg accuracy</div>
                </div>
                {latest.winner && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#d97706' }}>🏆 {latest.winner.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Winner</div>
                  </div>
                )}
              </div>
            </div>
          </Link>
        </section>
      )}
    </div>
  );
}
