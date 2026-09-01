import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
mkdirSync(publicDir, { recursive: true });

const iconSvg = (size, radius) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${radius}" fill="url(#bg)"/>
  <g transform="translate(256 256)">
    <g transform="translate(-96 -96) scale(8)" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
    </g>
  </g>
</svg>`;

// Maskable icon needs safe-zone padding (icon content within ~80% center circle)
const maskableSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(256 256)">
    <g transform="translate(-72 -72) scale(6)" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
    </g>
  </g>
</svg>`;

const targets = [
  { name: 'pwa-64x64.png', size: 64, radius: 96, svg: iconSvg },
  { name: 'pwa-192x192.png', size: 192, radius: 96, svg: iconSvg },
  { name: 'pwa-512x512.png', size: 512, radius: 96, svg: iconSvg },
  { name: 'apple-touch-icon.png', size: 180, radius: 96, svg: iconSvg },
  { name: 'maskable-icon-512x512.png', size: 512, radius: 0, svg: maskableSvg },
];

for (const t of targets) {
  const svg = t.svg === maskableSvg ? maskableSvg(t.size) : iconSvg(t.size, t.radius);
  await sharp(Buffer.from(svg)).resize(t.size, t.size).png().toFile(join(publicDir, t.name));
  console.log('generated', t.name);
}

// favicon.ico via a 32x32 png fallback (browsers accept png-as-favicon fine, but produce .ico too)
await sharp(Buffer.from(iconSvg(32, 6))).resize(32, 32).png().toFile(join(publicDir, 'favicon.png'));
console.log('generated favicon.png');
