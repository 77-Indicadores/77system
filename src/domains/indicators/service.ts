import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserPermissionSet, getUserResourcePolicies } from "@/domains/rbac/service";

export async function listVisibleDashboardGroups() {
  const session = await auth();
  if (!session?.user?.email) return [];

  const [globalPerms, resourcePolicies] = await Promise.all([
    getUserPermissionSet(session.user.email),
    getUserResourcePolicies(session.user.email),
  ]);

  const canViewResource = (permissionKey: string, resourceType: string, resourceId: string) =>
    globalPerms.has(permissionKey) ||
    resourcePolicies.some(
      (p) => p.permissionKey === permissionKey && p.resourceType === resourceType && p.resourceId === resourceId
    );

  const groups = await prisma.dashboardGroup.findMany({
    where: { isActive: true },
    include: { screens: { where: { isActive: true }, orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });

  // Conceder o GRUPO libera o bloco inteiro; conceder telas soltas libera só elas — é o
  // que a tela de Usuários promete. Se o grupo não concedido fosse pulado, marcar uma
  // tela sem marcar o grupo não daria acesso a nada.
  const visible = [];
  for (const group of groups) {
    const grupoLiberado = canViewResource(group.requiredPermission, "dashboard_group", group.slug);
    const screens = grupoLiberado
      ? group.screens
      : group.screens.filter((s) =>
        canViewResource(s.requiredPermission, "dashboard_screen", s.slug)
      );
    if (screens.length === 0) continue;
    visible.push({ ...group, screens });
  }

  return visible;
}

export async function requireDashboardAccess(slug: string) {
  const session = await auth();
  if (!session?.user?.email) return null;

  const screen = await prisma.dashboardScreen.findUnique({
    where: { slug },
    include: {
      group: {
        include: {
          screens: { where: { isActive: true }, orderBy: { order: "asc" } },
        },
      },
    },
  });
  if (!screen || !screen.isActive || !screen.group.isActive) return null;

  const [globalPerms, resourcePolicies] = await Promise.all([
    getUserPermissionSet(session.user.email),
    getUserResourcePolicies(session.user.email),
  ]);

  const canViewResource = (permissionKey: string, resourceType: string, resourceId: string) =>
    globalPerms.has(permissionKey) ||
    resourcePolicies.some(
      (p) => p.permissionKey === permissionKey && p.resourceType === resourceType && p.resourceId === resourceId
    );

  // Basta a tela: quem recebeu só ela não precisa do grupo junto. O grupo continua
  // valendo como atalho para o bloco inteiro.
  const grupoLiberado = canViewResource(
    screen.group.requiredPermission, "dashboard_group", screen.group.slug
  );
  if (!grupoLiberado && !canViewResource(screen.requiredPermission, "dashboard_screen", screen.slug)) {
    return null;
  }

  const visibleScreens = grupoLiberado
    ? screen.group.screens
    : screen.group.screens.filter((s) =>
      canViewResource(s.requiredPermission, "dashboard_screen", s.slug)
    );

  return { ...screen, group: { ...screen.group, screens: visibleScreens } };
}
