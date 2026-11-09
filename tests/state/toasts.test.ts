import { describe, expect, it } from 'vitest';
import { useUi } from '../../src/state/ui';

describe('little messages (toasts)', () => {
  it('the same message tapped again shows once, not stacked', () => {
    useUi.setState({ toasts: [] });
    for (let i = 0; i < 3; i++) useUi.getState().toast('pencil', 'To change it, tap the pencil');
    expect(useUi.getState().toasts).toHaveLength(1);
    useUi.getState().toast('check', 'Something else');
    expect(useUi.getState().toasts).toHaveLength(2);
  });
});
