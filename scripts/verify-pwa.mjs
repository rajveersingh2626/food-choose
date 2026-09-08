// Automated PWA & Mobile Audit Verification Script
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('--- SUHANU FOOD AI PWA & MOBILE AUDIT ---');

// 1. Check index.html
const indexHtml = fs.readFileSync(path.resolve('./index.html'), 'utf8');
assert(indexHtml.includes('manifest.webmanifest'), 'index.html links to manifest.webmanifest');
assert(indexHtml.includes('viewport-fit=cover'), 'index.html has viewport-fit=cover for mobile screens');
assert(indexHtml.includes('apple-mobile-web-app-capable'), 'index.html has apple-mobile-web-app-capable');
assert(indexHtml.includes('apple-touch-icon'), 'index.html links to apple-touch-icon');
assert(indexHtml.includes('theme-color'), 'index.html defines theme-color');

// 2. Check manifest.webmanifest
const manifestPath = path.resolve('./public/manifest.webmanifest');
assert(fs.existsSync(manifestPath), 'manifest.webmanifest exists in public/');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert(manifest.name && manifest.name.length > 0, 'Manifest has valid name');
assert(manifest.short_name && manifest.short_name.length > 0, 'Manifest has short_name');
assert(manifest.start_url === '/#/mood', 'Manifest start_url is /#/mood for subpage routing');
assert(manifest.display === 'standalone', 'Manifest display is standalone (app mode)');
assert(manifest.icons && manifest.icons.length >= 4, `Manifest defines ${manifest.icons.length} icon variations`);
assert(manifest.shortcuts && manifest.shortcuts.length === 4, 'Manifest defines 4 app shortcuts for subpages');

// 3. Check Service Worker
const swPath = path.resolve('./public/sw.js');
assert(fs.existsSync(swPath), 'sw.js exists in public/');
const swContent = fs.readFileSync(swPath, 'utf8');
assert(swContent.includes("self.addEventListener('install'"), 'sw.js has install event listener');
assert(swContent.includes("self.addEventListener('activate'"), 'sw.js has activate event listener');
assert(swContent.includes("self.addEventListener('fetch'"), 'sw.js has fetch caching strategy');

// 4. Check Icons
const iconFiles = [
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'icon.svg'
];
for (const icon of iconFiles) {
  const p = path.resolve('./public/icons', icon);
  assert(fs.existsSync(p) && fs.statSync(p).size > 0, `Icon public/icons/${icon} exists and is non-empty`);
}

// 5. Check Dist Build Output
const distIndex = path.resolve('./dist/index.html');
const distManifest = path.resolve('./dist/manifest.webmanifest');
const distSw = path.resolve('./dist/sw.js');
assert(fs.existsSync(distIndex), 'dist/index.html built');
assert(fs.existsSync(distManifest), 'dist/manifest.webmanifest bundled');
assert(fs.existsSync(distSw), 'dist/sw.js bundled');

console.log(`\nAUDIT COMPLETE: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);
