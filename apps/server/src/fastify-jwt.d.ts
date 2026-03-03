import '@fastify/jwt'

declare module 'fastify' {
  interface FastifyRequest {
    jwtVerify(): Promise<void>

    user: {
      id: number
      email: string
    }
  }
}