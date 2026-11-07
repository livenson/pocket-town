import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design/fonts.css';
import './styles.css';
import './ui/ui.css';
import './app/app.css';
import { App } from './app/App';
import { installAudioUnlock } from './audio/audio';
import { startGame } from './app/game';
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
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) sim.stop();
    else sim.start();
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
