import { User, Users, Palette } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSection } from "@/components/settings/profile-section";
import { UsersTable } from "@/components/settings/users-table";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default function SettingsPage() {
  return (
    <>
      <Navbar
        title="Pengaturan Akun"
        subtitle="Kelola profil dan pengguna sistem."
      />

      <div className="w-full space-y-8">
        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-transparent border-b border-slate-200 dark:border-slate-700 rounded-none w-full justify-start h-auto p-0 gap-0">
            <TabsTrigger
              value="profile"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:text-sky-500 data-[state=active]:shadow-none bg-transparent px-1 pb-4 pt-2 font-medium text-sm gap-2"
            >
              <User className="h-5 w-5" />
              Profil Saya
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:text-sky-500 data-[state=active]:shadow-none bg-transparent px-1 pb-4 pt-2 font-medium text-sm gap-2"
            >
              <Users className="h-5 w-5" />
              Kelola Pengguna
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:text-sky-500 data-[state=active]:shadow-none bg-transparent px-1 pb-4 pt-2 font-medium text-sm gap-2"
            >
              <Palette className="h-5 w-5" />
              Tampilan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-8 mt-0">
            <ProfileSection />
            <UsersTable />
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <UsersTable />
          </TabsContent>

          <TabsContent value="appearance" className="mt-0">
            <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-8">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                  Preferensi Tampilan
                </h3>
                <div className="space-y-6">
                  {/* Theme */}
                  <div className="flex items-center justify-between py-4 px-5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Tema Gelap / Terang
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Atur tampilan antarmuka menjadi gelap atau terang
                      </p>
                    </div>
                    <ThemeToggle />
                  </div>

                  {/* Language */}
                  <div className="flex items-center justify-between py-4 px-5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Bahasa
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Ganti bahasa Indonesia / English
                      </p>
                    </div>
                    <LanguageSwitcher />
                  </div>
                </div>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
