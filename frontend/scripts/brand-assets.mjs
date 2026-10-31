// Regenerates favicons, app icons and the link-preview image from the brand logos in public/.
// Source files: public/logo.svg (mark) and public/logo-with-text.svg (wordmark). Run: node scripts/brand-assets.mjs
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const pub = (f) => new URL(`../public/${f}`, import.meta.url);
const NAVY = '#00006E';
const ACCENT = '#FF6200';

// Crop the artboards down to the artwork so the logos sit flush in the UI.
const withViewBox = (svg, [x, y, w, h]) =>
  svg.replace(/<svg[^>]*>/, (tag) =>
    tag.replace(/width="[^"]*"/, `width="${w}"`).replace(/height="[^"]*"/, `height="${h}"`).replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${w} ${h}"`),
  );

const mark = await readFile(pub('logo.svg'), 'utf8');
const wordmark = await readFile(pub('logo-with-text.svg'), 'utf8');
const markSvg = withViewBox(mark, [178, 88, 898, 1088]);
const wordmarkSvg = withViewBox(wordmark, [48, 200, 1194, 440]);
const squareSvg = withViewBox(mark, [77, 82, 1100, 1100]);

await writeFile(pub('logo-mark.svg'), markSvg);
await writeFile(pub('logo-wordmark.svg'), wordmarkSvg);
await writeFile(pub('favicon.svg'), squareSvg);

const png = (svg, size) => sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toBuffer();

/** The mark centred on a solid square, scaled to `scale` of the side. */
async function onTile(size, scale, background = '#ffffff') {
  const inner = Math.round(size * scale);
  const art = await sharp(Buffer.from(markSvg), { density: 300 }).resize(inner, inner, { fit: 'contain', background: '#0000' }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: art, gravity: 'centre' }])
    .png()
    .toBuffer();
}

// favicon.ico holding 16, 32 and 48 px PNGs.
const icoSizes = [16, 32, 48];
const icoImages = await Promise.all(icoSizes.map((s) => png(squareSvg, s)));
const header = Buffer.alloc(6 + 16 * icoImages.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoImages.length, 4);
let offset = header.length;
icoImages.forEach((img, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(icoSizes[i], e);
  header.writeUInt8(icoSizes[i], e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(img.length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += img.length;
});
await writeFile(pub('favicon.ico'), Buffer.concat([header, ...icoImages]));

await writeFile(pub('icon-192.png'), await png(squareSvg, 192));
await writeFile(pub('icon-512.png'), await png(squareSvg, 512));
await writeFile(pub('apple-touch-icon.png'), await onTile(180, 0.72));
await writeFile(pub('icon-maskable-512.png'), await onTile(512, 0.6)); // inside the 80% safe zone

// 1200×630 link preview: wordmark on white, tagline below.
const wm = await sharp(Buffer.from(wordmarkSvg), { density: 300 }).resize({ width: 640 }).png().toBuffer();
const { height: wmH } = await sharp(wm).metadata();
const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <style>text { font-family: 'Segoe UI', Arial, sans-serif; }</style>
  <text x="96" y="${150 + wmH + 70}" font-size="44" font-weight="700" fill="${NAVY}">Sherik toping. Ijarani bo'lishing.</text>
  <text x="96" y="${150 + wmH + 128}" font-size="28" fill="#5b6475">Toshkent · Samarqand · Buxoro · vositachisiz</text>
  <rect x="0" y="618" width="1200" height="12" fill="${ACCENT}"/>
</svg>`);
const og = await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#ffffff' } })
  .composite([{ input: wm, left: 84, top: 120 }, { input: text, left: 0, top: 0 }])
  .png()
  .toBuffer();
await writeFile(pub('og-image.png'), og);

console.log('Brand assets written to public/');
