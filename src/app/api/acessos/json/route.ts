import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { passagens, periodo, porDia, porTela, porUsuario, resumo, type Filtros } from "@/domains/acessos/service";

export const dynamic = "force-dynamic";

function authorized(value: string | null) {
  const configured = process.env.ACCESS_EXPORT_SECRET;
  if (!configured || !value) return false;
  return timingSafeEqual(
    createHash("sha256").update(value).digest(),
    createHash("sha256").update(configured).digest(),
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!authorized(url.searchParams.get("secret"))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const filtros: Filtros = {
    de: url.searchParams.get("de") ?? undefined,
    ate: url.searchParams.get("ate") ?? undefined,
    usuario: url.searchParams.get("usuario") ?? undefined,
    tela: url.searchParams.get("tela") ?? undefined,
    busca: url.searchParams.get("busca") ?? undefined,
  };
  const n = Math.min(Math.max(Number(url.searchParams.get("n")) || 500, 1), 5000);
  try {
    const [res, usuarios, telas, dias, linhas] = await Promise.all([
      resumo(filtros), porUsuario(filtros), porTela(filtros), porDia(filtros), passagens(filtros, n),
    ]);
    const { de, ate } = periodo(filtros);
    return NextResponse.json({ periodo: { de, ate }, resumo: res, por_pessoa: usuarios,
      por_tela: telas, por_dia: dias, linha_a_linha: linhas, limite: n },
      { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } catch {
    return NextResponse.json({ error: "Falha ao consultar acessos" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
