import React, { useState, useEffect, useRef, useCallback } from 'react';
import MealCard from './MealCard.jsx';
import { fetchLlmRecipes } from '../services/geminiService.js';
import {
  IconSparkles,
  IconBook,
  IconSearch,
  IconBasket,
  IconBolt,
  IconGlobe
} from './Icons.jsx';

export default function RecipeLibrary({ pantryItems, apiKey, onSelectRecipe }) {
  const [activeSubTab, setActiveSubTab] = useState('pantry'); // 'pantry' | 'makenow' | 'global'
  const [pantryRecipes, setPantryRecipes] = useState([]);
  const [makeNowRecipes, setMakeNowRecipes] = useState([]);
  const [globalRecipes, setGlobalRecipes] = useState([]);
  const [dietFilter, setDietFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const LOADING_MESSAGES = [
    'Checking active pantry ingredients...',
    'Gemini AI is matching flavor profiles...',
    'Curating delicious gourmet dishes...',
    'Setting up presentation plates...'
  ];

  const loadLlmRecipes = useCallback(async (mode = activeSubTab, filter = dietFilter, query = searchQuery, isAppend = false) => {
    if (isAppend) {
      if (loadingMoreRef.current || !hasMore) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
    } else {
      setLoading(true);
      setErrorMsg('');
      setLoadingStep(0);
      setHasMore(true);
    }

    const timer = !isAppend ? setInterval(() => {
      setLoadingStep(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 1200) : null;

    try {
      let existingList = [];
      if (mode === 'pantry') existingList = pantryRecipes;
      else if (mode === 'makenow') existingList = makeNowRecipes;
      else existingList = globalRecipes;

      const existingTitles = existingList.map(r => r.title);

      const newDishes = await fetchLlmRecipes({
        apiKey,
        mode,
        pantryItems,
        dietFilter: filter,
        searchQuery: query,
        excludeTitles: existingTitles
      });

      if (Array.isArray(newDishes) && newDishes.length > 0) {
        const updater = (prev) => {
          const map = new Map(prev.map(r => [r.title.toLowerCase().trim(), r]));
          let addedCount = 0;
          newDishes.forEach(d => {
            const key = d.title.toLowerCase().trim();
            if (!map.has(key)) {
              map.set(key, d);
              addedCount++;
            }
          });
          if (addedCount === 0 && isAppend) {
            setHasMore(false);
          }
          return Array.from(map.values());
        };

        if (mode === 'pantry') setPantryRecipes(updater);
        else if (mode === 'makenow') setMakeNowRecipes(updater);
        else setGlobalRecipes(updater);
      } else if (isAppend) {
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
      if (!isAppend) {
        setErrorMsg('Failed to generate recipes. Check your API key or try again.');
      }
    } finally {
      if (timer) clearInterval(timer);
      if (isAppend) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [activeSubTab, dietFilter, searchQuery, pantryRecipes, makeNowRecipes, globalRecipes, apiKey, pantryItems, hasMore]);

  // Pre-load on mount
  useEffect(() => {
    if (pantryRecipes.length === 0) {
      loadLlmRecipes('pantry', 'All', '', false);
    }
  }, []);

  // Handle switching subtabs: if empty, load
  const handleTabChange = (newTab) => {
    setActiveSubTab(newTab);
    setHasMore(true);
    if (newTab === 'makenow' && makeNowRecipes.length === 0) {
      loadLlmRecipes('makenow', dietFilter, searchQuery, false);
    } else if (newTab === 'global' && globalRecipes.length === 0) {
      loadLlmRecipes('global', dietFilter, searchQuery, false);
    }
  };

  // Infinite Scroll Observer
  useEffect(() => {
    if (!sentinelRef.current || loading) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMoreRef.current && hasMore) {
        loadLlmRecipes(activeSubTab, dietFilter, searchQuery, true);
      }
    }, { rootMargin: '350px' });

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loading, activeSubTab, dietFilter, searchQuery, loadLlmRecipes, hasMore]);

  let rawList = [];
  if (activeSubTab === 'pantry') rawList = pantryRecipes;
  else if (activeSubTab === 'makenow') rawList = makeNowRecipes;
  else rawList = globalRecipes;

  const currentList = rawList.filter(recipe => {
    const matchesSearch = !searchQuery.trim()
      || recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
      || recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
      || recipe.ingredientsHave?.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = dietFilter === 'All'
      || recipe.tags?.some(t => t.toLowerCase().includes(dietFilter.toLowerCase()))
      || recipe.effortLevel?.toLowerCase().includes(dietFilter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  const inStockCount = pantryItems.filter(i => i.inStock).length;

  return (
    <div className="animate-fade">
      {/* Header Card */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #FAF7F8 0%, #F3E8FF 100%)' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#1F2421', marginBottom: '4px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconBook size={20} color="var(--primary)" />
          <span>Explore Recipes</span>
        </h2>
        <p style={{ fontSize: '0.84rem', color: '#5C6460', marginBottom: '16px' }}>
          Browse recipes matched to your pantry, instant dishes with zero shopping needed, or global fusion creations.
        </p>

        {/* Subtabs (3 choices: From Pantry, Make Now 100%, Global Fusion) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '14px' }}>
          <button
            onClick={() => handleTabChange('pantry')}
            style={{
              padding: '12px 10px',
              borderRadius: '14px',
              border: `2px solid ${activeSubTab === 'pantry' ? 'var(--primary)' : 'rgba(0,0,0,0.08)'}`,
              background: activeSubTab === 'pantry' ? 'var(--primary-light)' : 'white',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
              <IconBasket size={20} color={activeSubTab === 'pantry' ? 'var(--primary)' : '#6B7280'} />
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: '700', color: activeSubTab === 'pantry' ? 'var(--primary)' : '#1F2421' }}>
              Pantry-First
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
              {inStockCount} active items ({pantryRecipes.length} loaded)
            </div>
          </button>

          <button
            onClick={() => handleTabChange('makenow')}
            style={{
              padding: '12px 10px',
              borderRadius: '14px',
              border: `2px solid ${activeSubTab === 'makenow' ? '#059669' : 'rgba(0,0,0,0.08)'}`,
              background: activeSubTab === 'makenow' ? '#ECFDF5' : 'white',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
              <IconBolt size={20} color={activeSubTab === 'makenow' ? '#059669' : '#6B7280'} />
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: '700', color: activeSubTab === 'makenow' ? '#059669' : '#1F2421' }}>
              Make Now (100%)
            </div>
            <div style={{ fontSize: '0.7rem', color: '#059669' }}>
              Zero shopping needed ({makeNowRecipes.length} loaded)
            </div>
          </button>

          <button
            onClick={() => handleTabChange('global')}
            style={{
              padding: '12px 10px',
              borderRadius: '14px',
              border: `2px solid ${activeSubTab === 'global' ? '#8B5CF6' : 'rgba(0,0,0,0.08)'}`,
              background: activeSubTab === 'global' ? '#F3E8FF' : 'white',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
              <IconGlobe size={20} color={activeSubTab === 'global' ? '#7C3AED' : '#6B7280'} />
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: '700', color: activeSubTab === 'global' ? '#7C3AED' : '#1F2421' }}>
              Global Fusion
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
              Creative world dishes ({globalRecipes.length} loaded)
            </div>
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Search by ingredient or dish (e.g. paneer, oats, spicy, dal)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && loadLlmRecipes(activeSubTab, dietFilter, searchQuery, false)}
            style={{ paddingLeft: '38px', background: 'white', width: '100%' }}
          />
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}>
            <IconSearch size={16} />
          </div>
        </div>

        {/* Diet Filter Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
          {['All', 'High Protein', 'Low Calorie', 'Quick & Easy', 'Comfort Food', 'Vegetarian'].map(filter => (
            <button
              key={filter}
              onClick={() => setDietFilter(filter)}
              className={`chip ${dietFilter === filter ? 'chip-active' : 'chip-inactive'}`}
              style={{ fontSize: '0.78rem' }}
            >
              {filter}
            </button>
          ))}
          {dietFilter !== 'All' && (
            <button
              onClick={() => setDietFilter('All')}
              style={{
                background: '#F3F4F6',
                border: 'none',
                borderRadius: '999px',
                padding: '3px 10px',
                fontSize: '0.72rem',
                color: '#4B5563',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Generate / Discover Button */}
        <button
          onClick={() => loadLlmRecipes(activeSubTab, dietFilter, searchQuery, false)}
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.92rem' }}
        >
          <IconSparkles size={16} />
          <span>
            {loading
              ? 'Asking Gemini AI...'
              : rawList.length > 0
                ? `Generate 8–10 More ${activeSubTab === 'makenow' ? 'Make Now' : activeSubTab === 'pantry' ? 'Pantry' : 'Fusion'} Recipes`
                : `Discover ${activeSubTab === 'makenow' ? 'Make Now' : activeSubTab === 'pantry' ? 'Pantry' : 'Fusion'} Recipes`}
          </span>
        </button>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="card mb-4" style={{ background: '#FEF2F2', borderColor: '#FCA5A5', border: '1.5px solid #FCA5A5', color: '#991B1B', fontSize: '0.86rem' }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {/* Loading State with Ticker */}
      {loading && (
        <div className="card mb-4 text-center" style={{ textAlign: 'center', padding: '36px 16px', background: 'linear-gradient(135deg, #FAF5FF 0%, #FFF5F7 100%)' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '50%',
            border: '4px solid #FDE8ED', borderTopColor: 'var(--primary)',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 14px'
          }} />
          <p style={{ color: '#1F2421', fontWeight: '800', fontSize: '1rem', marginBottom: '6px' }}>
            Gemini is Cooking Up Options...
          </p>
          <div style={{
            fontSize: '0.84rem',
            color: 'var(--primary)',
            fontWeight: '600',
            background: 'white',
            display: 'inline-block',
            padding: '5px 16px',
            borderRadius: '999px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            {LOADING_MESSAGES[loadingStep]}
          </div>
        </div>
      )}

      {/* Counter bar */}
      {!loading && rawList.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '0.86rem', color: '#374151', fontWeight: '600' }}>
            Showing <strong>{currentList.length}</strong> unique recipes (scroll down to load more)
            {dietFilter !== 'All' && <span style={{ color: 'var(--primary)' }}> (Filtered by: {dietFilter})</span>}
          </div>
          {currentList.length === 0 && (
            <button
              onClick={() => setDietFilter('All')}
              className="chip chip-active"
              style={{ fontSize: '0.74rem' }}
            >
              Show all {rawList.length} recipes
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && currentList.length === 0 && (
        <div className="card text-center" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            {activeSubTab === 'makenow' ? (
              <IconBolt size={36} color="#059669" />
            ) : activeSubTab === 'pantry' ? (
              <IconBasket size={36} color="var(--primary)" />
            ) : (
              <IconGlobe size={36} color="#7C3AED" />
            )}
          </div>
          <h3 style={{ fontSize: '1.05rem', color: '#1F2421', marginBottom: '6px' }}>
            {rawList.length > 0
              ? `No recipes match "${dietFilter !== 'All' ? dietFilter : searchQuery}"`
              : activeSubTab === 'makenow'
                ? 'No Make Now Recipes Loaded Yet'
                : activeSubTab === 'pantry'
                  ? 'No Pantry Recipes Loaded Yet'
                  : 'No Fusion Recipes Loaded Yet'}
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#5C6460', marginBottom: '18px', maxWidth: '360px', margin: '0 auto 18px' }}>
            {rawList.length > 0
              ? 'Try clearing your filter or click below to generate recipes tailored to this tag.'
              : 'Click below to have Gemini craft a batch of customized recipe ideas for you!'}
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {rawList.length > 0 && dietFilter !== 'All' && (
              <button
                onClick={() => setDietFilter('All')}
                className="btn-secondary"
                style={{ padding: '10px 18px', fontSize: '0.88rem' }}
              >
                Reset Filter
              </button>
            )}
            <button
              onClick={() => loadLlmRecipes(activeSubTab, dietFilter, searchQuery, false)}
              className="btn-primary"
              style={{ padding: '10px 22px', fontSize: '0.88rem' }}
            >
              <IconSparkles size={16} />
              <span>Generate Recipes Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Recipe Grid */}
      {!loading && currentList.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {currentList.map((recipe, idx) => (
              <MealCard
                key={recipe.id || `${recipe.title}-${idx}`}
                recipe={recipe}
                onSelectRecipe={onSelectRecipe}
                pantryItems={pantryItems}
              />
            ))}
          </div>

          {/* Infinite Scroll Sentinel & Bottom Controls */}
          <div ref={sentinelRef} style={{ textAlign: 'center', padding: '16px 0', minHeight: '60px' }}>
            {loadingMore && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '999px', background: 'white', border: '1.5px solid var(--primary-border)', fontSize: '0.82rem', color: 'var(--primary)', fontWeight: '700' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #FDE8ED', borderTopColor: 'var(--primary)', animation: 'spin 0.6s linear infinite' }} />
                <span>Streaming more recipes on scroll...</span>
              </div>
            )}

            {!loadingMore && hasMore && (
              <button
                onClick={() => loadLlmRecipes(activeSubTab, dietFilter, searchQuery, true)}
                className="btn-secondary"
                style={{
                  padding: '12px 28px',
                  fontSize: '0.92rem',
                  borderRadius: '16px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                  margin: '0 auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <IconSparkles size={16} />
                <span>Scroll or Click to Load 8–10 More Recipes</span>
              </button>
            )}

            {!hasMore && (
              <div style={{ fontSize: '0.82rem', color: '#9CA3AF', fontWeight: '600' }}>
                All available recipes for this category have been loaded!
              </div>
            )}
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
