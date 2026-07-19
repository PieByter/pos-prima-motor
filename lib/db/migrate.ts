import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

/**
 * Auto-migration script — seperti Flyway.
 *
 * Cara kerja:
 * 1. Cek apakah tabel `__drizzle_migrations` sudah ada
 * 2. Jika BELUM ada:
 *    - Cek apakah tabel utama (items, customers, dll) sudah ada
 *    - Jika SUDAH ada (existing DB) → tandai migration yg sudah ada sebagai applied
 *    - Jika BELUM ada (fresh DB) → jalankan migration normal
 * 3. Jika SUDAH ada → jalankan `migrate()` untuk apply migration baru
 */
async function runMigrations() {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
        console.warn('⚠️  DATABASE_URL tidak ditemukan, skip migrasi.')
        return
    }

    console.log('⏳ Auto-migration: mengecek status database...')

    const client = postgres(connectionString, {
        max: 1,
        connect_timeout: 10,
        prepare: false,
    })

    try {
        // Cek apakah tabel __drizzle_migrations sudah ada
        const [row] = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = '__drizzle_migrations'
      ) AS exists
    `
        const hasMigrationTable = row?.exists ?? false

        if (!hasMigrationTable) {
            // Cek apakah tabel items sudah ada (indikasi existing database)
            const [tableCheck] = await client`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'items'
        ) AS exists
      `
            const hasExistingTables = tableCheck?.exists ?? false

            if (hasExistingTables) {
                console.log('📦 Database sudah memiliki tabel — skip migrasi awal, tandai sebagai applied...')
                // Buat tabel __drizzle_migrations dan tandai migration yg ada sbg applied
                await client`
          CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
            id SERIAL PRIMARY KEY,
            hash TEXT NOT NULL,
            created_at BIGINT
          )
        `
                // Cari semua file migration di folder drizzle/
                const { readdirSync, existsSync } = await import('fs')
                const { resolve } = await import('path')
                const { createHash } = await import('crypto')
                const drizzleDir = resolve('./drizzle')

                if (existsSync(drizzleDir)) {
                    const files = readdirSync(drizzleDir)
                        .filter(f => f.endsWith('.sql'))
                        .sort()

                    for (const file of files) {
                        const fileHash = createHash('md5').update(file).digest('hex')
                        await client`
              INSERT INTO "__drizzle_migrations" (hash, created_at)
              VALUES (${fileHash}, ${Date.now()})
            `
                    }
                    console.log(`✅ ${files.length} migration(s) ditandai sebagai sudah applied.`)
                }
            } else {
                // Database baru — jalankan migration normal
                console.log('🆕 Database baru — menjalankan migration...')
                const db = drizzle(client)
                await migrate(db, { migrationsFolder: './drizzle' })
                console.log('✅ Migration selesai.')
            }
        } else {
            // Sudah pernah migrate — jalankan pending migration
            console.log('🔄 Menjalankan pending migration...')
            const db = drizzle(client)
            await migrate(db, { migrationsFolder: './drizzle' })
            console.log('✅ Migration selesai.')
        }
    } catch (err) {
        console.error('❌ Migration gagal:', err)
        process.exit(1)
    } finally {
        await client.end()
    }
}

runMigrations()
