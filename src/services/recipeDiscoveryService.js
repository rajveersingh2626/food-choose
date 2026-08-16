import { SAMPLE_RECIPES } from '../data/sampleRecipes.js';

const DISCOVERY_IMAGES = [
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80'
];

export async function fetchMoreInfiniteRecipes(existingCount, apiKey) {
  if (apiKey && apiKey.trim() !== '') {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate 3 unique, delicious, healthy Indian or fusion recipes. Return strictly JSON format without markdown codeblocks:
[
  {
    "id": "rec-auto-${Date.now()}-1",
    "title": "Dish Name",
    "prepTime": "5 mins",
    "cookTime": "10 mins",
    "effortLevel": "0-5 Mins Effort",
    "calories": 300,
    "protein": "15g",
    "carbs": "35g",
    "fat": "8g",
    "tags": ["High Protein", "Quick & Easy"],
    "description": "Short delicious description",
    "ingredientsHave": ["Ingredient 1", "Ingredient 2"],
    "ingredientsNeed": ["Extra 1"],
    "instructions": ["Step 1", "Step 2", "Step 3"]
  }
]`
            }]
          }]
        })
      });

      const data = await response.json();
      let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(rawText);
        return parsed.map((item, idx) => ({
          ...item,
          image: DISCOVERY_IMAGES[(existingCount + idx) % DISCOVERY_IMAGES.length]
        }));
      }
    } catch (err) {
      console.warn('Live discovery failed, using dynamic generator:', err);
    }
  }

  // Dynamic Offline Generator for continuous infinite scrolling
  const syntheticTitles = [
    { title: 'Tofu & Veggie Garlic Stir-fry', protein: '18g', calories: 270, tag: 'High Protein', time: '10 mins' },
    { title: 'Spiced Moong Dal Chilla Roll', protein: '16g', calories: 250, tag: 'Low Calorie', time: '12 mins' },
    { title: 'Honey Garlic Roasted Makhana Mix', protein: '8g', calories: 180, tag: 'Quick Snack', time: '5 mins' },
    { title: 'Creamy Paneer & Spinach Wrap', protein: '20g', calories: 340, tag: 'High Protein', time: '15 mins' },
    { title: 'Lemon Mint Iced Cooler & Nuts', protein: '5g', calories: 130, tag: 'Refreshing', time: '3 mins' }
  ];

  return syntheticTitles.map((item, idx) => ({
    id: `rec-inf-${existingCount + idx}-${Date.now()}`,
    title: item.title,
    image: DISCOVERY_IMAGES[(existingCount + idx) % DISCOVERY_IMAGES.length],
    prepTime: '5 mins',
    cookTime: item.time,
    effortLevel: `${item.time} Effort`,
    calories: item.calories,
    protein: item.protein,
    carbs: '30g',
    fat: '7g',
    tags: [item.tag, 'Quick & Easy'],
    description: `A delicious, wholesome ${item.title.toLowerCase()} crafted fresh for Suhanu.`,
    ingredientsHave: ['Main Pantry Ingredients', 'Spices', 'Butter/Oil'],
    ingredientsNeed: ['Fresh Herbs'],
    instructions: [
      'Prepare ingredients and heat a pan over medium flame.',
      'Sauté aromatics until golden and add fresh spices.',
      'Stir in main ingredients, cook for 5 minutes, and serve hot!'
    ]
  }));
}
