import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AppGate } from './components/AppGate.tsx'
import { AuthProvider } from './components/AuthProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppGate>
          <App />
        </AppGate>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
