import React from 'react';

export default function Header() {
  return (
    <header className="card mb-4" style={{ padding: '16px 24px', borderRadius: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FDE8ED 0%, #E7829A 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '700',
            fontSize: '1.2rem'
          }}>
            S
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', color: '#1F2421', lineHeight: '1.2', margin: 0, fontWeight: '700' }}>
              Suhanu's Culinary Companion
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#5C6460', margin: 0 }}>
              Personalized Grocery & Meal Planner
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
