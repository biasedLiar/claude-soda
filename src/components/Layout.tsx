import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Home', exact: true },
  { to: '/players', label: 'Players' },
  { to: '/sodas', label: 'Sodas' },
  { to: '/events', label: 'Events' },
  { to: '/leaderboard', label: 'Leaderboard' },
];

export function Layout() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
      <header
        style={{
          background: '#1a1a2e',
          color: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          height: 56,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        <NavLink to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
          🥤 JulebrussStats
        </NavLink>
        <nav style={{ display: 'flex', gap: 4 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              style={({ isActive }) => ({
                color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                transition: 'all 0.15s',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        <Outlet />
      </main>
    </div>
  );
}
