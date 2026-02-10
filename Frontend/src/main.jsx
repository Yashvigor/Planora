import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { MockAppProvider } from './context/MockAppContext'
import ErrorBoundary from './components/ErrorBoundary'

import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "446181259368-e60g9uuqblo11citseptu3ic4ltpilkg.apps.googleusercontent.com"; // Fallback to hardcoded if env missing


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <MockAppProvider>
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <App />
          </GoogleOAuthProvider>
        </MockAppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
