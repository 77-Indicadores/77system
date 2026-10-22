/** Rotas estáveis do boilerplate; telas de indicador são resolvidas no banco. */
export const ROTAS_FIXAS: Record<string, { nome: string; grupo: string }> = {
  "/dashboard": { nome: "Indicadores", grupo: "Painel" },
  "/registries": { nome: "Cadastros", grupo: "Painel" },
  "/users": { nome: "Usuários", grupo: "Administração" },
  "/super77": { nome: "Super77", grupo: "Administração" },
  "/super77/acessos": { nome: "Acessos", grupo: "Administração" },
  "/super77/data": { nome: "Dados e Jobs", grupo: "Administração" },
  "/super77/catworld": { nome: "Catworld", grupo: "Administração" },
};

export function slugDaRota(pathname: string): string | null {
  const limpo = pathname.replace(/\/+$/, "") || "/";
  const tela = /^\/dashboard\/([^/]+)$/.exec(limpo);
  if (tela) {
    try { return decodeURIComponent(tela[1]); } catch { return null; }
  }
  if (ROTAS_FIXAS[limpo]) return limpo;
  const raiz = Object.keys(ROTAS_FIXAS)
    .filter((r) => limpo.startsWith(r + "/"))
    .sort((a, b) => b.length - a.length)[0];
  return raiz ?? null;
}

export function nomeDaRota(slug: string) {
  return ROTAS_FIXAS[slug] ?? null;
}
