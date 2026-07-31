import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { getUserPermissionSet } from "@/domains/rbac/service";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const permissions = await getUserPermissionSet(session.user.email);
  const canSuper77 = permissions.has("super77.access");

  const displayName = session.user.name ?? session.user.email ?? "Usuário";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <AppShell
      canSuper77={canSuper77}
      userName={displayName}
      userInitials={initials}
      onLogout={logout}
    >
      {children}
    </AppShell>
  );
}
