// A thing's picture as an image URL (each its own SVG, so their inner ids never
// clash), drawn large enough to stay crisp on the stage and on big screens.
import { thingArt } from './thingArt';

const cache = new Map<string, string>();

export function pictureUrl(name: string): string {
  const hit = cache.get(name);
  if (hit) return hit;
  const art = thingArt[name];
  const svg = art
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 ${art.w} ${art.h}">${art.body}</svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 32 32"></svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  cache.set(name, url);
  return url;
}
