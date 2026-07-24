import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Vite only exposes .env values via `import.meta.env` by default, which means
  // server-side code can't read e.g. `process.env.DATABASE_URL`. Surface every
  // loaded env var onto process.env (without clobbering real process env) so
  // the database client and other server modules can use it normally.
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of Object.keys(env)) {
    if (env[key] && !(key in process.env)) {
      process.env[key] = env[key]
    }
  }

  return {
    resolve: { tsconfigPaths: true },
    plugins: [
      devtools(),
      // cloudflare({ viteEnvironment: { name: 'ssr' } }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
  }
})
