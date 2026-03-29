import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'
import { AccentThemeProvider } from '@/hooks/useAccentTheme'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
const clerkJsUrl = import.meta.env.VITE_CLERK_JS_URL as string | undefined

if (!clerkPublishableKey) {
  throw new Error('VITE_CLERK_PUBLISHABLE_KEY is required.')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccentThemeProvider>
      <ClerkProvider publishableKey={clerkPublishableKey} clerkJSUrl={clerkJsUrl}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    </AccentThemeProvider>
  </StrictMode>,
)
