import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@renderer': resolve('src/renderer/src'),
        '@btw-app/shared': resolve('../../packages/shared/index.ts'),
        '@prisma/client': resolve(__dirname, './fake-prisma.ts'),
        '@btw-app/db/client': resolve(__dirname, './fake-prisma.ts'), // Перехват Zod
        '@btw-app/db/zod': resolve('../../packages/db/src/zod/index.ts') // Прямой путь к схемам
      }
    },
    optimizeDeps: {
      exclude: ['@prisma/client', '.prisma/client/index-browser', '@btw-app/db/client']
    },
    plugins: [react(), tailwindcss()]
  }
})
