import React, { useState, useRef, useEffect } from 'react';
import { GROCERY_PRESETS } from '../data/suhanuInitialPantry.js';
import { IconBasket, IconCheck, IconChevronDown, IconSliders } from './Icons.jsx';

export default function PantryContextSelector({
  activePresetId,
  onSelectPreset,
  pantryItems,
  activePantryItems
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Context options list
  const customInStockCount = (pantryItems || []).filter(i => i.inStock).length;
  const activeInStockCount = (activePantryItems || []).filter(i => i.inStock).length;

  const options = [
    {
      id: 'custom',
      name: 'My Custom Pantry',
      desc: 'Based on your exact checklist in Pantry Manager',
      inStockCount: customInStockCount
    },
    ...GROCERY_PRESETS.filter(p => p.id !== 'empty-slate').map(p => ({
      id: p.id,
      name: p.name.split('(')[0].trim(),
      desc: p.description,
      inStockCount: p.items.filter(i => i.inStock).length
    }))
  ];

  const currentOption = options.find(o => o.id === activePresetId) || options[0];

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '999px',
          background: 'white',
          border: '1.5px solid var(--primary-border)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '0.78rem',
          fontWeight: '700',
          color: '#1F2421',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          transition: 'all 0.2s ease'
        }}
        title="Choose which pantry profile is active for AI recommendations"
      >
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#FDE8ED',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <IconBasket size={12} color="var(--primary)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#6B7280', fontWeight: '600' }}>Active Pantry:</span>
          <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{currentOption.name}</span>
          <span style={{
            background: '#F0FDF4',
            color: '#166534',
            padding: '1px 6px',
            borderRadius: '999px',
            fontSize: '0.68rem',
            fontWeight: '700'
          }}>
            {activeInStockCount} items
          </span>
        </div>
        <IconChevronDown size={14} color="#6B7280" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="animate-fade"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: '320px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.16)',
            border: '1.5px solid rgba(0,0,0,0.08)',
            padding: '10px',
            zIndex: 1000
          }}
        >
          <div style={{ padding: '6px 10px 10px', borderBottom: '1px solid #F3F4F6', marginBottom: '6px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#1F2421' }}>
              Select Active Pantry Context
            </div>
            <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>
              AI Chef & meal plans will exclusively use this pantry profile:
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {options.map((opt) => {
              const isSelected = opt.id === activePresetId;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onSelectPreset(opt.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isSelected ? 'var(--primary-light)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{ flex: 1, paddingRight: '8px' }}>
                    <div style={{
                      fontSize: '0.82rem',
                      fontWeight: isSelected ? '800' : '600',
                      color: isSelected ? 'var(--primary)' : '#1F2421',
                      marginBottom: '2px'
                    }}>
                      {opt.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#6B7280', lineHeight: '1.3' }}>
                      {opt.desc}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      color: isSelected ? 'var(--primary)' : '#059669',
                      background: isSelected ? 'white' : '#ECFDF5',
                      padding: '2px 6px',
                      borderRadius: '999px',
                      whiteSpace: 'nowrap'
                    }}>
                      {opt.inStockCount} items
                    </span>
                    {isSelected && <IconCheck size={14} color="var(--primary)" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
