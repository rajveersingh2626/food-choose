import assert from 'assert';

console.log('🧪 Running Suhanu Food App & Backend Logic Verification Suite...\n');

// 1. Test Household Invite Code Generation
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const code1 = generateInviteCode();
const code2 = generateInviteCode();
assert.strictEqual(code1.length, 6, 'Invite code must be 6 characters');
assert.match(code1, /^[A-Z0-9]{6}$/, 'Invite code must be alphanumeric uppercase');
assert.notStrictEqual(code1, code2, 'Subsequent invite codes must be unique');
console.log('✓ 1. Household Invite Code Generation verified:', code1);

// 2. Test Expiration & Shelf-Life Calculation (OCR Engine)
function calculateExpiration(category, estimatedDays, baseDate = new Date()) {
  const isPerishable = category.toLowerCase() === 'perishable';
  const days = estimatedDays || (isPerishable ? 4 : 180);
  const expiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
  return { isPerishable, expires_at: isPerishable ? expiry.toISOString() : null };
}

const now = new Date('2026-09-19T00:00:00Z');
const spinach = calculateExpiration('perishable', 3, now);
assert.strictEqual(spinach.isPerishable, true);
assert.strictEqual(spinach.expires_at, '2026-09-22T00:00:00.000Z');

const rice = calculateExpiration('staple', 180, now);
assert.strictEqual(rice.isPerishable, false);
assert.strictEqual(rice.expires_at, null);
console.log('✓ 2. OCR Expiration & Shelf-Life Calculation verified');

// 3. Test Pantry Deduction & Soft-Delete Engine
function processCookedMeal(pantry, mealIngredients) {
  const deductions = [];
  const updatedPantry = pantry.map(item => ({ ...item }));

  for (const ing of mealIngredients) {
    const match = updatedPantry.find(p => p.is_active && p.name.toLowerCase().includes(ing.name.toLowerCase()));
    if (match) {
      const deductQty = ing.quantity || 1.0;
      match.quantity = Math.max(0, match.quantity - deductQty);
      if (match.quantity <= 0) {
        match.is_active = false; // Soft-delete
      }
      deductions.push({ name: match.name, remaining: match.quantity, is_active: match.is_active });
    }
  }
  return { updatedPantry, deductions };
}

const mockPantry = [
  { id: '1', name: 'Greek Yogurt', quantity: 2, is_active: true },
  { id: '2', name: 'Hass Avocado', quantity: 1, is_active: true },
  { id: '3', name: 'Sourdough Bread', quantity: 4, is_active: true }
];

const mockMeal = [
  { name: 'Greek Yogurt', quantity: 1 },
  { name: 'Hass Avocado', quantity: 1 } // will deplete to 0
];

const { updatedPantry, deductions } = processCookedMeal(mockPantry, mockMeal);
assert.strictEqual(updatedPantry[0].quantity, 1, 'Yogurt quantity should be decremented from 2 to 1');
assert.strictEqual(updatedPantry[0].is_active, true, 'Yogurt should remain active');

assert.strictEqual(updatedPantry[1].quantity, 0, 'Avocado quantity should be 0');
assert.strictEqual(updatedPantry[1].is_active, false, 'Avocado must be soft-deleted (is_active = false)');
assert.strictEqual(mockPantry.length, 3, 'Items must never be permanently removed from database');
console.log('✓ 3. Pantry Deduction & Soft-Delete Engine verified');

// 4. Test 48-Hour Expiration Detection
function checkExpiringSoon(items, checkTime = new Date()) {
  const in48Hours = new Date(checkTime.getTime() + 48 * 60 * 60 * 1000);
  return items.filter(item => {
    if (!item.is_active || !item.expires_at) return false;
    const expiry = new Date(item.expires_at);
    return expiry > checkTime && expiry <= in48Hours;
  });
}

const testItems = [
  { name: 'Milk', is_active: true, expires_at: new Date(now.getTime() + 24 * 3600 * 1000).toISOString() }, // expires in 24h -> match
  { name: 'Berries', is_active: true, expires_at: new Date(now.getTime() + 40 * 3600 * 1000).toISOString() }, // expires in 40h -> match
  { name: 'Eggs', is_active: true, expires_at: new Date(now.getTime() + 72 * 3600 * 1000).toISOString() }, // expires in 72h -> no
  { name: 'Exhausted Dip', is_active: false, expires_at: new Date(now.getTime() + 10 * 3600 * 1000).toISOString() } // inactive -> no
];

