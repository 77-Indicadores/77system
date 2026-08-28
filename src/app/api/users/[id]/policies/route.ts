import { NextResponse } from "next/server";

import { requirePermission } from "@/domains/rbac/guards";
import { getPoliticasDoUsuario, setPoliticasDoUsuario } from "@/domains/rbac/policies";

type Params = { params: Promise<{ id: string }> };

/** GET /api/users/:id/policies — grupos, telas e cadastros que o usuário enxerga. */
export async function GET(_req: Request, { params }: Params) {
  await requirePermission("users.manage");
  const { id } = await params;
  return NextResponse.json(await getPoliticasDoUsuario(id));
}

/**
 * PUT /api/users/:id/policies — substitui o conjunto.
 * Body: { grupos: string[]; telas: string[]; cadastros?: string[] } em slugs/chaves.
 */
export async function PUT(req: Request, { params }: Params) {
  await requirePermission("users.manage");
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    grupos?: unknown; telas?: unknown; cadastros?: unknown;
  };
  const lista = (v: unknown) =>
    Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : null;

  const grupos = lista(body.grupos);
  const telas = lista(body.telas);
  // `cadastros` é opcional para não quebrar quem chame a rota só com grupos e telas.
  const cadastros = body.cadastros === undefined ? [] : lista(body.cadastros);
  if (!grupos || !telas || !cadastros) {
    return NextResponse.json(
      { error: "Campos 'grupos', 'telas' e 'cadastros' devem ser arrays de texto" },
      { status: 400 },
    );
  }

  await setPoliticasDoUsuario(id, { grupos, telas, cadastros });
  return NextResponse.json({ ok: true });
}
