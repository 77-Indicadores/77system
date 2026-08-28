import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A alçada de acesso, exercitada de verdade.
 *
 * `tests/rbac.test.ts` garante o contrato — que o `operador` não recebe as permissões
 * amplas. Aqui é o outro lado: dado que ele não as tem, o que a concessão por usuário
 * realmente libera. São os dois casos que se erram calados, sem exceção nenhuma:
 * conceder uma tela solta e ela não abrir, e conceder um cadastro e a tela listar todos.
 */

const groupFindMany = vi.fn();
const screenFindUnique = vi.fn();
const registryFindMany = vi.fn();
const auth = vi.fn();
const getUserPermissionSet = vi.fn();
const getUserResourcePolicies = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    dashboardGroup: { findMany: groupFindMany },
    dashboardScreen: { findUnique: screenFindUnique },
    registryDefinition: { findMany: registryFindMany },
  },
}));

vi.mock("@/auth", () => ({ auth }));

vi.mock("@/domains/rbac/service", () => ({
  getUserPermissionSet,
  getUserResourcePolicies,
}));

const PERM_GRUPO = "indicators.group.view";
const PERM_TELA = "indicators.dashboard.view";
const PERM_CADASTRO = "registries.module.view";
const PERM_ESCRITA = "registries.record.manage";

/** Um grupo com duas telas, que é o mínimo para distinguir "o bloco" de "uma tela". */
const GRUPO_FINANCEIRO = {
  id: "g1",
  slug: "financeiro",
  name: "Financeiro",
  isActive: true,
  requiredPermission: PERM_GRUPO,
  screens: [
    { id: "s1", slug: "financeiro.receitas", name: "Receitas", requiredPermission: PERM_TELA },
    { id: "s2", slug: "financeiro.dre", name: "DRE", requiredPermission: PERM_TELA },
  ],
};

function policy(resourceType: string, resourceId: string, permissionKey: string) {
  return { permissionKey, resourceType, resourceId };
}

beforeEach(() => {
  vi.resetModules();
  groupFindMany.mockReset();
  screenFindUnique.mockReset();
  registryFindMany.mockReset();
  auth.mockReset();
  getUserPermissionSet.mockReset();
  getUserResourcePolicies.mockReset();

  auth.mockResolvedValue({ user: { email: "operador@cliente.local" } });
  groupFindMany.mockResolvedValue([GRUPO_FINANCEIRO]);
  getUserPermissionSet.mockResolvedValue(new Set<string>());
  getUserResourcePolicies.mockResolvedValue([]);
});

describe("listVisibleDashboardGroups", () => {
  it("não mostra nada a quem não recebeu alçada nenhuma", async () => {
    const { listVisibleDashboardGroups } = await import("@/domains/indicators/service");
    expect(await listVisibleDashboardGroups()).toEqual([]);
  });

  it("mostra tudo a quem tem a permissão ampla do papel", async () => {
    getUserPermissionSet.mockResolvedValue(new Set([PERM_GRUPO, PERM_TELA]));

    const { listVisibleDashboardGroups } = await import("@/domains/indicators/service");
    const visiveis = await listVisibleDashboardGroups();

    expect(visiveis).toHaveLength(1);
    expect(visiveis[0].screens.map((s) => s.slug)).toEqual([
      "financeiro.receitas",
      "financeiro.dre",
    ]);
  });

  it("conceder o grupo libera o bloco inteiro, telas incluídas", async () => {
    getUserResourcePolicies.mockResolvedValue([
      policy("dashboard_group", "financeiro", PERM_GRUPO),
    ]);

    const { listVisibleDashboardGroups } = await import("@/domains/indicators/service");
    const visiveis = await listVisibleDashboardGroups();

    // Nenhuma tela foi concedida individualmente, e mesmo assim as duas aparecem.
    expect(visiveis[0].screens.map((s) => s.slug)).toEqual([
      "financeiro.receitas",
      "financeiro.dre",
    ]);
  });

  it("conceder uma tela solta libera só ela, sem precisar do grupo", async () => {
    getUserResourcePolicies.mockResolvedValue([
      policy("dashboard_screen", "financeiro.dre", PERM_TELA),
    ]);

    const { listVisibleDashboardGroups } = await import("@/domains/indicators/service");
    const visiveis = await listVisibleDashboardGroups();

    /*
     * Este é o caso que falhava calado: o grupo não concedido era pulado antes de olhar as
     * telas, e a concessão de uma tela isolada não dava acesso a nada. A tela de Usuários
     * mostrava o item marcado, e a pessoa entrava e não via nada.
     */
    expect(visiveis).toHaveLength(1);
    expect(visiveis[0].screens.map((s) => s.slug)).toEqual(["financeiro.dre"]);
  });

  it("omite o grupo em que nenhuma tela sobrou", async () => {
    getUserResourcePolicies.mockResolvedValue([
      policy("dashboard_screen", "outro.grupo.tela", PERM_TELA),
    ]);

    const { listVisibleDashboardGroups } = await import("@/domains/indicators/service");
    expect(await listVisibleDashboardGroups()).toEqual([]);
  });
});

