import React, { useState } from 'react';
import { CATEGORIES, GROCERY_PRESETS } from '../data/suhanuInitialPantry.js';
import { IconSearch, IconPlus, IconRefresh, IconTrash, IconZap } from './Icons.jsx';

export default function PantryManager({ pantryItems, setPantryItems, onResetToDefault }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(CATEGORIES[0]);
  const [newItemQty, setNewItemQty] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
  };

  const toggleStock = (id) => {
    setPantryItems(pantryItems.map(item =>
      item.id === id ? { ...item, inStock: !item.inStock } : item
    ));
  };

  const updateQuantity = (id, newQty) => {
    setPantryItems(pantryItems.map(item =>
      item.id === id ? { ...item, quantity: newQty } : item
    ));
  };

  const deleteItem = (id) => {
    setPantryItems(pantryItems.filter(item => item.id !== id));
  };

  const handleApplyPreset = (presetId) => {
    const found = GROCERY_PRESETS.find(p => p.id === presetId);
    if (found) {
      setPantryItems(found.items);
    }
  };

  return (
    <div className="animate-fade">
      {/* Preset Loader Banner */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #FAF7F8 0%, #FDE8ED 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '1.15rem', margin: 0, color: '#1F2421', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconZap size={18} color="#E7829A" />
            <span>Grocery Presets</span>
          </h2>
          <span style={{ fontSize: '0.78rem', background: '#E7829A', color: 'white', padding: '2px 10px', borderRadius: '999px', fontWeight: '600' }}>
            {pantryItems.filter(i => i.inStock).length} Items Active
          </span>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#5C6460', marginBottom: '14px' }}>
          Quick load pre-saved kitchen bundles or restore Suhanu's starter pantry list.
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={selectedPresetId}
            onChange={(e) => {
              setSelectedPresetId(e.target.value);
              if (e.target.value) handleApplyPreset(e.target.value);
            }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--primary-border)',
              background: 'white',
              fontSize: '0.88rem',
              color: '#1F2421'
            }}
          >
            <option value="">Select a Grocery Preset Bundle...</option>
            {GROCERY_PRESETS.map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>

          <button
            onClick={onResetToDefault}
            className="btn-outline"
            style={{ fontSize: '0.85rem', padding: '8px 16px', whiteSpace: 'nowrap' }}
          >
            <IconRefresh size={16} />
            <span>Suhanu's Default List</span>
          </button>
        </div>
      </div>

      {/* Add New Grocery Form */}
      <div className="card mb-4">
        <h3 style={{ fontSize: '1rem', color: '#1F2421', marginBottom: '12px', fontWeight: '600' }}>
          Add Grocery Item
        </h3>
        <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <input
              type="text"
              placeholder="Item name (e.g. Paneer, Oats, Milk)..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Quantity (optional)"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              style={{ flex: 1 }}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <button type="submit" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
              <IconPlus size={16} />
              <span>Add Item</span>
            </button>
          </div>
        </form>
      </div>

      {/* Search & Category Chips */}
      <div className="mb-4">
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Search pantry items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '40px'
            }}
          />
          <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#949C98' }}>
            <IconSearch size={18} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px' }}>
          <button
            onClick={() => setSelectedCategory('All')}
            className={`chip ${selectedCategory === 'All' ? 'chip-active' : 'chip-inactive'}`}
          >
            All ({pantryItems.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = pantryItems.filter(i => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`chip ${selectedCategory === cat ? 'chip-active' : 'chip-inactive'}`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Items List / Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
        {filteredItems.map(item => (
          <div
            key={item.id}
            className="card"
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: item.inStock ? 1 : 0.55,
              background: item.inStock ? 'white' : '#F4F4F6'
            }}
          >
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="checkbox"
                checked={item.inStock}
                onChange={() => toggleStock(item.id)}
                style={{ width: '18px', height: '18px', accentColor: '#E7829A', cursor: 'pointer' }}
              />

              <div>
                <div style={{
                  fontSize: '0.92rem',
                  fontWeight: '600',
                  color: '#1F2421',
                  textDecoration: item.inStock ? 'none' : 'line-through'
                }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#5C6460' }}>
                  {item.category}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                value={item.quantity || ''}
                placeholder="Qty"
                onChange={(e) => updateQuantity(item.id, e.target.value)}
                style={{
                  width: '75px',
                  padding: '4px 8px',
                  fontSize: '0.78rem',
                  textAlign: 'center'
                }}
              />

              <button
                onClick={() => deleteItem(item.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#EF4444',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Remove item"
              >
                <IconTrash size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
