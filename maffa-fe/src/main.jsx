// main.jsx — React entry point
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import { DesktopProvider } from './context/DesktopContext.jsx';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DesktopProvider>
      <App />
    </DesktopProvider>
  </React.StrictMode>
);
