import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { InfluxDatabaseProvider } from './context/InfluxDatabaseContext';
import { LocalAuthProvider } from './context/LocalAuthContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocalAuthProvider>
      <InfluxDatabaseProvider>
        <App />
      </InfluxDatabaseProvider>
    </LocalAuthProvider>
  </StrictMode>
);