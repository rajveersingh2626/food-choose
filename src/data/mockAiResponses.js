import { SAMPLE_RECIPES } from './sampleRecipes.js';

export function generateOfflineWeeklyPlan(pantryItems, girlfriendWishes = '', dietFilter = 'All') {
  const pantryNames = pantryItems.filter(i => i.inStock).map(i => i.name.toLowerCase());
  
  const hasPaneer = pantryNames.some(n => n.includes('paneer'));
  const hasPoha = pantryNames.some(n => n.includes('poha'));
  const hasOats = pantryNames.some(n => n.includes('oats'));
  const hasToor = pantryNames.some(n => n.includes('toor'));
  const hasRajma = pantryNames.some(n => n.includes('rajma'));
  const hasChana = pantryNames.some(n => n.includes('chana'));
  const hasRice = pantryNames.some(n => n.includes('rice'));
  const hasAtta = pantryNames.some(n => n.includes('atta'));
  const hasCurd = pantryNames.some(n => n.includes('curd') || n.includes('yogurt'));
  const hasBread = pantryNames.some(n => n.includes('bread'));
  const hasMakhana = pantryNames.some(n => n.includes('makhana'));
  const hasRava = pantryNames.some(n => n.includes('rava'));

  const plan = {
    Monday: {
      breakfast: { title: hasPoha ? 'Kanda Batata Poha' : 'Oats Porridge with Dates & Almonds', recipeId: hasPoha ? 'rec-poha-1' : 'rec-oats-chilla', calories: 280, protein: '8g', effort: '10 mins' },
      lunch: { title: hasToor && hasRice ? 'Homestyle Toor Dal Tadka & Jeera Rice' : 'Roti with Aloo Tamatar Sabzi', recipeId: 'rec-dal-tadka', calories: 420, protein: '16g', effort: '25 mins' },
      snack: { title: hasMakhana ? 'Roasted Masala Makhana & Hot Chai' : 'Dry Fruits Bowl (Almonds & Dates)', recipeId: 'rec-masala-chai-makhana', calories: 160, protein: '5g', effort: '5 mins' },
      dinner: { title: hasPaneer && hasBread ? 'Masala Paneer Bhurji with Toast' : 'Moong Dal Khichdi with Ghee', recipeId: 'rec-paneer-bhurji', calories: 380, protein: '22g', effort: '15 mins' }
    },
    Tuesday: {
      breakfast: { title: hasOats ? 'Oats & Besan Chilla with Curd' : 'Bread Toast with Butter & Tea', recipeId: 'rec-oats-chilla', calories: 240, protein: '14g', effort: '12 mins' },
      lunch: { title: hasRajma && hasRice ? 'Punjabi Rajma Masala & Steamed Rice' : 'Curd Rice with Ginger Tempering', recipeId: 'rec-rajma-chawal', calories: 480, protein: '19g', effort: '30 mins' },
      snack: { title: 'Cardamom Ginger Tea with Biscuits', recipeId: 'rec-masala-chai-makhana', calories: 140, protein: '3g', effort: '5 mins' },
      dinner: { title: hasCurd && hasRice ? 'South Indian Curd Rice with Tempered Ghee' : 'Soft Phulkas with Paneer Gravy', recipeId: 'rec-curd-rice', calories: 290, protein: '9g', effort: '10 mins' }
    },
    Wednesday: {
      breakfast: { title: hasBread ? 'Cheese & Garlic Toast with Hot Tea' : 'Fluffy Upma with Curry Leaves', recipeId: 'rec-poha-1', calories: 310, protein: '11g', effort: '8 mins' },
      lunch: { title: hasChana ? 'Spiced Chana Masala with Phulkas' : 'Toor Dal Tadka with Steamed Rice', recipeId: 'rec-chana-chaat', calories: 410, protein: '17g', effort: '25 mins' },
      snack: { title: 'Spiced Protein Kala Chana Chaat', recipeId: 'rec-chana-chaat', calories: 260, protein: '15g', effort: '10 mins' },
      dinner: { title: hasPaneer ? 'Paneer Tikka Roll / Bhurji with Roti' : 'Masoor Dal with Jeera Rice', recipeId: 'rec-paneer-bhurji', calories: 420, protein: '24g', effort: '20 mins' }
    },
    Thursday: {
      breakfast: { title: hasPoha ? 'Indori Poha with Sev & Lemon' : 'Instant Oats & Fruit Bowl', recipeId: 'rec-poha-1', calories: 270, protein: '7g', effort: '10 mins' },
      lunch: { title: hasCurd && hasRice ? 'Soothing Curd Rice & Potato Fry' : 'Rajma Masala with Basmati Rice', recipeId: 'rec-curd-rice', calories: 340, protein: '10g', effort: '15 mins' },
      snack: { title: 'Roasted Almonds & Dates with Instant Coffee', recipeId: 'rec-masala-chai-makhana', calories: 180, protein: '6g', effort: '3 mins' },
      dinner: { title: 'Aromatic Yellow Dal Tadka & Jeera Rice', recipeId: 'rec-dal-tadka', calories: 400, protein: '15g', effort: '20 mins' }
    },
    Friday: {
      breakfast: { title: 'Oats & Curd Savory Smoothie / Pancakes', recipeId: 'rec-oats-chilla', calories: 260, protein: '12g', effort: '8 mins' },
      lunch: { title: 'Rajma Chawal with Onion Cucumber Salad', recipeId: 'rec-rajma-chawal', calories: 480, protein: '19g', effort: '30 mins' },
      snack: { title: 'Masala Roasted Makhana with Hot Tea', recipeId: 'rec-masala-chai-makhana', calories: 160, protein: '5g', effort: '6 mins' },
      dinner: { title: 'Paneer Bhurji & Buttered Toast', recipeId: 'rec-paneer-bhurji', calories: 380, protein: '22g', effort: '12 mins' }
    },
    Saturday: {
      breakfast: { title: 'Desi Butter Toast & Ginger Elaichi Chai', recipeId: 'rec-masala-chai-makhana', calories: 290, protein: '7g', effort: '5 mins' },
      lunch: { title: 'Chickpea Chana Chaat Bowl (High Protein)', recipeId: 'rec-chana-chaat', calories: 320, protein: '18g', effort: '10 mins' },
      snack: { title: 'Cashew Almond Energy Mix', recipeId: 'rec-masala-chai-makhana', calories: 200, protein: '6g', effort: '2 mins' },
      dinner: { title: 'Special Dal Tadka & Jeera Rice with Ghee', recipeId: 'rec-dal-tadka', calories: 430, protein: '16g', effort: '25 mins' }
    },
    Sunday: {
      breakfast: { title: 'Kanda Poha with Roasted Peanuts & Lemon', recipeId: 'rec-poha-1', calories: 280, protein: '7g', effort: '10 mins' },
      lunch: { title: 'Special Sunday Rajma Masala & Rice', recipeId: 'rec-rajma-chawal', calories: 490, protein: '20g', effort: '35 mins' },
      snack: { title: 'Hot Cappuccino / Chai with Rusks', recipeId: 'rec-masala-chai-makhana', calories: 150, protein: '4g', effort: '5 mins' },
      dinner: { title: 'Light Curd Rice & Masala Paneer', recipeId: 'rec-curd-rice', calories: 350, protein: '18g', effort: '15 mins' }
    }
  };

  // Identify Missing Items that would make her weekly plan 10x better!
  const missingSuggestions = [];
  if (!pantryNames.some(n => n.includes('lemon'))) missingSuggestions.push({ name: 'Fresh Lemons', reason: 'For fresh zing on Poha, Chana Chaat & Curd Rice', priority: 'High' });
  if (!pantryNames.some(n => n.includes('coriander leaves'))) missingSuggestions.push({ name: 'Fresh Coriander (Dhania)', reason: 'For aromatic herb garnishing on all curries & dals', priority: 'High' });
  if (!pantryNames.some(n => n.includes('cucumber') || n.includes('capsicum'))) missingSuggestions.push({ name: 'Cucumber & Bell Peppers', reason: 'Great for fresh salads & crunchy stir-fries', priority: 'Medium' });
  if (!pantryNames.some(n => n.includes('peanut'))) missingSuggestions.push({ name: 'Raw Peanuts', reason: 'For crunch in Poha & Poha Chilla', priority: 'Medium' });
  if (!pantryNames.some(n => n.includes('fruit'))) missingSuggestions.push({ name: 'Fresh Apples / Bananas', reason: 'Great low-cal additions for breakfast oats', priority: 'Medium' });

  return {
    plan,
    missingSuggestions,
    pantryMatchScore: 88,
    notes: girlfriendWishes ? `Tailored specifically to Suhanu's wish: "${girlfriendWishes}"` : "Optimized for maximum comfort, high protein, and low kitchen effort!"
  };
}

