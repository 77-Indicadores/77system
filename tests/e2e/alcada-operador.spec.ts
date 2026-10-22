import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { expect, test } from "@playwright/test";

/**
 * A alçada de acesso vista pelo navegador.
 *
 * O smoke entra como super77, que enxerga tudo por permissão global — passa sem tocar em
 * uma linha da alçada. Aqui é o contrário: um operador que recebeu UMA tela e UM cadastro,
 * e não pode alcançar o resto nem digitando a URL.
 *
 * A fixture cria a segunda tela porque o seed só traz uma: sem duas, não há o que esconder.
 */

const prisma = new PrismaClient();

const EMAIL = "operador.e2e@77.local";
const SENHA = "operador-e2e-password";

const TELA_CONCEDIDA = "financeiro.receitas";
const TELA_NEGADA = "financeiro.despesas";
const CADASTRO_CONCEDIDO = "vendedores";
const CADASTRO_NEGADO = "centros-custo";

let userId = "";

test.beforeAll(async () => {
  const grupo = await prisma.dashboardGroup.findUniqueOrThrow({ where: { slug: "financeiro" } });

  // A tela que o operador NAO recebe. So' existe para provar que ela fica de fora.
  await prisma.dashboardScreen.upsert({
    where: { slug: TELA_NEGADA },
    update: { isActive: true },
    create: {
      groupId: grupo.id,
      name: "Despesas",
      slug: TELA_NEGADA,
      description: "Tela de apoio ao teste de alçada.",
      layoutJson: { columns: 12 },
      filtersJson: {},
      requiredPermission: "indicators.dashboard.view",
      order: 2,
    },
  });

  const papel = await prisma.role.findUniqueOrThrow({ where: { key: "operador" } });
  const usuario = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { status: "ACTIVE", passwordHash: await bcrypt.hash(SENHA, 12) },
    create: {
      email: EMAIL,
      name: "Operador E2E",
      passwordHash: await bcrypt.hash(SENHA, 12),
      status: "ACTIVE",
    },
  });
  userId = usuario.id;

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: usuario.id, roleId: papel.id } },
    update: {},
    create: { userId: usuario.id, roleId: papel.id },
  });

  const permTela = await prisma.permission.findUniqueOrThrow({
    where: { key: "indicators.dashboard.view" },
  });
  const permCadastro = await prisma.permission.findUniqueOrThrow({
    where: { key: "registries.module.view" },
  });

  // Concede a tela SOLTA, sem o grupo: e' o caso que antes nao dava acesso a nada.
  await prisma.resourcePolicy.deleteMany({ where: { userId: usuario.id } });
  await prisma.resourcePolicy.createMany({
    data: [
      {
        userId: usuario.id,
        permissionId: permTela.id,
        resourceType: "dashboard_screen",
        resourceId: TELA_CONCEDIDA,
      },
      {
        userId: usuario.id,
        permissionId: permCadastro.id,
        resourceType: "registry_module",
        resourceId: CADASTRO_CONCEDIDO,
      },
    ],
  });
});

test.afterAll(async () => {
  // A politica cai junto pelo cascade; o delete explicito cobre banco ainda sem a migration.
  if (userId) {
    await prisma.resourcePolicy.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  }
  await prisma.dashboardScreen.deleteMany({ where: { slug: TELA_NEGADA } });
  await prisma.$disconnect();
});

async function entrar(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Indicadores" })).toBeVisible({ timeout: 30000 });
}

test("operador enxerga a tela concedida e não a outra", async ({ page }) => {
  await entrar(page);

  await expect(page.getByRole("link", { name: "Receitas" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Despesas" })).toHaveCount(0);

  await page.goto(`/dashboard/${TELA_CONCEDIDA}`);
  await expect(page.getByRole("heading", { name: "Receitas" })).toBeVisible({ timeout: 30000 });
});

test("tela fora da alçada responde 404, mesmo pela URL", async ({ page }) => {
  await entrar(page);

  const resposta = await page.goto(`/dashboard/${TELA_NEGADA}`);
  expect(resposta?.status()).toBe(404);
});

test("operador enxerga só o cadastro concedido", async ({ page }) => {
  await entrar(page);

  await page.goto("/registries");
  await expect(page.getByRole("heading", { name: "Vendedores" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Centros de custo" })).toHaveCount(0);
});

test("cadastro fora da alçada responde 404, mesmo pela URL", async ({ page }) => {
  await entrar(page);

  const resposta = await page.goto(`/registries/${CADASTRO_NEGADO}`);
  expect(resposta?.status()).toBe(404);
});

test("operador sem registries.record.manage não vê o formulário de gravação", async ({ page }) => {
  await entrar(page);

  await page.goto(`/registries/${CADASTRO_CONCEDIDO}`);
  await expect(page.getByRole("heading", { name: "Vendedores" })).toBeVisible();
  // Ver e gravar sao coisas separadas: ele alcanca o cadastro e nao mexe nele.
  await expect(page.getByRole("heading", { name: "Novo registro" })).toHaveCount(0);
});
