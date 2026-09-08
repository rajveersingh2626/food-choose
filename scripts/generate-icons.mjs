// Pure Node.js PNG and SVG icon generator
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crcData = Buffer.alloc(4 + len);
  crcData.write(type, 0, 4, 'ascii');
  data.copy(crcData, 4);
  const crc = crc32(crcData);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function generatePng(size) {
  const width = size;
  const height = size;
  
  const rowLen = 1 + width * 4;
  const rawData = Buffer.alloc(rowLen * height);

  const cx = width / 2;
  const cy = height / 2;
  const rDome = width * 0.28;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // Filter: none
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;

      const cornerR = width * 0.22;
      const qx = Math.max(0, Math.abs(x - cx) - (cx - cornerR));
      const qy = Math.max(0, Math.abs(y - cy) - (cy - cornerR));
      const cornerDist = Math.sqrt(qx * qx + qy * qy);

      if (cornerDist > cornerR) {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
        continue;
      }

      // Base Gradient: #F093A9 to #E7829A
      const t = (x + y) / (width + height);
      let r = Math.round(240 - t * 25);
      let g = Math.round(147 - t * 40);
      let b = Math.round(169 - t * 36);

      const knobDist = Math.sqrt(dx * dx + (dy + rDome * 0.85) * (dy + rDome * 0.85));
      const isKnob = knobDist < width * 0.045;
      const isDome = dy < width * 0.05 && dy > -rDome * 0.85 && Math.sqrt(dx * dx + (dy * dy * 1.5)) < rDome;
      const isPlate = Math.abs(dy - width * 0.08) < width * 0.028 && Math.abs(dx) < width * 0.32;
      const isPlateLip = Math.abs(dy - width * 0.12) < width * 0.016 && Math.abs(dx) < width * 0.22;

      const sx = dx - width * 0.22;
      const sy = dy + width * 0.22;
      const isSparkle = (Math.abs(sx) < width * 0.018 && Math.abs(sy) < width * 0.065) ||
                        (Math.abs(sy) < width * 0.018 && Math.abs(sx) < width * 0.065);

      if (isKnob || isDome || isPlate || isPlateLip || isSparkle) {
        rawData[pxOffset] = 255;
        rawData[pxOffset + 1] = 255;
        rawData[pxOffset + 2] = 255;
        rawData[pxOffset + 3] = 255;
      } else {
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressedData = zlib.deflateSync(rawData);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function generateSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F093A9"/>
      <stop offset="50%" stop-color="#E7829A"/>
      <stop offset="100%" stop-color="#D76B85"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#bgGrad)" />
  <g fill="#FFFFFF">
    <circle cx="256" cy="170" r="18" />
    <path d="M250 186 h12 v12 h-12 z" />
    <path d="M130 300 C130 205 186 195 256 195 C326 195 382 205 382 300 Z" />
    <rect x="110" y="308" width="292" height="22" rx="11" />
    <rect x="156" y="336" width="200" height="12" rx="6" opacity="0.85" />
    <path d="M370 150 L374 166 L390 170 L374 174 L370 190 L366 174 L350 170 L366 166 Z" />
    <path d="M140 180 L142 192 L154 194 L142 196 L140 208 L138 196 L126 194 L138 192 Z" opacity="0.8" />
  </g>
</svg>`;
}

const outDir = path.resolve('./public/icons');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'icon-192.png'), generatePng(192));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), generatePng(512));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), generatePng(180));

const svgContent = generateSvg();
fs.writeFileSync(path.join(outDir, 'icon.svg'), svgContent);
fs.writeFileSync(path.join(outDir, 'icon-192.svg'), svgContent);
fs.writeFileSync(path.join(outDir, 'icon-512.svg'), svgContent);

console.log('Successfully generated PWA icons.');