export function generateOfflineMoodSuggestions(mood, effort, craving, pantryItems) {
  const pantryNames = pantryItems.filter(i => i.inStock).map(i => i.name.toLowerCase());

  let items = [...SAMPLE_RECIPES];

  if (effort === '5min') {
    items = items.filter(r => r.effortRating === 1 || r.prepTime.includes('5') || r.cookTime.includes('0') || r.cookTime.includes('5'));
  }

  if (craving === 'protein') {
    items.sort((a, b) => parseInt(b.protein) - parseInt(a.protein));
  } else if (craving === 'lowcal') {
    items.sort((a, b) => a.calories - b.calories);
  } else if (craving === 'sweet') {
    items = items.filter(r => r.tags.includes('Snack') || r.title.includes('Chai') || r.title.includes('Oats'));
  }

  return {
    aiGreeting: getCustomGreeting(mood, effort),
    recommendations: items.slice(0, 3),
    chefTip: getChefTip(mood, effort)
  };
}

function getCustomGreeting(mood, effort) {
  if (mood === 'tired' || effort === '5min') {
    return "Aww Suhanu, you sound a bit tired today! ❤️ Don't worry at all—I've handpicked the absolute LOWEST-EFFORT, super tasty meals you can make in under 10 minutes!";
  } else if (mood === 'energetic') {
    return "Love the energy, Suhanu! 🌟 Here are some high-protein, delicious dishes that will fuel your day perfectly!";
  } else if (mood === 'cozy') {
    return "Cozy vibes today! ☕ Here are warm, comforting dishes that feel like a gentle hug in a bowl.";
  } else {
    return "Hey Suhanu! ✨ Here are the best dish recommendations crafted just for your appetite right now!";
  }
}

function getChefTip(mood, effort) {
  if (effort === '5min') {
    return "Pro Tip for Suhanu: Keep pre-soaked chana or boiled potatoes in the fridge, or try the 5-minute Masala Paneer Toast—zero mess, total deliciousness!";
  }
  return "Pro Tip: Top your warm dish with half a spoon of Desi Ghee for ultimate comfort and rich flavor!";
}
