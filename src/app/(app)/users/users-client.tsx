"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  CircleDot,
  Key,
  Loader2,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  ShieldCheck,
  Trash2,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import {
  actionCreateUser,
  actionClearScope,
  actionDeleteUser,
  actionSendResetLink,
  actionSetRole,
  actionSetScope,
  actionToggleStatus,
  actionUpdateUser,
} from "./actions";
import type { UserRow } from "@/domains/users/service";

const ROLES = [
  {
    key: "super77",
    label: "Super77",
    description: "Acesso total — integrações, jobs, usuários e todos os módulos.",
  },
  {
    key: "operador",
    label: "Operador",
    description: "Acesso aos indicadores, cadastros e exportações. Escopo configurável por dimensão.",
  },
] as const;

type RoleKey = "super77" | "operador";

function parseValues(raw: string): string[] {
  return raw.split(/[\n,]/).map((v) => v.trim()).filter(Boolean);
}

function initials(user: UserRow) {
  const src = user.name ?? user.email;
  return src.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function userRoleKey(user: UserRow): RoleKey | null {
  const key = user.roles[0]?.role.key;
  return key === "super77" || key === "operador" ? key : null;
}

function groupScopes(user: UserRow): Record<string, string[]> {
  return user.scopes.reduce<Record<string, string[]>>((m, s) => {
    (m[s.dimension] ??= []).push(s.value);
    return m;
  }, {});
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RoleBadge({ roleKey }: { roleKey: RoleKey | null }) {
  if (roleKey === "super77") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
        <ShieldCheck className="size-3" /> Super77
      </span>
    );
  }
  if (roleKey === "operador") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
        <Shield className="size-3" /> Operador
      </span>
    );
  }
  return (
    <span className="rounded-full border px-2.5 py-0.5 text-[11px] text-muted-foreground/60">
      Sem papel
    </span>
  );
}

