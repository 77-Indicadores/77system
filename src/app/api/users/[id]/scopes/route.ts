import { NextResponse } from "next/server";
import { requirePermission } from "@/domains/rbac/guards";
import { getUserScopeList, setUserScope, clearUserScope } from "@/domains/rbac/scope";

type Params = { params: Promise<{ id: string }> };

/** GET /api/users/:id/scopes — list all scope entries for a user */
export async function GET(_req: Request, { params }: Params) {
  await requirePermission("users.manage");
  const { id } = await params;
  const scopes = await getUserScopeList(id);
  return NextResponse.json(scopes);
}

/**
 * PUT /api/users/:id/scopes — replace scopes for one dimension
 * Body: { dimension: string; values: string[] }
 * Pass values: [] to clear all restrictions for that dimension.
 */
export async function PUT(req: Request, { params }: Params) {
  await requirePermission("users.manage");
  const { id } = await params;
  const body = await req.json().catch(() => ({})) as { dimension?: string; values?: string[] };

  if (typeof body.dimension !== "string" || !body.dimension) {
    return NextResponse.json({ error: "Campo 'dimension' obrigatório" }, { status: 400 });
  }
  if (!Array.isArray(body.values)) {
    return NextResponse.json({ error: "Campo 'values' deve ser array" }, { status: 400 });
  }

  await setUserScope(id, body.dimension, body.values);
  return NextResponse.json({ ok: true });
}

/** DELETE /api/users/:id/scopes?dimension=empresa — clear one dimension (or all if omitted) */
export async function DELETE(req: Request, { params }: Params) {
  await requirePermission("users.manage");
  const { id } = await params;
  const dimension = new URL(req.url).searchParams.get("dimension") ?? undefined;
  await clearUserScope(id, dimension);
  return NextResponse.json({ ok: true });
}
