// CAPA: Presentación
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { SEED_VERSION } from './data/seed.js';
import { Storage } from './infrastructure/storage.js';
import './styles/global.css';

const root = document.getElementById('root');

if (!root) {
    throw new Error('No se encontró el contenedor React #root.');
}

Storage.reiniciarSiVersionCambio(SEED_VERSION);

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>
);