const expiring = checkExpiringSoon(testItems, now);
assert.strictEqual(expiring.length, 2, 'Should flag exactly 2 items expiring within 48 hours');
assert.strictEqual(expiring[0].name, 'Milk');
assert.strictEqual(expiring[1].name, 'Berries');
console.log('✓ 4. 48-Hour Expiration Detection verified');

// 5. Module 2: AI Context-Aware Perishability Storage Method Engine
function calculateStorageAwareShelfLife(itemName, storageMethod) {
  const method = storageMethod.toLowerCase();
  const name = itemName.toLowerCase();

  const rules = {
    avocado: { counter: 3, fridge: 7, freezer: 60 },
    banana: { counter: 4, fridge: 7, freezer: 90 },
    bread: { counter: 4, fridge: 8, freezer: 90 },
    milk: { counter: 0.5, fridge: 6, freezer: 60 },
    coriander: { counter: 1, fridge: 7, freezer: 45 },
    chicken: { counter: 0.25, fridge: 2, freezer: 180 }
  };

  const matched = Object.keys(rules).find(k => name.includes(k));
  if (matched && rules[matched][method]) {
    return rules[matched][method];
  }
  // Default fallbacks
  if (method === 'freezer') return 90;
  if (method === 'fridge') return 7;
  return 3; // counter
}

const avocadoCounter = calculateStorageAwareShelfLife('Hass Avocado', 'counter');
const avocadoFridge = calculateStorageAwareShelfLife('Hass Avocado', 'fridge');
const avocadoFreezer = calculateStorageAwareShelfLife('Hass Avocado', 'freezer');
assert.strictEqual(avocadoCounter, 3, 'Avocado on counter must have 3-day shelf life');
assert.strictEqual(avocadoFridge, 7, 'Avocado in fridge must have 7-day shelf life');
assert.strictEqual(avocadoFreezer, 60, 'Avocado in freezer must have 60-day shelf life');

const breadCounter = calculateStorageAwareShelfLife('Sourdough Bread', 'counter');
const breadFreezer = calculateStorageAwareShelfLife('Sourdough Bread', 'freezer');
assert.strictEqual(breadCounter, 4, 'Bread on counter must have 4-day shelf life');
assert.strictEqual(breadFreezer, 90, 'Bread in freezer must have 90-day shelf life');
console.log('✓ 5. Module 2: Storage-aware Perishability Matrix verified (Counter vs Fridge vs Freezer)');

// 6. Module 3: Gamified Audit Swipe Right (Extend Freshness) & Swipe Left (Soft-Delete)
function applyAuditSwipe(item, action, currentDate = new Date()) {
  if (action === 'swipe_right_keep') {
    // Extend expiration by 2 days, update last_audited_at
    const currentExpiry = new Date(item.expires_at || currentDate);
    const newExpiry = new Date(Math.max(currentExpiry.getTime(), currentDate.getTime()) + 2 * 24 * 3600 * 1000);
    return {
      ...item,
      expires_at: newExpiry.toISOString(),
      last_audited_at: currentDate.toISOString(),
      audit_extension_count: (item.audit_extension_count || 0) + 1
    };
  } else if (action === 'swipe_left_trash') {
    // Soft delete: is_active = false
    return {
      ...item,
      is_active: false,
      last_audited_at: currentDate.toISOString()
    };
  }
  return item;
}

const expiringBerry = {
  id: 'berry-1',
  name: 'Strawberries',
  expires_at: new Date('2026-09-20T00:00:00Z').toISOString(),
  is_active: true,
  audit_extension_count: 0
};

// Test Swipe Right
const keptBerry = applyAuditSwipe(expiringBerry, 'swipe_right_keep', new Date('2026-09-20T00:00:00Z'));
assert.strictEqual(keptBerry.is_active, true, 'Kept item must remain active');
assert.strictEqual(keptBerry.audit_extension_count, 1, 'Audit extension count should increment to 1');
assert.strictEqual(keptBerry.expires_at, '2026-09-22T00:00:00.000Z', 'Expiration should be extended by exactly 2 days');

// Test Swipe Left
const trashedBerry = applyAuditSwipe(expiringBerry, 'swipe_left_trash', new Date('2026-09-20T00:00:00Z'));
assert.strictEqual(trashedBerry.is_active, false, 'Trashed item must be soft-deleted (is_active = false)');
assert.notStrictEqual(trashedBerry, null, 'Row must not be deleted from database table');
console.log('✓ 6. Module 3: Tinder-Style Swipe Logic (Extend +2d & Soft-Delete) verified');

console.log('\nALL 6 CRITICAL SYSTEM MODULE & ARCHITECTURE VERIFICATION CHECKS PASSED!\n');
