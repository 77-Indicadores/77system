import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { getUserPermissionSet, getUserResourcePolicies } from "@/domains/rbac/service";
import { TIPO_CADASTRO, TIPO_GRUPO, TIPO_TELA } from "@/domains/rbac/recursos";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const [permissions, policies] = await Promise.all([
    getUserPermissionSet(session.user.email),
    getUserResourcePolicies(session.user.email),
  ]);

  /*
   * O menu segue a alcada, e nao so' a permissao ampla: quem recebeu uma tela solta
   * precisa do item "Indicadores" para chegar nela. Testar apenas
   * `indicators.dashboard.view` esconderia o menu de todo operador, e a concessao por
   * usuario nao levaria a lugar nenhum.
   */
  const temPolitica = (...tipos: string[]) => policies.some((p) => tipos.includes(p.resourceType));
  const canIndicators =
    permissions.has("indicators.dashboard.view") ||
    permissions.has("indicators.group.view") ||
    temPolitica(TIPO_GRUPO, TIPO_TELA);
  const canRegistries =
    permissions.has("registries.module.view") || temPolitica(TIPO_CADASTRO);

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
      canSuper77={permissions.has("super77.access")}
      canManageUsers={permissions.has("users.manage")}
      canIndicators={canIndicators}
      canRegistries={canRegistries}
      userName={displayName}
      userInitials={initials}
      onLogout={logout}
    >
      {children}
    </AppShell>
  );
}
