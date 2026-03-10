import { z } from 'zod'

export const authCredentialsSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
})

export type AuthCredentials = z.infer<typeof authCredentialsSchema>

// Ответ при успешном логине
export const authResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string(),
  })
})

