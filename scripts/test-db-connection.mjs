/**
 * Cek koneksi database (untuk migrasi / debug).
 *
 * Cara pakai:
 *   node scripts/test-db-connection.mjs
 *
 * Tes yang dilakukan:
 *   1. Parsing DIRECT_URL & DATABASE_URL dari .env.local (tanpa menampilkan password)
 *   2. Koneksi langsung ke DIRECT_URL (port 5432 / session mode)
 *   3. Koneksi ke DATABASE_URL (port 6543 / transaction mode)
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

function mask(url) {
  if (!url) return "(tidak ada)";
  return url.replace(/:\/\/[^:@]+:[^@]+@/, "://USER:PASS@");
}

function parse(url) {
  if (!url) return null;
  const m = url.match(/^([^:]+):\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  return m
    ? {
        scheme: m[1],
        user: m[2],
        passLen: m[3].length,
        host: m[4],
        port: m[5],
        db: m[6],
      }
    : null;
}

async function tryConnect(label, url) {
  const info = parse(url);
  if (!info) {
    console.log(`SKIP ${label}: URL tidak bisa di-parse (${mask(url)})`);
    return false;
  }
  console.log(
    `→ ${label}: ${info.host}:${info.port} db=${info.db} user=${info.user} (pass ${info.passLen} char)`,
  );

  const sql = postgres(url, {
    max: 1,
    connect_timeout: 15,
    ssl: { servername: info.host, rejectUnauthorized: false },
  });
  try {
    const r = await sql`select 1 as ok, now() as waktu`;
    console.log(`✅ ${label}: KONEKSI OK → ${JSON.stringify(r)}`);
    return true;
  } catch (e) {
    console.log(`❌ ${label}: GAGAL → ${e.message}`);
    return false;
  } finally {
    await sql.end({ timeout: 3 }).catch(() => {});
  }
}

console.log("=== TEST KONEKSI DATABASE ===\n");
const directOk = await tryConnect(
  "DIRECT_URL  (5432, untuk migrasi)",
  process.env.DIRECT_URL,
);
const poolOk = await tryConnect(
  "DATABASE_URL (6543, untuk runtime)",
  process.env.DATABASE_URL,
);
console.log("\n=== HASIL ===");
if (directOk && poolOk)
  console.log("✅ Semua koneksi OK — migrasi bisa dijalankan.");
else if (directOk)
  console.log("⚠️ Hanya DIRECT_URL yang OK — runtime via pooler bermasalah.");
else if (poolOk)
  console.log(
    "⚠️ Hanya DATABASE_URL yang OK — DIRECT_URL salah (cek host di dashboard Supabase).",
  );
else {
  console.log("❌ Kedua koneksi gagal.");
  console.log("  Kemungkinan: (1) password DB di .env.local outdated,");
  console.log("  (2) host/region di connection string sudah berubah,");
  console.log("  (3) project Supabase di-pause.");
  console.log(
    "  Solusi: dashboard → Settings → Database → Connection string →",
  );
  console.log(
    "  salin ulang 'Direct connection' ke DIRECT_URL dan 'Transaction pooler' ke DATABASE_URL.",
  );
}
