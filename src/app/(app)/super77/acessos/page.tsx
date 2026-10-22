import { requirePermission } from "@/domains/rbac/guards";
import { opcoes, passagens, periodo, porDia, porTela, porUsuario, resumo, type Filtros } from "@/domains/acessos/service";
import { AcessosClient } from "./acessos-client";

export default async function AcessosPage({ searchParams }: {
  searchParams: Promise<{ de?: string; ate?: string; usuario?: string; tela?: string; busca?: string; n?: string }>;
}) {
  await requirePermission("super77.access");
  const p = await searchParams;
  const filtros: Filtros = { de: p.de, ate: p.ate, usuario: p.usuario, tela: p.tela, busca: p.busca };
  const limite = Math.min(Math.max(Number(p.n) || 500, 1), 5000);
  const [res, usuarios, telas, dias, linhas, opt] = await Promise.all([
    resumo(filtros), porUsuario(filtros), porTela(filtros), porDia(filtros), passagens(filtros, limite), opcoes(),
  ]);
  const { de, ate } = periodo(filtros);
  const dia = (d: Date) => new Date(d).toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).slice(0, 10);
  return <AcessosClient
    resumo={res} usuarios={usuarios} telas={telas} dias={dias} linhas={linhas} opcoes={opt}
    limite={limite} exportSecret={process.env.ACCESS_EXPORT_SECRET ? process.env.ACCESS_EXPORT_SECRET : null}
    filtro={{ de: p.de ?? dia(de), ate: p.ate ?? dia(new Date(ate.getTime() - 1)),
      usuario: p.usuario ?? "", tela: p.tela ?? "", busca: p.busca ?? "", n: String(limite) }}
  />;
}
