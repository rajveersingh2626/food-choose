import React from 'react';
import { IconPantry, IconCalendar, IconSparkles, IconBook } from './Icons.jsx';

export default function Navigation({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'pantry', label: 'Pantry & Groceries', icon: IconPantry },
    { id: 'planner', label: 'Weekly Planner', icon: IconCalendar },
    { id: 'mood', label: 'What To Eat Now', icon: IconSparkles },
    { id: 'recipes', label: 'Recipe Library', icon: IconBook }
  ];

  return (
    <>
      {/* Desktop Navigation Sidebar */}
      <aside className="desktop-nav">
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: '#949C98', letterSpacing: '0.5px', marginBottom: '8px', paddingLeft: '8px' }}>
            Navigation
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
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
              >
                <Icon size={18} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
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
                padding: isActive ? '8px 16px' : '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: isActive ? '700' : '500',
                fontSize: '0.82rem'
              }}
            >
              <Icon size={18} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
              {isActive && <span>{item.label.split(' ')[0]}</span>}
            </button>
          );
        })}
      </nav>
    </>
  );
}
