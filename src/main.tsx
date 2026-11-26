import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Fonts are bundled, not fetched from Google, so the lab looks the same offline.
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/noto-sans-bengali/bengali-400.css';
import '@fontsource/noto-sans-bengali/bengali-600.css';
import '@fontsource/noto-sans-bengali/bengali-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-600.css';

import './ui/tokens.css';
import './ui/global.css';
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
