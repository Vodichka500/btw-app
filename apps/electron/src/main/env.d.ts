// apps/electron/src/main/env.d.ts (или apps/electron/src/env.d.ts)

/// <reference types="vite/client" />

declare module '*?asset' {
  const src: string
  export default src
}
