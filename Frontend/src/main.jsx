import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { MockAppProvider } from './context/MockAppContext'
import { ToastProvider } from './context/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'

import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "446181259368-e60g9uuqblo11citseptu3ic4ltpilkg.apps.googleusercontent.com"; // Fallback to hardcoded if env missing

// --- Global Fetch Interceptor for JWT Token ---
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  if (typeof resource === 'string' && resource.includes('/api/')) {
    const token = localStorage.getItem('planora_token');
    if (token) {
      config = config || {};
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
      args[1] = config;
    }
  }
  return originalFetch(...args);
};
// ----------------------------------------------

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <MockAppProvider>
          <ToastProvider>
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <App />
            </GoogleOAuthProvider>
          </ToastProvider>
        </MockAppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
