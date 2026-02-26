import { User, Users } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSection } from "@/components/settings/profile-section";
import { UsersTable } from "@/components/settings/users-table";

export default function SettingsPage() {
  return (
    <>
      <Navbar
        title="Pengaturan Akun"
        subtitle="Kelola profil dan pengguna sistem."
      />

      <div className="max-w-5xl space-y-8">
        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-transparent border-b border-slate-200 dark:border-slate-700 rounded-none w-full justify-start h-auto p-0 gap-8">
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
          </TabsList>

          <TabsContent value="profile" className="space-y-8 mt-0">
            <ProfileSection />
            <UsersTable />
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <UsersTable />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
