// CAPA: Presentación
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';

const root = document.getElementById('root');

if (!root) {
    throw new Error('No se encontró el contenedor React #root.');
}

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>
);
