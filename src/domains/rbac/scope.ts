import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * Data segregation (row-level security).
 *
 * A user with NO scopes for a dimension sees everything — admin/super behaviour.
 * A user WITH scopes for a dimension only sees rows where the field matches.
 *
 * Usage in a domain service:
 *
 *   const scope = await getCurrentUserScopeMap();
 *   const rows = await prisma.infratechFaturamento.findMany({
 *     where: {
 *       ...scopeFilter(scope, "empresa", "empresaNome"),
 *       ano,
 *     },
 *   });
 */

/** Map of dimension → allowed values for a user. */
export type ScopeMap = Record<string, string[]>;

/** Load all scope entries for a user by their DB id. */
export async function getUserScopeMap(userId: string): Promise<ScopeMap> {
  const entries = await prisma.userScope.findMany({ where: { userId } });
  const map: ScopeMap = {};
  for (const e of entries) {
    if (!map[e.dimension]) map[e.dimension] = [];
    map[e.dimension].push(e.value);
  }
  return map;
}

/**
 * Load scope for the currently authenticated user.
 * Returns empty map if not authenticated → caller's scopeFilter returns {} → no restriction.
 */
export async function getCurrentUserScopeMap(): Promise<ScopeMap> {
  const session = await auth();
  if (!session?.user?.email) return {};
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return {};
  return getUserScopeMap(user.id);
}

/**
 * Returns a Prisma `where` fragment for the given dimension.
 *
 * @param scopeMap  - result of getUserScopeMap / getCurrentUserScopeMap
 * @param dimension - logical name used in UserScope.dimension (e.g. "empresa")
 * @param field     - Prisma model field to filter on (e.g. "empresaNome")
 *
 * Returns {} when the user has no scope for this dimension (sees everything).
 * Returns { field: { in: [...] } } when the user is restricted.
 */
export function scopeFilter(
  scopeMap: ScopeMap,
  dimension: string,
  field: string
): Record<string, unknown> {
  const values = scopeMap[dimension];
  if (!values?.length) return {};
  return { [field]: { in: values } };
}

// ── Admin helpers ─────────────────────────────────────────────────────────────

export async function setUserScope(
  userId: string,
  dimension: string,
  values: string[]
): Promise<void> {
  await prisma.$transaction([
    prisma.userScope.deleteMany({ where: { userId, dimension } }),
    ...values.map((value) =>
      prisma.userScope.create({ data: { userId, dimension, value } })
    ),
  ]);
}

export async function clearUserScope(userId: string, dimension?: string): Promise<void> {
  await prisma.userScope.deleteMany({
    where: dimension ? { userId, dimension } : { userId },
  });
}

export async function getUserScopeList(userId: string) {
  return prisma.userScope.findMany({
    where: { userId },
    orderBy: [{ dimension: "asc" }, { value: "asc" }],
  });
}
