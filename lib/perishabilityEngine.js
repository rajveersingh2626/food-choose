import { ai } from '@/lib/gemini';
import { Type } from '@google/genai';

/**
 * Baseline scientific shelf-life matrix (in days) indexed by normalized food category.
 * Key: [storage_method]: days
 */
export const STORAGE_SHELF_LIFE_MATRIX = {
  avocado: { counter: 3, fridge: 7, freezer: 60 },
  milk: { counter: 0.5, fridge: 5, freezer: 90 },
  bread: { counter: 4, fridge: 7, freezer: 90 },
  sourdough: { counter: 4, fridge: 7, freezer: 90 },
  coriander: { counter: 1, fridge: 5, freezer: 30 },
  herbs: { counter: 1, fridge: 5, freezer: 30 },
  spinach: { counter: 1, fridge: 4, freezer: 60 },
  greens: { counter: 1, fridge: 4, freezer: 60 },
  lettuce: { counter: 1, fridge: 5, freezer: 0 },
  berries: { counter: 1.5, fridge: 5, freezer: 180 },
  strawberries: { counter: 1.5, fridge: 5, freezer: 180 },
  blueberries: { counter: 2, fridge: 7, freezer: 180 },
  yogurt: { counter: 0.5, fridge: 8, freezer: 30 },
  curd: { counter: 0.5, fridge: 6, freezer: 30 },
  paneer: { counter: 1, fridge: 5, freezer: 60 },
  cheese_hard: { counter: 4, fridge: 25, freezer: 180 },
  cheese_soft: { counter: 1, fridge: 6, freezer: 60 },
  butter: { counter: 7, fridge: 60, freezer: 180 },
  eggs: { counter: 7, fridge: 28, freezer: 180 },
  tomatoes: { counter: 5, fridge: 10, freezer: 90 },
  bananas: { counter: 4, fridge: 7, freezer: 60 },
  apples: { counter: 7, fridge: 28, freezer: 180 },
  onions: { counter: 30, fridge: 45, freezer: 180 },
  potatoes: { counter: 21, fridge: 30, freezer: 180 },
  mushrooms: { counter: 1, fridge: 5, freezer: 30 },
  chicken: { counter: 0.25, fridge: 2, freezer: 180 },
  meat: { counter: 0.25, fridge: 2, freezer: 180 },
  fish: { counter: 0.25, fridge: 2, freezer: 90 },
  tofu: { counter: 0.5, fridge: 6, freezer: 60 },
  rice_cooked: { counter: 0.5, fridge: 4, freezer: 90 },
  pasta_dry: { counter: 365, fridge: 365, freezer: 365 },
  rice_dry: { counter: 365, fridge: 365, freezer: 365 },
  coffee: { counter: 30, fridge: 60, freezer: 180 }
};

/**
 * Resolves matched baseline item from name substring
 */
function findMatrixMatch(itemName) {
  const clean = itemName.toLowerCase().trim();
  for (const [key, values] of Object.entries(STORAGE_SHELF_LIFE_MATRIX)) {
    if (clean.includes(key)) {
      return { key, values };
    }
  }
  return null;
}

/**
 * Calculates dynamic expiration timestamp based on item name and chosen storage method.
 * Uses local fast-lookup matrix, falling back to Gemini for unlisted/complex artisanal foods.
 *
 * @param {string} itemName
 * @param {'fridge'|'freezer'|'counter'} storageMethod
 * @param {Date} [addedDate=new Date()]
 * @returns {Promise<{
 *   shelfLifeDays: number,
 *   expiresAt: string,
 *   category: 'perishable'|'staple',
 *   recommendedStorage: 'fridge'|'freezer'|'counter',
 *   isAmbiguous: boolean
 * }>}
 */
export async function calculateDynamicExpiration(itemName, storageMethod = 'fridge', addedDate = new Date()) {
  const normStorage = ['fridge', 'freezer', 'counter'].includes(storageMethod) ? storageMethod : 'fridge';
  const match = findMatrixMatch(itemName);

  if (match) {
    const days = match.values[normStorage] ?? 7;
    const expiry = new Date(addedDate.getTime() + days * 24 * 60 * 60 * 1000);
    const isPerishable = days < 60;

    // Items like avocado, bread, tomatoes are notoriously ambiguous where users store them
    const ambiguousItems = ['avocado', 'bread', 'sourdough', 'tomatoes', 'bananas', 'coffee', 'eggs', 'butter'];
    const isAmbiguous = ambiguousItems.some(term => itemName.toLowerCase().includes(term));

    return {
      shelfLifeDays: days,
      expiresAt: expiry.toISOString(),
      category: isPerishable ? 'perishable' : 'staple',
      recommendedStorage: match.values.fridge > match.values.counter ? 'fridge' : 'counter',
      isAmbiguous
    };
  }

  // Fallback to Gemini AI for unique/artisanal items (e.g. "Truffle Burrata Dip", "Kimchi", "Cold Brew Blend")
  try {
    const prompt = `
Analyze culinary perishability for: "${itemName}".
User chose storage method: "${normStorage}".
Calculate:
1. shelf_life_days: estimated consumable days when stored in ${normStorage}.
2. category: "perishable" or "staple".
3. recommended_storage: "fridge", "freezer", or "counter".
4. is_ambiguous: boolean (true if people frequently store it either in fridge or counter, e.g. avocado, tomatoes, bread).

Return strict JSON matching the schema.`;

    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shelf_life_days: { type: Type.NUMBER },
            category: { type: Type.STRING },
            recommended_storage: { type: Type.STRING },
            is_ambiguous: { type: Type.BOOLEAN }
          },
          required: ['shelf_life_days', 'category', 'recommended_storage', 'is_ambiguous']
        }
      }
    });

    const parsed = JSON.parse(res.text);
    const days = Math.max(0.5, Number(parsed.shelf_life_days) || 7);
    const expiry = new Date(addedDate.getTime() + days * 24 * 60 * 60 * 1000);

    return {
      shelfLifeDays: days,
      expiresAt: expiry.toISOString(),
      category: parsed.category?.toLowerCase() === 'perishable' ? 'perishable' : 'staple',
      recommendedStorage: ['fridge', 'freezer', 'counter'].includes(parsed.recommended_storage) ? parsed.recommended_storage : 'fridge',
      isAmbiguous: Boolean(parsed.is_ambiguous)
    };
  } catch (err) {
    console.warn('Perishability AI estimation fallback:', err.message);
    const defaultDays = normStorage === 'freezer' ? 90 : normStorage === 'fridge' ? 7 : 3;
    const expiry = new Date(addedDate.getTime() + defaultDays * 24 * 60 * 60 * 1000);
    return {
      shelfLifeDays: defaultDays,
      expiresAt: expiry.toISOString(),
      category: 'perishable',
      recommendedStorage: 'fridge',
      isAmbiguous: true
    };
  }
}
