import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { TrpcProvider } from '@/lib/trpc-provider'
import { AppInitializer } from '@/components/features/update/app-initializer'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TrpcProvider>
      <AppInitializer>
        <App />
      </AppInitializer>
    </TrpcProvider>
  </StrictMode>
)
