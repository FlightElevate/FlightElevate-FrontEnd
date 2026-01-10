import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RolesProvider } from './context/RolesContext';
import { ToastContainer } from 'react-toastify';

// Suppress browser extension errors in console
const originalError = console.error;
console.error = (...args) => {
  const errorMessage = args[0]?.toString() || '';
  // Filter out browser extension errors
  if (
    errorMessage.includes('runtime.lastError') ||
    errorMessage.includes('message port closed') ||
    errorMessage.includes('Extension context invalidated')
  ) {
    return; // Suppress these errors
  }
  originalError.apply(console, args);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <RolesProvider>
        <App />
        <ToastContainer />
      </RolesProvider>
    </AuthProvider>
  </BrowserRouter>
);
