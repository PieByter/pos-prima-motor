import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Auto-load .env.local if DATABASE_URL not already in env
if (!process.env.DATABASE_URL) {
    const envPath = resolve('.env.local')
    if (existsSync(envPath)) {
        const lines = readFileSync(envPath, 'utf8').split('\n')
        for (const line of lines) {
            const match = line.match(/^([A-Z_]+)=(.*)$/)
            if (match) {
                const [, key, value] = match
                if (!process.env[key]) process.env[key] = value.replace(/^["']|["']$/g, '')
            }
        }
    }
}

/**
 * Auto-migration script.
 *
 * - Fresh DB → drizzle migrate() creates all tables + tracks in drizzle.__drizzle_migrations
 * - Existing DB (no drizzle tracking yet) → manually records 0000 as applied,
 *   then runs any further pending migrations.
 * - Already tracked → drizzle migrate() applies only new migrations.
 */
async function runMigrations() {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
        console.warn('⚠️  DATABASE_URL tidak ditemukan, skip migrasi.')
        return
    }

    console.log('⏳ Auto-migration: mengecek...')

    const client = postgres(connectionString, {
        max: 1,
        connect_timeout: 10,
        prepare: false,
    })

    try {
        // Check if drizzle tracking exists
        const [trackRow] = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'
      ) AS exists
    `
        const isTracked = trackRow?.exists ?? false

        if (!isTracked) {
            // Check if DB has manual tables
            const [tableRow] = await client`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'items'
        ) AS exists
      `

            if (tableRow?.exists) {
                console.log('📦 Database existing — bootstrapping drizzle tracking...')
                // Create drizzle schema + migrations table
                await client`CREATE SCHEMA IF NOT EXISTS drizzle`
                await client`
          CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
            id SERIAL PRIMARY KEY,
            hash TEXT NOT NULL,
            created_at BIGINT
          )
        `
                // Mark base migrations as applied (their effects already in DB)
                const { readFileSync } = await import('fs')
                const { resolve } = await import('path')
                const { createHash } = await import('crypto')
                const baseMigrations = ['0000_furry_mystique.sql', '0001_dry_red_skull.sql']
                for (const name of baseMigrations) {
                    const filePath = resolve('./drizzle', name)
                    const hash = createHash('sha256').update(readFileSync(filePath, 'utf8')).digest('hex')
                    await client`
            INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
            VALUES (${hash}, ${Date.now()})
          `
                }
                console.log('   ✅ 0000 & 0001 marked as applied (already exist in DB).')
            } else {
                console.log('🆕 Database baru — menjalankan semua migration...')
            }
        } else {
            console.log('🔄 Menjalankan pending migration...')
        }

        // Now run drizzle migrate — it will apply any remaining migrations
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
