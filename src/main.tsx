import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design/fonts.css';
import './styles.css';
import './ui/ui.css';
import './app/app.css';
import { App } from './app/App';
import { installAudioUnlock } from './audio/audio';
import { comeBack, startGame } from './app/game';
import { sim } from './app/simRunner';
import { applyTokenCssVars } from './design/cssVars';
import { requestPersistentStorage } from './persist/idbStorage';

applyTokenCssVars();
installAudioUnlock();
void requestPersistentStorage();

// The town lives on while the app is open; it rests while the page is hidden.
// (`?still` freezes it for deterministic screenshots.)
void startGame();
if (!new URLSearchParams(location.search).has('still')) {
  sim.start();
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      sim.stop();
    } else {
      // Back after a while: the town lived on; show what happened.
      if (hiddenAt > 0) comeBack(sim.world, Date.now() - hiddenAt);
      sim.start();
    }
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

// Kid play-testing tool: dev server in feedback mode only, never in a build.
if (import.meta.env.DEV && import.meta.env.MODE.startsWith('feedback')) {
  void import('./dev/feedback/install').then((m) => m.install());
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
