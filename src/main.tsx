import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AppGate } from './components/AppGate.tsx'
import { AuthProvider } from './components/AuthProvider.tsx'
import { PublicFormPage } from './pages/PublicFormPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Respondent view — no login, no admin shell, so it sits outside AuthProvider/AppGate. */}
        <Route path="/forms/:id/public" element={<PublicFormPage />} />
        <Route
          path="*"
          element={
            <AuthProvider>
              <AppGate>
                <App />
              </AppGate>
            </AuthProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
