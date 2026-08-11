import { Navbar } from "@/components/layout/navbar";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default function SettingsPage() {
  return (
    <>
      <Navbar
        title="Pengaturan Akun"
        subtitle="Kelola profil dan pengguna sistem."
      />

      <div className="w-full space-y-8">
        <SettingsTabs />
      </div>
    </>
  );
}
