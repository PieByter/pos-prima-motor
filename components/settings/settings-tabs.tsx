"use client";

import { User, Users, Palette, ShieldAlert, Store } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSection } from "@/components/settings/profile-section";
import { UsersTable } from "@/components/settings/users-table";
import { BusinessSettingsSection } from "@/components/settings/business-settings-section";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { useLocale } from "@/lib/locales";

/**
 * Tabs pengaturan — tab "Kelola Pengguna" hanya tampil untuk admin.
 * API /api/users sudah admin-only; ini lapisan UI (UX).
 */
export function SettingsTabs() {
  const { isAdmin, loading } = useUserRole();
  const { t } = useLocale();

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="bg-transparent border-b border-slate-200 dark:border-slate-700 rounded-none w-full justify-start h-auto p-0 gap-0">
        <TabsTrigger
          value="profile"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:text-sky-500 data-[state=active]:shadow-none bg-transparent px-1 pb-4 pt-2 font-medium text-sm gap-2"
        >
          <User className="h-5 w-5" />
          {t("settings.profileTab")}
        </TabsTrigger>
        {isAdmin && (
          <TabsTrigger
            value="users"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:text-sky-500 data-[state=active]:shadow-none bg-transparent px-1 pb-4 pt-2 font-medium text-sm gap-2"
          >
            <Users className="h-5 w-5" />
            {t("settings.usersTab")}
          </TabsTrigger>
        )}
        {isAdmin && (
          <TabsTrigger
            value="business"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:text-sky-500 data-[state=active]:shadow-none bg-transparent px-1 pb-4 pt-2 font-medium text-sm gap-2"
          >
            <Store className="h-5 w-5" />
            {t("settings.storeSettings")}
          </TabsTrigger>
        )}
        <TabsTrigger
          value="appearance"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:text-sky-500 data-[state=active]:shadow-none bg-transparent px-1 pb-4 pt-2 font-medium text-sm gap-2"
        >
          <Palette className="h-5 w-5" />
          {t("settings.appearance")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        <ProfileSection />
      </TabsContent>

      <TabsContent value="users" className="space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldAlert className="h-4 w-4" /> {t("settings.loading")}
          </div>
        ) : isAdmin ? (
          <UsersTable />
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-6 text-center">
            <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {t("settings.adminOnlyUsers")}
            </p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="business" className="space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldAlert className="h-4 w-4" /> {t("settings.loading")}
          </div>
        ) : isAdmin ? (
          <BusinessSettingsSection />
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-6 text-center">
            <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {t("settings.adminOnlyStore")}
            </p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="appearance" className="space-y-6">
        <div className="rounded-xl border bg-white dark:bg-slate-800 p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{t("settings.theme")}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{t("settings.themeDesc")}</p>
          </div>
          <ThemeToggle />
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">{t("settings.language")}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{t("settings.languageDesc")}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </TabsContent>
    </Tabs>
  );
}
