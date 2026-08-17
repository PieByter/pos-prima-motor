// ═══════════════════════════════════════════════════════════════════════════════
// Schema barrel — semua tabel & relations di-re-export dari sini.
// drizzle.config.ts menunjuk ke file ini; import di app pakai '@/lib/db/schema'.
// ═══════════════════════════════════════════════════════════════════════════════

export * from './profiles'
export * from './master-data'
export * from './customers'
export * from './purchases'
export * from './sales'
export * from './stock'
export * from './finance'
export * from './warranty'
export * from './activity'
export * from './estimates'
