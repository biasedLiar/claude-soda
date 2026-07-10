import { Link } from 'react-router-dom';
import { allCompetitionsSummary } from '../lib/stats';
import { db, formatDate, pct } from '../lib/data';

const events = allCompetitionsSummary(db);

export function EventsPage() {
  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem' }}>Events</h1>
      <p style={{ margin: '0 0 28px', color: 'var(--text-muted)' }}>{events.length} competitions held</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {[...events].reverse().map((e) => (
          <Link key={e.competition.id} to={`/events/${e.competition.id}`} className="game-card" style={{ display: 'block', padding: '20px', boxSizing: 'border-box', textDecoration: 'none' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: 4 }}>
              {e.competition.name}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 16 }}>
              {formatDate(e.competition.date)}
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.4rem', fontFamily: 'Russo One, sans-serif' }}>{e.playerCount}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Players</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.4rem', fontFamily: 'Russo One, sans-serif' }}>{e.sodaCount}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sodas</div>
              </div>
              <div>
                <div className="neon-green" style={{ fontWeight: 700, fontSize: '1.4rem', fontFamily: 'Russo One, sans-serif' }}>{pct(e.avgAccuracy)}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg accuracy</div>
              </div>
              {e.winner && (
                <div>
                  <div className="neon-cyan" style={{ fontWeight: 700, fontSize: '0.95rem' }}>🏆 {e.winner.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Winner</div>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
