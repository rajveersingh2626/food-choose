import React, { useState } from 'react';
import { CATEGORIES, GROCERY_PRESETS } from '../data/suhanuInitialPantry.js';
import {
  IconSearch,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconZap,
  IconCheck,
  IconBasket,
  IconBolt,
  IconCoffee,
  IconDumbbell,
  IconUtensils,
  IconCheckCircle
} from './Icons.jsx';

export default function PantryManager({
  pantryItems,
  setPantryItems,
  onResetToDefault,
  activePresetId = 'custom',
  onSelectPreset
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(CATEGORIES[0]);
  const [newItemQty, setNewItemQty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveToast, setSaveToast] = useState('');
  const [presetModal, setPresetModal] = useState(null); // { preset }

  const notifySave = (msg = '✓ Saved to your pantry') => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(''), 2200);
  };

  const getPresetIcon = (id) => {
    switch (id) {
      case 'high-protein':
        return <IconDumbbell size={18} color="#059669" />;
      case 'quick-breakfast':
        return <IconCoffee size={18} color="#D97706" />;
      case 'comfort-thali':
        return <IconUtensils size={18} color="#E7829A" />;
      case 'empty-slate':
        return <IconRefresh size={18} color="#6B7280" />;
      default:
        return <IconBasket size={18} color="var(--primary)" />;
    }
  };

  const filteredItems = pantryItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: newItemQty.trim() || 'In stock',
      inStock: true
    };

    setPantryItems([newItem, ...pantryItems]);
    setNewItemName('');
    setNewItemQty('');
    notifySave(`Added "${newItem.name}" to pantry!`);
  };

  const toggleStock = (id) => {
    const target = pantryItems.find(i => i.id === id);
    const nextState = !target?.inStock;
    setPantryItems(pantryItems.map(item =>
      item.id === id ? { ...item, inStock: !item.inStock } : item
    ));
    notifySave(nextState ? `Checked "${target?.name}"` : `Unchecked "${target?.name}"`);
  };

  const updateQuantity = (id, newQty) => {
    setPantryItems(pantryItems.map(item =>
      item.id === id ? { ...item, quantity: newQty } : item
    ));
    notifySave('Updated quantity');
  };

  const deleteItem = (id) => {
    const target = pantryItems.find(i => i.id === id);
    setPantryItems(pantryItems.filter(item => item.id !== id));
    notifySave(`Removed "${target?.name}"`);
  };

  const handleApplyPresetAction = (preset, mode = 'replace') => {
    if (mode === 'setActiveContext') {
      if (onSelectPreset) {
        onSelectPreset(preset.id);
        notifySave(`Set "${preset.name.split('(')[0]}" as Active Context for AI!`);
      }
    } else if (mode === 'replace') {
      setPantryItems(preset.items);
      if (onSelectPreset) onSelectPreset('custom');
      notifySave(`Loaded preset into your custom checklist!`);
    } else {
      // Merge mode: check all items that are in the preset
      const presetInStockNames = new Set(
        preset.items.filter(i => i.inStock).map(i => i.name.toLowerCase())
      );
      setPantryItems(pantryItems.map(item => ({
        ...item,
        inStock: item.inStock || presetInStockNames.has(item.name.toLowerCase())
      })));
      notifySave(`Merged with existing pantry!`);
    }
    setPresetModal(null);
  };

  const handleSelectAll = () => {
    setPantryItems(pantryItems.map(item => ({ ...item, inStock: true })));
    notifySave('All pantry items marked available');
  };

  const handleClearAll = () => {
    setPantryItems(pantryItems.map(item => ({ ...item, inStock: false })));
    notifySave('All items cleared');
  };

  const handleCheckStaples = () => {
    const stapleKeywords = ['rice', 'atta', 'poha', 'oats', 'toor dal', 'moong dal', 'ghee', 'butter', 'milk', 'curd', 'paneer', 'onion', 'potato', 'tomato', 'garlic', 'ginger', 'chilli', 'salt', 'turmeric', 'tea'];
    setPantryItems(pantryItems.map(item => {
      const isStaple = stapleKeywords.some(k => item.name.toLowerCase().includes(k));
      return { ...item, inStock: isStaple };
    }));
    notifySave('Everyday staples activated!');
  };

  const inStockCount = pantryItems.filter(i => i.inStock).length;

  return (
    <div className="animate-fade">
      {/* Toast Notification */}
      {saveToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#065F46',
          color: 'white',
          padding: '10px 18px',
          borderRadius: '12px',
          fontSize: '0.86rem',
          fontWeight: '700',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <IconCheck size={16} color="#86EFAC" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Preset Modal */}
      {presetModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(6px)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '24px', borderRadius: '20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#FDE8ED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              {getPresetIcon(presetModal.id)}
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1F2421', marginBottom: '6px' }}>
              {presetModal.name}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#5C6460', marginBottom: '18px', lineHeight: '1.45' }}>
              {presetModal.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {onSelectPreset && (
                <button
                  onClick={() => handleApplyPresetAction(presetModal, 'setActiveContext')}
                  className="btn-primary"
                  style={{ justifyContent: 'center', padding: '12px' }}
                >
                  <IconCheckCircle size={16} />
                  <span>Set as Active AI Context for Website</span>
                </button>
              )}
              <button
                onClick={() => handleApplyPresetAction(presetModal, 'replace')}
                className="btn-secondary"
                style={{ justifyContent: 'center', padding: '12px' }}
              >
                <span>Apply to Custom Checklist</span>
              </button>
              <button
                onClick={() => handleApplyPresetAction(presetModal, 'merge')}
                className="btn-outline"
                style={{ justifyContent: 'center', padding: '10px' }}
              >
                <span>Merge with Current Checklist</span>
              </button>
              <button
                onClick={() => setPresetModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9CA3AF',
                  padding: '8px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #FAF7F8 0%, #FDE8ED 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#1F2421', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconBasket size={20} color="#E7829A" />
            <span>Kitchen Pantry Manager</span>
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', background: '#E7829A', color: 'white', padding: '4px 12px', borderRadius: '999px', fontWeight: '700' }}>
              {inStockCount} of {pantryItems.length} In Stock
            </span>
            <button
              onClick={() => {
                onResetToDefault();
                notifySave('Pantry reset to default bundle');
              }}
              className="btn-outline"
              style={{ padding: '4px 10px', fontSize: '0.74rem' }}
              title="Reset to default items"
            >
              <IconRefresh size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#5C6460', marginBottom: '14px' }}>
          Manage what you have in your kitchen. Every recipe recommendation and 7-day meal plan actively adapts to these items. Changes save automatically!
        </p>

        {/* Quick Batch Controls */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={handleCheckStaples}
            className="chip chip-active"
            style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <IconBolt size={13} /> Everyday Staples
          </button>
          <button
            type="button"
            onClick={handleSelectAll}
            className="chip chip-inactive"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            Select All ({pantryItems.length})
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="chip chip-inactive"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            Clear All
          </button>
        </div>

        {/* Visual Preset Bundles Grid */}
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#1F2421', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Quick Pantry Contexts & Presets:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
            {GROCERY_PRESETS.map(preset => {
              const inPresetCount = preset.items.filter(i => i.inStock).length;
              const isActive = activePresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => setPresetModal(preset)}
                  style={{
                    background: isActive ? '#FDF2F4' : 'white',
                    border: `1.5px solid ${isActive ? 'var(--primary)' : 'rgba(0,0,0,0.08)'}`,
                    borderRadius: '14px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                  className="card-hover"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: '#FAF7F8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getPresetIcon(preset.id)}
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1F2421', lineHeight: '1.2' }}>
                      {preset.name.split('(')[0]}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', marginBottom: '8px', lineHeight: '1.3' }}>
                    {preset.description}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: '0.66rem',
                      background: '#F3E8FF',
                      color: '#7C3AED',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '999px'
                    }}>
                      {inPresetCount} items
                    </span>
                    {isActive && (
                      <span style={{ fontSize: '0.66rem', color: 'var(--primary)', fontWeight: '800' }}>
                        Active Context
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add New Grocery Form */}
      <div className="card mb-4">
        <h3 style={{ fontSize: '0.98rem', color: '#1F2421', marginBottom: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconPlus size={16} color="var(--primary)" />
          <span>Add New Pantry Item</span>
        </h3>
        <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <input
              type="text"
              placeholder="Item name (e.g. Paneer, Chia Seeds, Coconut Milk)..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              style={{ background: 'white' }}
            />
            <input
              type="text"
              placeholder="Quantity (e.g. 500g, 1 pack)..."
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
              style={{ background: 'white' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'white',
                fontSize: '0.85rem'
              }}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
            >
              <IconPlus size={16} />
              <span>Add Item</span>
            </button>
          </div>
        </form>
      </div>

      {/* Category Pills & Search */}
      <div className="card mb-4">
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <input
            type="text"
            placeholder="Search pantry items (e.g. rice, dal, spices, milk)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px', background: '#FAF7F8', width: '100%' }}
          />
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}>
            <IconSearch size={16} />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px' }}>
          <button
            onClick={() => setSelectedCategory('All')}
            className={`chip ${selectedCategory === 'All' ? 'chip-active' : 'chip-inactive'}`}
            style={{ fontSize: '0.78rem', flexShrink: 0 }}
          >
            All Items ({pantryItems.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = pantryItems.filter(i => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`chip ${selectedCategory === cat ? 'chip-active' : 'chip-inactive'}`}
                style={{ fontSize: '0.78rem', flexShrink: 0 }}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Pantry Items List */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#1F2421' }}>
            {selectedCategory === 'All' ? 'All Groceries' : selectedCategory} ({filteredItems.length})
          </span>
          <span style={{ fontSize: '0.76rem', color: '#6B7280' }}>
            Click checkbox to mark available
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: '#9CA3AF' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <IconSearch size={32} color="#CBD5E1" />
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>No grocery items found matching your filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredItems.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: item.inStock ? '#F4FBF6' : '#FAF7F8',
                  border: `1.5px solid ${item.inStock ? '#A7F3D0' : 'rgba(0,0,0,0.06)'}`,
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Toggle & Name */}
                <div
                  onClick={() => toggleStock(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}
                >
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    border: `2px solid ${item.inStock ? '#059669' : '#CBD5E1'}`,
                    background: item.inStock ? '#059669' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {item.inStock && <IconCheck size={14} color="white" />}
                  </div>

                  <div>
                    <span style={{
                      fontSize: '0.88rem',
                      fontWeight: item.inStock ? '700' : '500',
                      color: item.inStock ? '#065F46' : '#6B7280',
                      textDecoration: item.inStock ? 'none' : 'none'
                    }}>
                      {item.name}
                    </span>
                    <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                      {item.category}
                    </div>
                  </div>
                </div>

                {/* Quantity & Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    value={item.quantity || ''}
                    onChange={(e) => updateQuantity(item.id, e.target.value)}
                    style={{
                      width: '80px',
                      padding: '4px 8px',
                      fontSize: '0.76rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'white',
                      textAlign: 'center'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Remove item"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
