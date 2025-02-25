import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Controllo dell'ambiente per il debug
if (process.env.NODE_ENV === 'development') {
    console.log('⚡ Modalità sviluppo attivata!');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
