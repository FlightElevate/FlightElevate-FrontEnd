import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RolesProvider } from './context/RolesContext';
import { ToastContainer } from 'react-toastify';


// Suppress browser extension errors that are harmless
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  const errorMessage = args[0]?.toString() || '';
  
  if (
    errorMessage.includes('runtime.lastError') ||
    errorMessage.includes('message port closed') ||
    errorMessage.includes('Extension context invalidated') ||
    errorMessage.includes('Unchecked runtime.lastError')
  ) {
    return; 
  }
  originalError.apply(console, args);
};

console.warn = (...args) => {
  const warnMessage = args[0]?.toString() || '';
  
  if (
    warnMessage.includes('runtime.lastError') ||
    warnMessage.includes('message port closed') ||
    warnMessage.includes('Extension context invalidated') ||
    warnMessage.includes('Unchecked runtime.lastError')
  ) {
    return; 
  }
  originalWarn.apply(console, args);
};

// Suppress unhandled errors from browser extensions
window.addEventListener('error', (event) => {
  const errorMessage = event.message?.toString() || '';
  if (
    errorMessage.includes('runtime.lastError') ||
    errorMessage.includes('message port closed') ||
    errorMessage.includes('Extension context invalidated') ||
    errorMessage.includes('Unchecked runtime.lastError')
  ) {
    event.preventDefault();
    return false;
  }
});

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
