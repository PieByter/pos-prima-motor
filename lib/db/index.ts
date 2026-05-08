import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Use a global singleton to avoid exhausting connection pool in dev (Next.js hot reload)
declare global {
  // eslint-disable-next-line no-var
  var _pgClient: ReturnType<typeof postgres> | undefined
}

const connectionString = process.env.DATABASE_URL!

const client =
  global._pgClient ??
  postgres(connectionString, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  })

if (process.env.NODE_ENV !== 'production') {
  global._pgClient = client
}

export const db = drizzle(client, { schema })
