import { useState } from 'react';
import { playSfx } from '../audio/audio';
import { Icon } from '../ui/Icon';

/** M0 placeholder: the identity on screen and one button that makes a sound. */
export function App() {
  const [pops, setPops] = useState(0);

  return (
    <main className="placeholder">
      <h1 className="placeholder__title">Pocket Town</h1>
      <button
        type="button"
        className="toy-button toy-button--primary"
        aria-label="Play"
        onClick={() => {
          playSfx('pop');
          setPops((n) => n + 1);
        }}
      >
        {/* Re-keying restarts the little bounce on every tap. */}
        <span key={pops} className="toy-button__face" data-bounce={pops > 0 || undefined}>
          <Icon name="play" size={48} strokeWidth={3} />
        </span>
      </button>
    </main>
  );
}
