import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Home', exact: true },
  { to: '/players', label: 'Players' },
  { to: '/sodas', label: 'Sodas' },
  { to: '/events', label: 'Events' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/charts', label: 'Charts' },
];

export function Layout() {
  return (
    <div className="grid-bg scanlines" style={{ minHeight: '100vh' }}>
      <header
        className="header"
        style={{
          background: 'rgba(13, 13, 26, 0.92)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(10px)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          height: 64,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <NavLink
          to="/"
          style={{
            color: 'var(--primary)',
            textDecoration: 'none',
            fontFamily: 'Russo One, sans-serif',
            fontSize: '1.1rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textShadow: '0 0 10px rgba(255, 0, 110, 0.6)',
          }}
        >
          JulebrussStats
        </NavLink>
        <nav className="header-nav" style={{ display: 'flex', gap: 4 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              style={({ isActive }) => ({
                color: isActive ? 'var(--secondary)' : 'var(--text-muted)',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: '0.8rem',
                fontWeight: isActive ? 600 : 400,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: isActive ? 'rgba(0, 255, 255, 0.08)' : 'transparent',
                transition: 'all 0.15s',
                textShadow: isActive ? '0 0 8px rgba(0, 255, 255, 0.5)' : 'none',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main style={{ maxWidth: 1024, margin: '0 auto', padding: '40px 24px' }}>
        <Outlet />
      </main>
    </div>
  );
}
