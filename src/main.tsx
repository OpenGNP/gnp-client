import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AlertDialogHost } from './components/AlertDialogHost.tsx'
import { AppGate } from './components/AppGate.tsx'
import { AuthProvider } from './components/AuthProvider.tsx'
import { MaybeMsalProvider } from './components/MaybeMsalProvider.tsx'
import { EmailLoginPage, LoginPage } from './pages/LoginPage.tsx'
import { PrivacyPage, TermsPage } from './pages/LegalPage.tsx'
import { PublicFormPage } from './pages/PublicFormPage.tsx'
import { queryClient } from './lib/queryClient.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Respondent view — no login, no admin shell, so it sits outside AuthProvider/AppGate.
              Routed by the form's unguessable public token, not its sequential id. */}
          <Route path="/f/:token" element={<PublicFormPage />} />
          {/* Readable without signing in: linked from login and from forms. */}
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route
            path="*"
            element={
              <MaybeMsalProvider>
                <AuthProvider>
                  {/* /login sits inside AuthProvider (so it can call useAuth().login) but
                      outside AppGate — AppGate redirects signed-out visitors *to* /login,
                      so it can't also be the thing gating /login itself. */}
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/login/email" element={<EmailLoginPage />} />
                    <Route
                      path="*"
                      element={
                        <AppGate>
                          <App />
                        </AppGate>
                      }
                    />
                  </Routes>
                </AuthProvider>
              </MaybeMsalProvider>
            }
          />
        </Routes>
        <AlertDialogHost />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