function StatusDot({ status }: { status: "ACTIVE" | "DISABLED" }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-green-600">
        <CircleDot className="size-3.5" /> Ativo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground">
      <CircleDot className="size-3.5 opacity-30" /> Desativado
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function UsersClient({
  users,
  currentUserEmail,
}: {
  users: UserRow[];
  currentUserEmail: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Panel state
  const [panel, setPanel] = useState<"create" | { edit: UserRow } | null>(null);

  // Create form
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPass, setCPass] = useState("");
  const [cRole, setCRole] = useState<RoleKey>("operador");
  const [cError, setCError] = useState("");

  // Edit form state (synced when panel opens)
  const [eName, setEName] = useState("");
  const [eEmail, setEEmail] = useState("");
  const [eRole, setERole] = useState<RoleKey>("operador");
  const [eScopeDim, setEScopeDim] = useState("");
  const [eScopeVals, setEScopeVals] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [eError, setEError] = useState("");
  const [eSuccess, setESuccess] = useState("");

  // Sync edit panel data when users prop refreshes
  useEffect(() => {
    if (panel && typeof panel === "object" && "edit" in panel) {
      const updated = users.find((u) => u.id === panel.edit.id);
      if (!updated) { setPanel(null); return; }
      setPanel({ edit: updated });
    }
  }, [users]); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setCName(""); setCEmail(""); setCPass(""); setCRole("operador"); setCError("");
    setPanel("create");
  }

  function openEdit(user: UserRow) {
    setEName(user.name ?? "");
    setEEmail(user.email);
    setERole(userRoleKey(user) ?? "operador");
    setEScopeDim(""); setEScopeVals("");
    setConfirmDelete(false);
    setEError(""); setESuccess("");
    setPanel({ edit: user });
  }

  function closePanel() { setPanel(null); }

  function run(fn: () => Promise<void>, onDone?: () => void) {
    setEError(""); setESuccess("");
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
        onDone?.();
      } catch (err) {
        setEError(err instanceof Error ? err.message : "Erro inesperado.");
      }
    });
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const super77Count = users.filter((u) => userRoleKey(u) === "super77").length;
  const operadorCount = users.filter((u) => userRoleKey(u) === "operador").length;

  const editUser = panel && typeof panel === "object" && "edit" in panel ? panel.edit : null;
  const isSelf = (user: UserRow) => user.email === currentUserEmail;

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Administração</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">Usuários</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Papéis, acesso e segregação de dados por dimensão.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <UserPlus className="size-4" />
            Novo usuário
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: users.length },
            { label: "Ativos", value: activeCount },
            { label: "Super77", value: super77Count },
            { label: "Operadores", value: operadorCount },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-card px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-black tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        {users.length === 0 ? (
          <div className="rounded-lg border bg-card p-10 text-center">
            <UserPlus className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Usuário</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Papel</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="hidden px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground md:table-cell">Restrições</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const scopes = groupScopes(user);
                  const scopeDims = Object.keys(scopes);
                  return (
                    <tr
                      key={user.id}
                      className="border-b last:border-0 hover:bg-muted/20"
                    >
                      {/* User */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-black text-primary">
                            {initials(user)}
                          </div>
                          <div>
                            <p className="font-semibold text-card-foreground">
                              {user.name ?? "—"}
                              {isSelf(user) && (
                                <span className="ml-1.5 text-[10px] font-bold text-muted-foreground">(você)</span>
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3">
                        <RoleBadge roleKey={userRoleKey(user)} />
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3">
                        <StatusDot status={user.status} />
                      </td>

                      {/* Scopes */}
                      <td className="hidden px-5 py-3 md:table-cell">
                        {scopeDims.length === 0 ? (
                          <span className="text-[11px] text-muted-foreground/50">Sem restrições</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {scopeDims.slice(0, 2).map((dim) => (
                              <span
                                key={dim}
                                className="rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary"
                              >
                                {dim} · {scopes[dim].length}
                              </span>
                            ))}
                            {scopeDims.length > 2 && (
                              <span className="rounded-md border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                +{scopeDims.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => openEdit(user)}
                          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-muted"
                        >
                          <Pencil className="size-3" />
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      {panel && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
          onClick={closePanel}
        />
      )}

      {/* ── Create modal ──────────────────────────────────────────────────── */}
      {panel === "create" && (
        <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-xl">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-black">Novo usuário</h2>
            <button onClick={closePanel} className="grid size-8 place-items-center rounded-md hover:bg-muted">
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-4">
            <label className="block text-[13px] font-semibold">
              Nome completo
              <input
                className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                placeholder="Ex: João Silva"
              />
            </label>
            <label className="block text-[13px] font-semibold">
              E-mail
              <input
                className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                type="email"
                value={cEmail}
                onChange={(e) => setCEmail(e.target.value)}
                placeholder="email@empresa.com"
              />
            </label>
            <label className="block text-[13px] font-semibold">
              Senha inicial <span className="font-normal text-muted-foreground">(mín. 8 caracteres)</span>
              <input
                className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                type="password"
                value={cPass}
                onChange={(e) => setCPass(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            <fieldset>
              <legend className="text-[13px] font-semibold">Papel</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <label
                    key={r.key}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                      cRole === r.key
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name="create-role"
                      value={r.key}
                      checked={cRole === r.key}
                      onChange={() => setCRole(r.key)}
                    />
                    <p className="text-[12px] font-bold">{r.label}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{r.description}</p>
                  </label>
                ))}
              </div>
            </fieldset>

            {cError && (
              <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[12px] text-primary">
                {cError}
              </p>
            )}

            <button
              disabled={isPending}
              onClick={() => {
                setCError("");
                run(
                  () => actionCreateUser({ name: cName, email: cEmail, password: cPass, roleKey: cRole }),
                  closePanel
                );
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              Criar usuário
            </button>
          </div>
        </div>
      )}

      {/* ── Edit slide-over ───────────────────────────────────────────────── */}
      {editUser && (
        <div className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[480px] flex-col border-l bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-black text-primary">
                {initials(editUser)}
              </div>
              <div>
                <p className="font-bold leading-tight">{editUser.name ?? "—"}</p>
                <p className="text-[12px] text-muted-foreground">{editUser.email}</p>
              </div>
            </div>
            <button onClick={closePanel} className="grid size-8 place-items-center rounded-md hover:bg-muted">
              <X className="size-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y">

              {/* Section: Info */}
              <section className="px-6 py-5">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Informações</h3>
                <div className="space-y-3">
                  <label className="block text-[13px] font-semibold">
                    Nome
                    <input
                      className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                      value={eName}
                      onChange={(e) => setEName(e.target.value)}
                    />
                  </label>
                  <label className="block text-[13px] font-semibold">
                    E-mail
                    <input
                      className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                      type="email"
                      value={eEmail}
                      onChange={(e) => setEEmail(e.target.value)}
                    />
                  </label>
                  <button
                    disabled={isPending || (eName === (editUser.name ?? "") && eEmail === editUser.email)}
                    onClick={() => run(() => actionUpdateUser(editUser.id, { name: eName, email: eEmail }), () => setESuccess("Informações salvas."))}
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-muted disabled:opacity-40"
                  >
                    {isPending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                    Salvar
                  </button>
                </div>
              </section>

              {/* Section: Role */}
              <section className="px-6 py-5">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Papel</h3>
                {isSelf(editUser) ? (
                  <p className="text-[12px] text-muted-foreground">Não é possível alterar o próprio papel.</p>
                ) : (
                  <div className="space-y-2">
                    {ROLES.map((r) => (
                      <label
                        key={r.key}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                          eRole === r.key ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                        }`}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          name="edit-role"
                          value={r.key}
                          checked={eRole === r.key}
                          onChange={() => {
                            setERole(r.key);
                            run(() => actionSetRole(editUser.id, r.key));
                          }}
                        />
                        <div className={`mt-0.5 size-4 shrink-0 rounded-full border-2 ${eRole === r.key ? "border-primary bg-primary" : "border-muted-foreground/40"}`} />
                        <div>
                          <p className="text-[12px] font-bold">{r.label}</p>
                          <p className="text-[11px] text-muted-foreground">{r.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </section>

              {/* Section: Scopes */}
              <section className="px-6 py-5">
                <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Restrições de dados</h3>
                <p className="mb-3 text-[11px] text-muted-foreground">
                  Sem restrições = acesso a todos os dados. Adicione dimensões para limitar o escopo.
                </p>

                {/* Existing scopes */}
                {Object.entries(groupScopes(editUser)).map(([dim, vals]) => (
                  <div key={dim} className="mb-2 rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{dim}</span>
                      <button
                        onClick={() => run(() => actionClearScope(editUser.id, dim))}
                        disabled={isPending}
                        className="grid size-5 place-items-center rounded hover:bg-muted"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {vals.map((v) => (
                        <span key={v} className="rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Add scope form */}
                <div className="mt-3 rounded-lg border border-dashed p-3">
                  <p className="mb-2 text-[11px] font-bold text-muted-foreground">Adicionar dimensão</p>
                  <input
                    className="mb-2 h-8 w-full rounded-md border bg-background px-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Dimensão (ex: empresa, filial)"
                    value={eScopeDim}
                    onChange={(e) => setEScopeDim(e.target.value)}
                  />
                  <textarea
                    className="mb-2 w-full resize-none rounded-md border bg-background px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                    rows={3}
                    placeholder="Valores, um por linha ou separados por vírgula"
                    value={eScopeVals}
                    onChange={(e) => setEScopeVals(e.target.value)}
                  />
                  <button
                    disabled={isPending || !eScopeDim.trim() || !eScopeVals.trim()}
                    onClick={() => {
                      const vals = parseValues(eScopeVals);
                      if (!vals.length) return;
                      run(() => actionSetScope(editUser.id, eScopeDim.trim(), vals), () => {
                        setEScopeDim(""); setEScopeVals("");
                      });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-[12px] font-bold text-primary transition-colors hover:bg-primary/20 disabled:opacity-40"
                  >
                    <Plus className="size-3" /> Adicionar
                  </button>
                </div>
              </section>

              {/* Section: Security */}
              <section className="px-6 py-5">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Segurança</h3>
                <div className="space-y-2">
                  <button
                    disabled={isPending || editUser.status === "DISABLED"}
                    onClick={() => run(
                      () => actionSendResetLink(editUser.email),
                      () => setESuccess("Link de recuperação enviado.")
                    )}
                    className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-[13px] transition-colors hover:bg-muted disabled:opacity-40"
                  >
                    <Mail className="size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">Enviar link de recuperação de senha</p>
                      <p className="text-[11px] text-muted-foreground">Expira em 1 hora. Enviado para {editUser.email}.</p>
                    </div>
                  </button>

                  {!isSelf(editUser) && (
                    <button
                      disabled={isPending}
                      onClick={() => run(() => actionToggleStatus(editUser.id, editUser.status))}
                      className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-[13px] transition-colors hover:bg-muted"
                    >
                      {editUser.status === "ACTIVE"
                        ? <UserMinus className="size-4 shrink-0 text-muted-foreground" />
                        : <UserPlus className="size-4 shrink-0 text-muted-foreground" />
                      }
                      <div>
                        <p className="font-semibold">
                          {editUser.status === "ACTIVE" ? "Desativar usuário" : "Reativar usuário"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {editUser.status === "ACTIVE"
                            ? "Bloqueia o acesso sem excluir o cadastro."
                            : "Restaura o acesso ao sistema."}
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              </section>

              {/* Section: Danger zone */}
              {!isSelf(editUser) && (
                <section className="px-6 py-5">
                  <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Zona de perigo</h3>
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex w-full items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-left text-[13px] text-primary transition-colors hover:bg-primary/10"
                    >
                      <Trash2 className="size-4 shrink-0" />
                      <div>
                        <p className="font-semibold">Excluir usuário</p>
                        <p className="text-[11px] opacity-70">Ação irreversível. Remove o usuário e todos os dados associados.</p>
                      </div>
                    </button>
                  ) : (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <AlertTriangle className="size-4 text-primary" />
                        <p className="text-[13px] font-bold text-primary">Confirmar exclusão?</p>
                      </div>
                      <p className="mb-3 text-[12px] text-primary/80">
                        O usuário <strong>{editUser.name ?? editUser.email}</strong> será excluído permanentemente.
                      </p>
                      <div className="flex gap-2">
                        <button
                          disabled={isPending}
                          onClick={() => run(() => actionDeleteUser(editUser.id), closePanel)}
                          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-bold text-primary-foreground disabled:opacity-50"
                        >
                          {isPending ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                          Excluir
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="rounded-md border px-3 py-1.5 text-[12px] font-semibold hover:bg-card"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>

          {/* Footer: feedback */}
          {(eError || eSuccess) && (
            <div className={`border-t px-6 py-3 text-[12px] font-semibold ${eError ? "bg-primary/5 text-primary" : "bg-green-50 text-green-700"}`}>
              {eError || eSuccess}
            </div>
          )}
        </div>
      )}
    </>
  );
}
