import { createAuthClient } from 'better-auth/react'
import type { auth } from '@btw-app/server'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import { API_URL } from '@/lib/config'

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [inferAdditionalFields<typeof auth>()],
  fetchOptions: {
    auth: {
      type: 'Bearer',
      token: () => localStorage.getItem('session_token') || ''
    }
  }
})
