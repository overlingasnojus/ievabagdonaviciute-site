import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './preload'; // start loading section fonts and the portrait right away
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
