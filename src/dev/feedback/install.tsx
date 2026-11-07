// Entry for the play-testing tool. main.tsx imports this only on the dev server in
// feedback mode (`npm run feedback`), so none of it reaches a build.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { listen } from './api';
import { recordTrail, UI_ATTR } from './capture';
import { FeedbackLayer } from './FeedbackLayer';
import { restoreWhere } from './restore';
import './feedback.css';

export function install(): void {
  recordTrail();
  listen();
  void restoreWhere();
  const host = document.createElement('div');
  host.setAttribute(UI_ATTR, '');
  document.body.append(host);
  createRoot(host).render(
    <StrictMode>
      <FeedbackLayer />
    </StrictMode>,
  );
}
