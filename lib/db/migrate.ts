import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { config } from 'dotenv'

// Load .env.local (same as drizzle.config.ts)
config({ path: '.env.local' })

/**
 * Programmatic migration runner — dipanggil manual atau di CI/CD sebelum deploy.
 *
 * Wajib pakai DIRECT_URL (direct connection, port 5432), bukan DATABASE_URL
 * (pooled, port 6543) — PgBouncer transaction mode tidak mendukung prepared
 * statements yang dibutuhkan migrator untuk DDL.
 */
async function runMigrations() {
    const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL

    if (!connectionString) {
        console.warn('⚠️  DIRECT_URL/DATABASE_URL tidak ditemukan, skip migrasi.')
        return
    }

    console.log('⏳ Menjalankan pending migration...')

    const client = postgres(connectionString, {
        max: 1,
        connect_timeout: 10,
        prepare: false,
    })

    try {
        const db = drizzle(client)
        await migrate(db, { migrationsFolder: './drizzle' })
        console.log('✅ Migration selesai.')
    } catch (err) {
        console.error('❌ Migration gagal:', err)
        process.exit(1)
    } finally {
        await client.end()
    }
}

runMigrations()
