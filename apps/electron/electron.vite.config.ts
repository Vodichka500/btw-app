import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    // 👇 1. Заставляем Vite собрать код из shared внутрь main.js
    plugins: [externalizeDepsPlugin({ exclude: ['@btw-app/shared'] })],
    resolve: {
      alias: {
        // 👇 2. Указываем правильный путь к папке shared в монорепо
        '@btw-app/shared': resolve(__dirname, '../../packages/shared/src'),
        // Оставляем старый алиас для совместимости, если где-то еще остался
        '@shared': resolve(__dirname, '../../packages/shared/src')
      }
    }
  },
  preload: {
    // 👇 3. То же самое для preload скриптов
    plugins: [externalizeDepsPlugin({ exclude: ['@btw-app/shared'] })],
    resolve: {
      alias: {
        '@btw-app/shared': resolve(__dirname, '../../packages/shared/src'),
        '@shared': resolve(__dirname, '../../packages/shared/src')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src/renderer/src'),
        // 👇 4. Алиас для рендера (React)
        '@btw-app/shared': resolve(__dirname, '../../packages/shared/src'),
        '@shared': resolve(__dirname, '../../packages/shared/src')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
