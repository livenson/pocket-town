import { color, font, motion, radius, size } from './tokens';

const kebab = (s: string): string => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Design tokens as CSS custom properties (`--pt-tomato`, `--pt-radius-lg`, ...). */
export function tokenCssVars(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [k, v] of Object.entries(color)) vars[`--pt-${kebab(k)}`] = v;
  for (const [k, v] of Object.entries(radius)) vars[`--pt-radius-${kebab(k)}`] = `${v}px`;
  for (const [k, v] of Object.entries(size)) vars[`--pt-${kebab(k)}`] = `${v}px`;
  vars['--pt-font-display'] = font.display;
  vars['--pt-font-body'] = font.body;
  vars['--pt-ease'] = motion.ease;
  vars['--pt-press-ms'] = `${motion.press}ms`;
  return vars;
}

/** Write the token variables onto an element (the document root by default). */
export function applyTokenCssVars(el: HTMLElement = document.documentElement): void {
  for (const [k, v] of Object.entries(tokenCssVars())) el.style.setProperty(k, v);
}
