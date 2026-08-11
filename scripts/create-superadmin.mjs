/**
 * Buat initial super admin (sekali jalan).
 *
 * Cara pakai:
 *   node scripts/create-superadmin.mjs
 *
 * Default: superadmin@example.com / admin123 (ubah di bawah kalau perlu).
 * Aman dijalankan ulang — jika email sudah ada, hanya memastikan role = admin.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const EMAIL = "superadmin@example.com";
const PASSWORD = "admin123";
const NAME = "Super Admin";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 1. Cek apakah email sudah terdaftar
  const { data: existing } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const found = existing?.users.find((u) => u.email?.toLowerCase() === EMAIL);

  let userId;
  if (found) {
    console.log("ℹ️  Email sudah terdaftar — pastikan role admin...");
    userId = found.id;
  } else {
    // 2. Buat user auth baru (email_confirm supaya langsung bisa login)
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { name: NAME, role: "admin" },
      });

    if (createError) {
      console.error("❌ Gagal buat user auth:", createError.message);
      process.exit(1);
    }
    userId = created.user.id;
    console.log("✅ User auth dibuat:", EMAIL);
  }

  // 3. Upsert profile dengan role admin
  const { error: profileError } = await admin.from("profiles").upsert({
    id: userId,
    name: NAME,
    role: "admin",
    is_active: true,
    weekly_salary: 0,
    service_commission_pct: 0,
  });

  if (profileError) {
    console.error("❌ Gagal buat profile:", profileError.message);
    process.exit(1);
  }

  console.log("✅ Profile admin siap.");
  console.log("──────────────────────────────────────");
  console.log("  Email    :", EMAIL);
  console.log("  Password :", PASSWORD);
  console.log("  Role     : admin (Super Admin)");
  console.log("──────────────────────────────────────");
  console.log("⚠️  GANTI PASSWORD SETELAH LOGIN PERTAMA!");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
