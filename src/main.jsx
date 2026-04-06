import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import PWAProvider from './components/PWAProvider'
import './index.css'

// Import PWA registration
import './utils/pwa'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <PWAProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </PWAProvider>
  </BrowserRouter>
)
