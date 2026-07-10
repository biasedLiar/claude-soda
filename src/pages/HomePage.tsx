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
        <h1 style={{ margin: '0 0 8px', fontSize: '2.2rem' }} className="neon-pink">JulebrussStats</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>
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
          <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Best-tasting sodas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.bestTastingSodas.map((s, i) => (
              <Link key={s.soda.id} to={`/sodas/${s.soda.id}`} className="game-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textDecoration: 'none' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-muted)', width: 24, textAlign: 'center', fontFamily: 'Russo One, sans-serif' }}>{i + 1}</span>
                <ColorBadge color={s.soda.color} />
                <span style={{ fontWeight: 600, color: 'var(--text)', flex: 1 }}>{s.soda.name}</span>
                <span className="neon-cyan" style={{ fontWeight: 700 }}>★ {rating(s.avgTaste)}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Most identifiable sodas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.mostAccurateSodas.map((s, i) => (
              <Link key={s.soda.id} to={`/sodas/${s.soda.id}`} className="game-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textDecoration: 'none' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-muted)', width: 24, textAlign: 'center', fontFamily: 'Russo One, sans-serif' }}>{i + 1}</span>
                <ColorBadge color={s.soda.color} />
                <span style={{ fontWeight: 600, color: 'var(--text)', flex: 1 }}>{s.soda.name}</span>
                <span className="neon-green" style={{ fontWeight: 700 }}>{pct(s.correctRate)}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Hardest to identify</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.leastAccurateSodas.map((s, i) => (
              <Link key={s.soda.id} to={`/sodas/${s.soda.id}`} className="game-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textDecoration: 'none' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-muted)', width: 24, textAlign: 'center', fontFamily: 'Russo One, sans-serif' }}>{i + 1}</span>
                <ColorBadge color={s.soda.color} />
                <span style={{ fontWeight: 600, color: 'var(--text)', flex: 1 }}>{s.soda.name}</span>
                <span className="neon-pink" style={{ fontWeight: 700 }}>{pct(s.correctRate)}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {latest && (
        <section>
          <h2 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Latest competition</h2>
          <Link to={`/events/${latest.competition.id}`} className="game-card" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '20px 24px', flexWrap: 'wrap', textDecoration: 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>{latest.competition.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 2 }}>{formatDate(latest.competition.date)}</div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '1.5rem', fontFamily: 'Russo One, sans-serif' }}>{latest.playerCount}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Players</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '1.5rem', fontFamily: 'Russo One, sans-serif' }}>{latest.sodaCount}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sodas</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="neon-green" style={{ fontWeight: 700, fontSize: '1.5rem', fontFamily: 'Russo One, sans-serif' }}>{pct(latest.avgAccuracy)}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg accuracy</div>
              </div>
              {latest.winner && (
                <div style={{ textAlign: 'center' }}>
                  <div className="neon-cyan" style={{ fontWeight: 700, fontSize: '1rem' }}>🏆 {latest.winner.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Winner</div>
                </div>
              )}
            </div>
          </Link>
        </section>
      )}
    </div>
  );
}
