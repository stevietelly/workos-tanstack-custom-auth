import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    SERVER_URL: z.string().url().optional(),
    DATABASE_URL: z.string().url().optional(),
    WORKOS_API_KEY: z.string().optional(),
    WORKOS_CLIENT_ID: z.string().optional(),
    WORKOS_COOKIE_PASSWORD: z.string().optional(),
    PAYSTACK_SECRET_KEY: z.string().optional(),
    PAYSTACK_PRO_KES_PLAN: z.string().optional(),
    PAYSTACK_PRO_USD_PLAN: z.string().optional(),
    PAYSTACK_ENT_KES_PLAN: z.string().optional(),
    PAYSTACK_ENT_USD_PLAN: z.string().optional(),
    CRON_SECRET: z.string().optional(),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: 'VITE_',

  client: {
    VITE_APP_TITLE: z.string().min(1).optional(),
    VITE_WORKOS_CLIENT_ID: z.string().min(1),
    VITE_WORKOS_API_HOSTNAME: z.string().min(1),
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv: import.meta.env,

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,
})
