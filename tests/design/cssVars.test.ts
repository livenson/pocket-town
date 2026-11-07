import { describe, expect, it } from 'vitest';
import { tokenCssVars } from '../../src/design/cssVars';
import { color } from '../../src/design/tokens';

describe('tokenCssVars', () => {
  it('exposes colours and sizes as --pt-* variables', () => {
    const vars = tokenCssVars();
    expect(vars['--pt-tomato']).toBe(color.tomato);
    expect(vars['--pt-tomato-shadow']).toBe(color.tomatoShadow);
    expect(vars['--pt-radius-xl']).toBe('32px');
    expect(vars['--pt-touch-min']).toBe('44px');
  });
});
