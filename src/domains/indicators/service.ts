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

  const visible = [];
  for (const group of groups) {
    if (!canViewResource(group.requiredPermission, "dashboard_group", group.slug)) continue;
    const screens = group.screens.filter((s) =>
      canViewResource(s.requiredPermission, "dashboard_screen", s.slug)
    );
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

  if (!canViewResource(screen.group.requiredPermission, "dashboard_group", screen.group.slug)) return null;
  if (!canViewResource(screen.requiredPermission, "dashboard_screen", screen.slug)) return null;

  const visibleScreens = screen.group.screens.filter((s) =>
    canViewResource(s.requiredPermission, "dashboard_screen", s.slug)
  );

  return { ...screen, group: { ...screen.group, screens: visibleScreens } };
}