describe("requireDashboardAccess", () => {
  beforeEach(() => {
    screenFindUnique.mockResolvedValue({
      id: "s2",
      slug: "financeiro.dre",
      name: "DRE",
      isActive: true,
      requiredPermission: PERM_TELA,
      group: { ...GRUPO_FINANCEIRO },
    });
  });

  it("nega a quem não recebeu nem o grupo nem a tela", async () => {
    const { requireDashboardAccess } = await import("@/domains/indicators/service");
    expect(await requireDashboardAccess("financeiro.dre")).toBeNull();
  });

  it("abre a tela concedida sozinha, e só mostra ela no menu do grupo", async () => {
    getUserResourcePolicies.mockResolvedValue([
      policy("dashboard_screen", "financeiro.dre", PERM_TELA),
    ]);

    const { requireDashboardAccess } = await import("@/domains/indicators/service");
    const tela = await requireDashboardAccess("financeiro.dre");

    expect(tela).not.toBeNull();
    expect(tela!.group.screens.map((s) => s.slug)).toEqual(["financeiro.dre"]);
  });

  it("abre a tela para quem recebeu o grupo, com as irmãs no menu", async () => {
    getUserResourcePolicies.mockResolvedValue([
      policy("dashboard_group", "financeiro", PERM_GRUPO),
    ]);

    const { requireDashboardAccess } = await import("@/domains/indicators/service");
    const tela = await requireDashboardAccess("financeiro.dre");

    expect(tela!.group.screens.map((s) => s.slug)).toEqual([
      "financeiro.receitas",
      "financeiro.dre",
    ]);
  });
});

describe("cadastros visíveis", () => {
  beforeEach(() => {
    registryFindMany.mockResolvedValue([
      { key: "vendedores", name: "Vendedores" },
      { key: "centros-custo", name: "Centros de custo" },
    ]);
  });

  it("não mostra cadastro nenhum sem alçada", async () => {
    const { cadastrosVisiveis } = await import("@/domains/registries/acesso");
    expect(await cadastrosVisiveis()).toEqual([]);
  });

  it("mostra todos a quem tem a permissão ampla do papel", async () => {
    getUserPermissionSet.mockResolvedValue(new Set([PERM_CADASTRO]));

    const { cadastrosVisiveis } = await import("@/domains/registries/acesso");
    expect(await cadastrosVisiveis()).toEqual(["vendedores", "centros-custo"]);
  });

  it("mostra apenas o cadastro concedido", async () => {
    getUserResourcePolicies.mockResolvedValue([
      policy("registry_module", "vendedores", PERM_CADASTRO),
    ]);

    const { cadastrosVisiveis } = await import("@/domains/registries/acesso");
    expect(await cadastrosVisiveis()).toEqual(["vendedores"]);
  });

  it("barra por URL o cadastro fora da alçada", async () => {
    getUserResourcePolicies.mockResolvedValue([
      policy("registry_module", "vendedores", PERM_CADASTRO),
    ]);

    const { podeVerCadastro } = await import("@/domains/registries/acesso");
    expect(await podeVerCadastro("vendedores")).toBe(true);
    // Sem isso, digitar /registries/centros-custo abria a grade inteira.
    expect(await podeVerCadastro("centros-custo")).toBe(false);
  });

  it("ignora política de cadastro que não existe mais", async () => {
    getUserResourcePolicies.mockResolvedValue([
      policy("registry_module", "cadastro-removido", PERM_CADASTRO),
    ]);

    const { cadastrosVisiveis } = await import("@/domains/registries/acesso");
    expect(await cadastrosVisiveis()).toEqual([]);
  });
});

