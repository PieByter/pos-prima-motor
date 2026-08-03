import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'

config({ path: '.env.local' })

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Wajib pakai DIRECT connection (port 5432), bukan pooled (6543) —
    // PgBouncer transaction mode tidak mendukung prepared statements untuk DDL.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
})
