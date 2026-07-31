import { prisma } from "@/lib/prisma";

type UserWithRoles = Awaited<ReturnType<typeof fetchUserWithRoles>>;

async function fetchUserWithRoles(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });
}

function extractGlobalPermissions(user: UserWithRoles): Set<string> {
  if (!user || user.status !== "ACTIVE") return new Set();
  return new Set(
    user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.key))
  );
}

// Permissões globais via role — use para checar acessos não escopados por recurso.
export async function getUserPermissionSet(email: string): Promise<Set<string>> {
  const user = await fetchUserWithRoles(email);
  return extractGlobalPermissions(user);
}

// Cheque simples de uma permissão global.
export async function userHasPermission(email: string, permissionKey: string): Promise<boolean> {
  const set = await getUserPermissionSet(email);
  return set.has(permissionKey);
}

// Cheque com suporte a ResourcePolicy: global (via role) OU escopado por recurso.
// Usa quando a permissão pode ter sido concedida apenas para um recurso específico.
export async function userHasPermissionForResource(
  email: string,
  permissionKey: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  const user = await fetchUserWithRoles(email);
  if (!user || user.status !== "ACTIVE") return false;

  // Permissão global via role
  if (extractGlobalPermissions(user).has(permissionKey)) return true;

  // Permissão escopada via ResourcePolicy (por userId ou roleId)
  const roleIds = user.roles.map((ur) => ur.roleId);
  const permission = await prisma.permission.findUnique({ where: { key: permissionKey } });
  if (!permission) return false;

  const policy = await prisma.resourcePolicy.findFirst({
    where: {
      permissionId: permission.id,
      resourceType,
      resourceId,
      OR: [
        { userId: user.id },
        { roleId: { in: roleIds } },
      ],
    },
  });

  return policy !== null;
}

// Carrega permissões globais + políticas de recurso do usuário de uma vez.
// Útil para filtrar listas inteiras sem N+1.
export async function getUserResourcePolicies(email: string): Promise<
  Array<{ permissionKey: string; resourceType: string; resourceId: string }>
> {
  const user = await fetchUserWithRoles(email);
  if (!user || user.status !== "ACTIVE") return [];

  const roleIds = user.roles.map((ur) => ur.roleId);

  const policies = await prisma.resourcePolicy.findMany({
    where: {
      OR: [
        { userId: user.id },
        { roleId: { in: roleIds } },
      ],
    },
    include: { permission: true },
  });

  return policies.map((p) => ({
    permissionKey: p.permission.key,
    resourceType: p.resourceType,
    resourceId: p.resourceId,
  }));
}
