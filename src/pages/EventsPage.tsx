import { Link } from 'react-router-dom';
import { allCompetitionsSummary } from '../lib/stats';
import { db, formatDate, pct } from '../lib/data';

const events = allCompetitionsSummary(db);

export function EventsPage() {
  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem', fontWeight: 800, color: '#1a1a2e' }}>Events</h1>
      <p style={{ margin: '0 0 28px', color: '#6b7280' }}>{events.length} competitions held</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {[...events].reverse().map((e) => (
          <Link key={e.competition.id} to={`/events/${e.competition.id}`} style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: '20px 20px',
                height: '100%',
                boxSizing: 'border-box',
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = '')}
            >
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a2e', marginBottom: 4 }}>
                {e.competition.name}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: 16 }}>
                {formatDate(e.competition.date)}
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.4rem', color: '#1a1a2e' }}>{e.playerCount}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase' }}>Players</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.4rem', color: '#1a1a2e' }}>{e.sodaCount}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase' }}>Sodas</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.4rem', color: '#059669' }}>{pct(e.avgAccuracy)}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase' }}>Avg accuracy</div>
                </div>
                {e.winner && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#d97706' }}>🏆 {e.winner.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase' }}>Winner</div>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
