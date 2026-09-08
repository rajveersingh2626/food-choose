import React from 'react';
import { IconPantry, IconCalendar, IconSparkles, IconBook } from './Icons.jsx';

export default function Navigation({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'mood',    label: 'Ask AI Chef',       sub: 'What to eat now',      icon: IconSparkles },
    { id: 'planner', label: 'My Week',            sub: '7-day meal plan',      icon: IconCalendar },
    { id: 'recipes', label: 'Explore Recipes',    sub: 'AI-powered discovery', icon: IconBook },
    { id: 'pantry',  label: 'My Pantry',          sub: 'Manage ingredients',   icon: IconPantry }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="desktop-nav">
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase',
            color: '#949C98', letterSpacing: '0.7px', marginBottom: '10px', paddingLeft: '10px'
          }}>
            Your Kitchen AI
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-main)',
                  border: isActive ? '1.5px solid var(--primary-border)' : '1.5px solid transparent',
                  borderRadius: '14px',
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.88rem',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  width: '100%',
                  fontFamily: 'inherit'
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: isActive ? 'white' : '#F4F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.2s ease'
                }}>
                  <Icon size={18} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
                </div>
                <div>
                  <div style={{ fontWeight: isActive ? '700' : '600', fontSize: '0.88rem' }}>{item.label}</div>
                  <div style={{ fontSize: '0.71rem', color: isActive ? 'var(--primary)' : '#9CA3AF', fontWeight: '400', marginTop: '1px' }}>
                    {item.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                background: isActive ? 'var(--primary-light)' : 'transparent',
                border: 'none',
                borderRadius: '20px',
                padding: isActive ? '8px 14px' : '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: isActive ? '700' : '500',
                fontSize: '0.8rem',
                fontFamily: 'inherit'
              }}
            >
              <Icon size={19} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
              {isActive && <span style={{ whiteSpace: 'nowrap' }}>{item.label.split(' ')[0]}</span>}
            </button>
          );
        })}
      </nav>
    </>
  );
}
