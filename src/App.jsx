import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import Navigation from './components/Navigation.jsx';
import PantryManager from './components/PantryManager.jsx';
import WeeklyPlanner from './components/WeeklyPlanner.jsx';
import MoodChat from './components/MoodChat.jsx';
import RecipeLibrary from './components/RecipeLibrary.jsx';
import RecipeModal from './components/RecipeModal.jsx';
import ApiKeyModal from './components/ApiKeyModal.jsx';
import PwaInstallPrompt from './components/PwaInstallPrompt.jsx';
import AuthModal from './components/AuthModal.jsx';
import AccountModal from './components/AccountModal.jsx';
import { supabaseService } from './services/supabaseService.js';
import { IconSparkles } from './components/Icons.jsx';
import { SUHANU_INITIAL_PANTRY, GROCERY_PRESETS } from './data/suhanuInitialPantry.js';

// Parse active tab and recipe from URL hash for subpage routing
function parseHashRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/');
  const tab = parts[0] || 'mood';
  const validTabs = ['mood', 'planner', 'recipes', 'pantry'];
  const activeTab = validTabs.includes(tab) ? tab : 'mood';
  const isRecipeModal = parts[1] === 'recipe';
  const recipeId = isRecipeModal ? decodeURIComponent(parts[2] || '') : null;
  return { activeTab, recipeId };
}

