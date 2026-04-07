import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { House, Clock, Heart, Gear } from '@phosphor-icons/react';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { to: '/home', icon: House, label: 'Home' },
    { to: '/history', icon: Clock, label: 'History' },
    { to: '/favorites', icon: Heart, label: 'Favorites' },
    { to: '/settings', icon: Gear, label: 'Settings' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{
        background: 'rgba(253,248,240,0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/home' ? (location.pathname === '/home' || location.pathname === '/') : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all duration-200"
              style={{
                color: isActive ? 'var(--text-accent)' : 'var(--text-secondary)',
                minWidth: '60px',
              }}
            >
              <Icon
                size={22}
                weight={isActive ? 'fill' : 'regular'}
                style={{ transition: 'all 0.2s' }}
              />
              <span className="text-xs font-sans" style={{ fontSize: '12px', letterSpacing: '0.5px' }}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
