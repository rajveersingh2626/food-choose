import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import Navigation from './components/Navigation.jsx';
import PantryManager from './components/PantryManager.jsx';
import WeeklyPlanner from './components/WeeklyPlanner.jsx';
import MoodChat from './components/MoodChat.jsx';
import RecipeLibrary from './components/RecipeLibrary.jsx';
import RecipeModal from './components/RecipeModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import { SUHANU_INITIAL_PANTRY } from './data/suhanuInitialPantry.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('pantry'); // Default is Pantry & Groceries
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Read Gemini API key securely from environment variable (.env) or localStorage
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('suhanu_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  });

  const [pantryItems, setPantryItems] = useState(() => {
    const saved = localStorage.getItem('suhanu_pantry_items_v4');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return SUHANU_INITIAL_PANTRY;
      }
    }
    return SUHANU_INITIAL_PANTRY;
  });

  useEffect(() => {
    localStorage.setItem('suhanu_pantry_items_v4', JSON.stringify(pantryItems));
  }, [pantryItems]);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('suhanu_gemini_key', apiKey);
    }
  }, [apiKey]);

  const handleResetToDefault = () => {
    setPantryItems(SUHANU_INITIAL_PANTRY);
    localStorage.setItem('suhanu_pantry_items_v4', JSON.stringify(SUHANU_INITIAL_PANTRY));
  };

  return (
    <div className="app-wrapper">
      {/* Top Banner Header - Spans full width */}
      <Header />

      {/* Main 2-Column Layout */}
      <div className="main-layout">
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <main className="main-content">
          {activeTab === 'pantry' && (
            <PantryManager
              pantryItems={pantryItems}
              setPantryItems={setPantryItems}
              onResetToDefault={handleResetToDefault}
            />
          )}

          {activeTab === 'planner' && (
            <WeeklyPlanner
              pantryItems={pantryItems}
              apiKey={apiKey}
              onSelectRecipe={(recipe) => setSelectedRecipe(recipe)}
            />
          )}

          {activeTab === 'mood' && (
            <MoodChat
              pantryItems={pantryItems}
              apiKey={apiKey}
              onSelectRecipe={(recipe) => setSelectedRecipe(recipe)}
            />
          )}

          {activeTab === 'recipes' && (
            <RecipeLibrary
              pantryItems={pantryItems}
              apiKey={apiKey}
              onSelectRecipe={(recipe) => setSelectedRecipe(recipe)}
            />
          )}
        </main>
      </div>

      <RecipeModal
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        pantryItems={pantryItems}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        onResetAll={handleResetToDefault}
      />
    </div>
  );
}