export default function App() {
  // Initialize subpage tab from URL hash if present
  const [activeTab, setActiveTab] = useState(() => {
    return parseHashRoute().activeTab;
  });
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Monitor Supabase Auth Session
  useEffect(() => {
    supabaseService.getCurrentSession()
      .then(session => {
        if (session?.user) setUser(session.user);
      })
      .catch(err => console.debug('No active session:', err));

    const { data: authListener } = supabaseService.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Gemini API key — prioritize .env, fallback to localStorage
  const [apiKey, setApiKey] = useState(() => {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey && envKey.trim()) {
      localStorage.setItem('suhanu_gemini_key', envKey.trim());
      return envKey.trim();
    }
    return localStorage.getItem('suhanu_gemini_key') || '';
  });

  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    if (newKey) {
      localStorage.setItem('suhanu_gemini_key', newKey);
    } else {
      localStorage.removeItem('suhanu_gemini_key');
    }
  };

  // User's custom pantry state — persistent in localStorage
  const [pantryItems, setPantryItems] = useState(() => {
    const saved = localStorage.getItem('suhanu_pantry_items_v4');
    if (saved) {
      try { return JSON.parse(saved); }
      catch (e) { return SUHANU_INITIAL_PANTRY; }
    }
    return SUHANU_INITIAL_PANTRY;
  });

  // Active Pantry Context profile — allows user to select which pantry context is active across the site
  const [activePresetId, setActivePresetId] = useState(() => {
    return localStorage.getItem('suhanu_active_pantry_preset') || 'custom';
  });

  useEffect(() => {
    localStorage.setItem('suhanu_pantry_items_v4', JSON.stringify(pantryItems));
  }, [pantryItems]);

  useEffect(() => {
    localStorage.setItem('suhanu_active_pantry_preset', activePresetId);
  }, [activePresetId]);

  // Synchronize URL Hash Subpages & Hardware Back Button
  useEffect(() => {
    const handleHashChange = () => {
      const { activeTab: newTab, recipeId } = parseHashRoute();
      setActiveTab(newTab);
      // If user hit Back and closed recipe modal
      if (!recipeId) {
        setSelectedRecipe(null);
      }
    };

    if (!window.location.hash) {
      window.location.hash = `#/${activeTab}`;
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  // Navigate to a new subpage
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setSelectedRecipe(null);
    window.location.hash = `#/${tabId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Open recipe modal with deep-linking support
  const handleOpenRecipe = useCallback((recipe) => {
    setSelectedRecipe(recipe);
    if (recipe?.title) {
      const safeTitle = encodeURIComponent(recipe.title.replace(/\s+/g, '-'));
      window.location.hash = `#/${activeTab}/recipe/${safeTitle}`;
    }
  }, [activeTab]);

  // Close recipe modal & restore tab hash
  const handleCloseRecipe = useCallback(() => {
    setSelectedRecipe(null);
    if (window.location.hash.includes('/recipe/')) {
      window.location.hash = `#/${activeTab}`;
    }
  }, [activeTab]);

  const handleResetToDefault = () => {
    setPantryItems(SUHANU_INITIAL_PANTRY);
    localStorage.setItem('suhanu_pantry_items_v4', JSON.stringify(SUHANU_INITIAL_PANTRY));
  };

  // Derive active pantry items based on user's active context selection
  const activePantryItems = React.useMemo(() => {
    if (activePresetId === 'custom') return pantryItems;
    const preset = GROCERY_PRESETS.find(p => p.id === activePresetId);
    return preset ? preset.items : pantryItems;
  }, [activePresetId, pantryItems]);

  const apiOk = Boolean(apiKey && apiKey.trim().length > 15);

  return (
    <div className="app-wrapper">
      <Header
        apiOk={apiOk}
        onOpenApiKeyModal={() => setIsKeyModalOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        activePresetId={activePresetId}
        onSelectPreset={setActivePresetId}
        pantryItems={pantryItems}
        activePantryItems={activePantryItems}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
      />

      <div className="main-layout">
        <Navigation activeTab={activeTab} setActiveTab={handleTabChange} />

        <main className="main-content">
          {/* API Key prompt banner — shown if offline */}
          {!apiOk && (
            <div className="api-key-banner mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706'
                }}>
                  <IconSparkles size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#92400E', marginBottom: '2px' }}>
                    Connect Your Free Gemini AI Key
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#B45309' }}>
                    Unlock real-time personalized AI recipe creation in 30 seconds (no credit card needed).
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(true)}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              >
                Connect Free AI Key
              </button>
            </div>
          )}

          {activeTab === 'mood' && (
            <MoodChat
              pantryItems={activePantryItems}
              apiKey={apiKey}
              onSelectRecipe={handleOpenRecipe}
            />
          )}

          {activeTab === 'planner' && (
            <WeeklyPlanner
              pantryItems={activePantryItems}
              apiKey={apiKey}
              onSelectRecipe={handleOpenRecipe}
            />
          )}

          {activeTab === 'recipes' && (
            <RecipeLibrary
              pantryItems={activePantryItems}
              apiKey={apiKey}
              onSelectRecipe={handleOpenRecipe}
            />
          )}

          {activeTab === 'pantry' && (
            <PantryManager
              pantryItems={pantryItems}
              setPantryItems={setPantryItems}
              onResetToDefault={handleResetToDefault}
              activePresetId={activePresetId}
              onSelectPreset={setActivePresetId}
              householdId={user?.household_id || null}
            />
          )}
        </main>
      </div>

      {/* Recipe Details Modal */}
      <RecipeModal
        recipe={selectedRecipe}
        onClose={handleCloseRecipe}
        pantryItems={activePantryItems}
      />

      {/* Gemini API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        currentKey={apiKey}
        onSaveKey={handleSaveApiKey}
      />

      {/* PWA Install Modal */}
      {isInstallModalOpen && (
        <PwaInstallPrompt
          onClose={() => setIsInstallModalOpen(false)}
          onInstalled={() => setIsInstallModalOpen(false)}
        />
      )}

      {/* User Auth Modal (Sign In / Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(authedUser) => setUser(authedUser)}
      />

      {/* User Account & Kitchen Sharing Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        user={user}
        onSignOut={() => {
          supabaseService.signOut().catch(() => {});
          setUser(null);
        }}
        onHouseholdChanged={() => {
          // Trigger any household update if needed
        }}
      />
    </div>
  );
}
