"use client";

import { useState } from "react";
import { Clock, Copy, Monitor, Users } from "lucide-react";
import { duracao, hora, type LinhaDia, type LinhaTela, type LinhaUsuario, type Passagem, type Resumo } from "@/domains/acessos/service";

type Filtro = { de: string; ate: string; usuario: string; tela: string; busca: string; n: string };
type Aba = "pessoas" | "telas" | "linha" | "dias";
const ABAS: { id: Aba; rotulo: string }[] = [
  { id: "pessoas", rotulo: "Por pessoa" }, { id: "telas", rotulo: "Por tela" },
  { id: "linha", rotulo: "Linha a linha" }, { id: "dias", rotulo: "Por dia" },
];

export function AcessosClient({ resumo, usuarios, telas, dias, linhas, opcoes, filtro, limite, exportSecret }: {
  resumo: Resumo; usuarios: LinhaUsuario[]; telas: LinhaTela[]; dias: LinhaDia[];
  linhas: Passagem[]; opcoes: { usuarios: string[]; telas: { slug: string; nome: string | null }[] };
  filtro: Filtro; limite: number; exportSecret: string | null;
}) {
  const [aba, setAba] = useState<Aba>("pessoas");
  const [copiado, setCopiado] = useState(false);
  async function copiarLink() {
    if (!exportSecret) return;
    const url = new URL("/api/acessos/json", window.location.origin);
    url.searchParams.set("secret", exportSecret);
    for (const [chave, valor] of Object.entries(filtro)) if (valor) url.searchParams.set(chave, valor);
    try { await navigator.clipboard.writeText(url.toString()); setCopiado(true); }
    catch { setCopiado(false); }
  }
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Super77</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Acessos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pessoas, telas abertas, tempo de tela e entradas. O tempo conta enquanto a aba está visível.</p>
      </div>
      <div className="text-right">
        <button type="button" disabled={!exportSecret} onClick={copiarLink}
          className="inline-flex h-9 items-center gap-2 rounded-md border bg-card px-3 text-xs font-bold hover:bg-muted/40 disabled:opacity-50">
          <Copy className="size-4" /> {copiado ? "Link copiado" : "Copiar link JSON"}
        </button>
        {!exportSecret && <p className="mt-1 text-xs text-muted-foreground">Configure ACCESS_EXPORT_SECRET para habilitar.</p>}
      </div>
    </div>
    <div className="grid gap-3 md:grid-cols-4">
      <Kpi icon={<Users className="size-4" />} label="Pessoas" value={resumo.pessoas.toLocaleString("pt-BR")} detail={`${resumo.online} online agora`} />
      <Kpi icon={<Monitor className="size-4" />} label="Telas abertas" value={resumo.passagens.toLocaleString("pt-BR")} detail={`${resumo.telas} telas diferentes`} />
      <Kpi icon={<Clock className="size-4" />} label="Tempo de tela" value={duracao(resumo.segundos)} detail={resumo.pessoas ? `${duracao(Math.round(resumo.segundos / resumo.pessoas))} por pessoa` : "Sem acessos"} />
      <Kpi label="Entradas" value={resumo.logins.toLocaleString("pt-BR")} detail="logins no período" />
    </div>
    <form method="get" className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-3">
      <Campo label="De"><input type="date" name="de" defaultValue={filtro.de} className={INPUT} /></Campo>
      <Campo label="Até"><input type="date" name="ate" defaultValue={filtro.ate} className={INPUT} /></Campo>
      <Campo label="Pessoa"><select name="usuario" defaultValue={filtro.usuario} className={INPUT}><option value="">Todas</option>{opcoes.usuarios.map(u => <option key={u} value={u}>{u}</option>)}</select></Campo>
      <Campo label="Tela"><select name="tela" defaultValue={filtro.tela} className={INPUT}><option value="">Todas</option>{opcoes.telas.map(t => <option key={t.slug} value={t.slug}>{t.nome ?? t.slug}</option>)}</select></Campo>
      <Campo label="Busca"><input name="busca" defaultValue={filtro.busca} placeholder="E-mail, tela, grupo" className={INPUT} /></Campo>
      <input type="hidden" name="n" value={filtro.n} />
      <button type="submit" className="h-9 rounded-md bg-primary px-4 text-xs font-bold text-primary-foreground">Filtrar</button>
    </form>
    <div className="flex flex-wrap gap-2">{ABAS.map(a => <button key={a.id} type="button" onClick={() => setAba(a.id)}
      className={`h-8 rounded-md px-3 text-xs font-bold ${aba === a.id ? "bg-primary text-primary-foreground" : "border bg-card"}`}>{a.rotulo}</button>)}</div>
    {aba === "pessoas" && <Tabela headers={["Pessoa", "Telas abertas", "Telas diferentes", "Tempo de tela", "Primeiro", "Último"]}
      rows={usuarios.map(u => [u.email, String(u.passagens), String(u.telas), duracao(u.segundos), hora(u.primeiro), hora(u.ultimo)])} />}
    {aba === "telas" && <Tabela headers={["Tela", "Grupo", "Aberturas", "Pessoas", "Tempo de tela", "Última vez"]}
      rows={telas.map(t => [t.nome ?? t.slug, t.grupo ?? "—", String(t.passagens), String(t.pessoas), duracao(t.segundos), hora(t.ultimo)])} />}
    {aba === "linha" && <><Tabela headers={["Pessoa", "Tela", "Grupo", "Entrou", "Último sinal", "Tempo"]}
      rows={linhas.map(l => [l.email, l.nome ?? l.slug, l.grupo ?? "—", hora(l.iniciadoEm), hora(l.ultimoPingEm), duracao(l.segundos)])} />
      {linhas.length >= limite && <p className="text-xs text-muted-foreground">Mostrando as {limite} visitas mais recentes.</p>}</>}
    {aba === "dias" && <Tabela headers={["Dia", "Telas abertas", "Pessoas", "Tempo de tela"]}
      rows={dias.map(d => [d.dia.split("-").reverse().join("/"), String(d.passagens), String(d.pessoas), duracao(d.segundos)])} />}
  </div>;
}

const INPUT = "mt-1 block h-9 rounded-md border bg-card px-2 text-xs";
function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-[10px] font-bold uppercase text-muted-foreground">{label}{children}</label>;
}
function Kpi({ icon, label, value, detail }: { icon?: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="rounded-xl border bg-card p-3"><p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-muted-foreground">{icon}{label}</p>
    <p className="mt-1 text-2xl font-black tabular-nums">{value}</p><p className="text-xs text-muted-foreground">{detail}</p></div>;
}
function Tabela({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (!rows.length) return <p className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">Nenhum acesso no período.</p>;
  return <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full text-xs"><thead><tr className="border-b bg-muted/40">
    {headers.map(h => <th key={h} className="px-3 py-2 text-left font-bold uppercase text-muted-foreground">{h}</th>)}</tr></thead>
    <tbody>{rows.map((row, i) => <tr key={i} className="border-b last:border-0">{row.map((cell, j) => <td key={j} className="px-3 py-2">{cell}</td>)}</tr>)}</tbody></table></div>;
}
