// Generates the app icons in public/ from the house glyph in src/design/icons.ts:
// a tomato rounded square with the glyph in white. Run with `npm run icons`
// after changing the glyph or colours; the output is committed.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { ICON_STROKE, icons } from '../src/design/icons.ts';
import { color } from '../src/design/tokens.ts';

const outDir = fileURLToPath(new URL('../public/', import.meta.url));

interface IconSpec {
  /** Corner radius as a fraction of the size; 0 = full-bleed square. */
  corner: number;
  /** Glyph box (the 32-unit icon grid) as a fraction of the size. */
  glyph: number;
}

function iconSvg(size: number, { corner, glyph }: IconSpec): string {
  const scale = (size * glyph) / 32;
  const offset = (size - size * glyph) / 2;
  const r = size * corner;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${color.tomato}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <path d="${icons.house}" fill="none" stroke="#FFFFFF" stroke-width="${ICON_STROKE}"
      stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
`;
}

const rounded: IconSpec = { corner: 0.22, glyph: 0.72 };
const fullBleed: IconSpec = { corner: 0, glyph: 0.66 };
// Maskable icons are cropped to a circle of 80% diameter; keep the glyph well inside.
const maskable: IconSpec = { corner: 0, glyph: 0.56 };

const pngs: [file: string, size: number, spec: IconSpec][] = [
  ['pwa-192.png', 192, rounded],
  ['pwa-512.png', 512, rounded],
  ['pwa-maskable-512.png', 512, maskable],
  ['apple-touch-icon.png', 180, fullBleed],
  ['favicon-32.png', 32, rounded],
];

await mkdir(outDir, { recursive: true });
await writeFile(`${outDir}favicon.svg`, iconSvg(64, rounded));
for (const [file, size, spec] of pngs) {
  await sharp(Buffer.from(iconSvg(size, spec)))
    .png({ compressionLevel: 9 })
    .toFile(`${outDir}${file}`);
  console.log(`wrote public/${file}`);
}
