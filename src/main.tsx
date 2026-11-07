import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design/fonts.css';
import './styles.css';
import { App } from './app/App';
import { installAudioUnlock } from './audio/audio';
import { applyTokenCssVars } from './design/cssVars';

applyTokenCssVars();
installAudioUnlock();

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
