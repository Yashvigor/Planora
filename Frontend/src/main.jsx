import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { MockAppProvider } from './context/MockAppContext'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <MockAppProvider>
          <App />
        </MockAppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