describe("escrita em cadastro", () => {
  beforeEach(() => {
    registryFindMany.mockResolvedValue([
      { key: "vendedores", name: "Vendedores" },
      { key: "centros-custo", name: "Centros de custo" },
    ]);
  });

  it("não deixa gravar quem só recebeu a alçada de leitura", async () => {
    getUserResourcePolicies.mockResolvedValue([
      policy("registry_module", "vendedores", PERM_CADASTRO),
    ]);

    const { podeEditarCadastro } = await import("@/domains/registries/acesso");
    // Enxerga o cadastro, mas não tem registries.record.manage no papel.
    expect(await podeEditarCadastro("vendedores")).toBe(false);
  });

  it("não deixa gravar em cadastro fora da alçada, mesmo com a permissão de escrita", async () => {
    getUserPermissionSet.mockResolvedValue(new Set([PERM_ESCRITA]));
    getUserResourcePolicies.mockResolvedValue([
      policy("registry_module", "vendedores", PERM_CADASTRO),
    ]);

    const { podeEditarCadastro } = await import("@/domains/registries/acesso");
    expect(await podeEditarCadastro("vendedores")).toBe(true);
    // A permissao de escrita e' global; a alcada e' que diz em qual cadastro.
    expect(await podeEditarCadastro("centros-custo")).toBe(false);
  });

  it("deixa gravar quem tem alçada e permissão de escrita", async () => {
    getUserPermissionSet.mockResolvedValue(new Set([PERM_CADASTRO, PERM_ESCRITA]));

    const { podeEditarCadastro } = await import("@/domains/registries/acesso");
    expect(await podeEditarCadastro("centros-custo")).toBe(true);
  });

  it("a guarda da server action recusa em vez de deixar passar", async () => {
    getUserResourcePolicies.mockResolvedValue([
      policy("registry_module", "vendedores", PERM_CADASTRO),
    ]);

    const { requireEdicaoDeCadastro } = await import("@/domains/registries/acesso");
    /*
     * Server action e' endpoint publico: esconder o formulario nao impede a chamada.
     * Sem esta guarda, qualquer autenticado gravava em qualquer cadastro.
     */
    await expect(requireEdicaoDeCadastro("vendedores")).rejects.toThrow(/Sem permissao/);
  });

  it("não deixa gravar sem sessão", async () => {
    auth.mockResolvedValue(null);
    getUserPermissionSet.mockResolvedValue(new Set([PERM_CADASTRO, PERM_ESCRITA]));

    const { podeEditarCadastro } = await import("@/domains/registries/acesso");
    expect(await podeEditarCadastro("vendedores")).toBe(false);
  });
});

describe("sessão ausente", () => {
  it("não vaza grupo nem cadastro para quem não está autenticado", async () => {
    auth.mockResolvedValue(null);
    getUserPermissionSet.mockResolvedValue(new Set([PERM_GRUPO, PERM_TELA, PERM_CADASTRO]));

    const { listVisibleDashboardGroups } = await import("@/domains/indicators/service");
    const { cadastrosVisiveis } = await import("@/domains/registries/acesso");

    expect(await listVisibleDashboardGroups()).toEqual([]);
    expect(await cadastrosVisiveis()).toEqual([]);
  });
});
