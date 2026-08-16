import React from 'react';

export default function Navigation({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'pantry', label: 'Pantry', icon: '🛒' },
    { id: 'planner', label: 'Weekly Plan', icon: '📅' },
    { id: 'mood', label: 'What To Eat', icon: '✨' },
    { id: 'recipes', label: 'Recipes', icon: '📖' }
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '480px',
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '30px',
      padding: '6px 10px',
      boxShadow: '0 12px 32px rgba(231, 148, 167, 0.25), 0 2px 8px rgba(0, 0, 0, 0.05)',
      border: '1.5px solid rgba(255, 229, 236, 0.8)',
      display: 'flex',
      justify: 'space-around',
      alignItems: 'center',
      zIndex: 1000
    }}>
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              background: isActive ? 'linear-gradient(135deg, #FFE5EC 0%, #F7CAD0 100%)' : 'transparent',
              border: 'none',
              borderRadius: '20px',
              padding: isActive ? '8px 16px' : '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              color: isActive ? '#33272A' : '#6B5B60',
              fontWeight: isActive ? '700' : '500',
              fontSize: '0.85rem'
            }}
          >
            <span style={{ fontSize: '1.15rem' }}>{item.icon}</span>
            {isActive && <span>{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}
