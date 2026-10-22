import { AdminSidebar } from "@/app/components/admin-sidebar";
import { requirePlatformUser } from "@/app/lib/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePlatformUser();

  return (
    <div className="relative flex min-h-dvh flex-wrap bg-background text-foreground">
      <AdminSidebar userName={user.name} />
      <main className="box-border min-w-0 flex-[999_1_640px] px-12 pt-10 pb-14">{children}</main>
    </div>
  );
}
