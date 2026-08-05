import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const prisma = new PrismaClient();

type PermissionsContract = {
  roles: Record<string, { description?: string; permissions: string[] }>;
  permissions: Array<{ id: string; description?: string }>;
};

function readPermissionsContract() {
  const file = path.join(process.cwd(), "contracts", "permissions", "permissions.yaml");
  return YAML.parse(fs.readFileSync(file, "utf8")) as PermissionsContract;
}

async function main() {
  const contract = readPermissionsContract();

  for (const permission of contract.permissions) {
    await prisma.permission.upsert({
      where: { key: permission.id },
      update: { description: permission.description },
      create: { key: permission.id, description: permission.description }
    });
  }

  for (const [key, role] of Object.entries(contract.roles)) {
    const savedRole = await prisma.role.upsert({
      where: { key },
      update: { description: role.description, name: key },
      create: { key, name: key, description: role.description }
    });

    for (const permissionKey of role.permissions) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key: permissionKey } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: savedRole.id, permissionId: permission.id } },
        update: {},
        create: { roleId: savedRole.id, permissionId: permission.id }
      });
    }
  }

  const passwordHash = await bcrypt.hash(process.env.SUPER77_PASSWORD ?? "super77-dev-password", 12);
  const super77 = await prisma.user.upsert({
    where: { email: process.env.SUPER77_EMAIL ?? "super77@77.local" },
    update: { name: "Super77", passwordHash, status: "ACTIVE" },
    create: {
      email: process.env.SUPER77_EMAIL ?? "super77@77.local",
      name: "Super77",
      passwordHash,
      status: "ACTIVE"
    }
  });

  const super77Role = await prisma.role.findUniqueOrThrow({ where: { key: "super77" } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: super77.id, roleId: super77Role.id } },
    update: {},
    create: { userId: super77.id, roleId: super77Role.id }
  });

  const group = await prisma.dashboardGroup.upsert({
    where: { slug: "financeiro" },
    update: {},
    create: {
      name: "Financeiro",
      slug: "financeiro",
      description: "Grupo inicial de indicadores financeiros.",
      icon: "wallet",
      order: 1,
      requiredPermission: "indicators.group.view"
    }
  });

  await prisma.dashboardScreen.upsert({
    where: { slug: "financeiro.receitas" },
    update: {},
    create: {
      groupId: group.id,
      name: "Receitas",
      slug: "financeiro.receitas",
      description: "Tela inicial demonstrando widgets do boilerplate.",
      layoutJson: { columns: 12 },
      filtersJson: { dateRange: true },
      dataContractId: "financial-revenue-summary",
      requiredPermission: "indicators.dashboard.view",
      order: 1
    }
  });

  const dataSource = await prisma.dataSource.upsert({
    where: { key: "catworld-financeiro" },
    update: {},
    create: {
      key: "catworld-financeiro",
      name: "Catworld Financeiro",
      type: "CATWORLD",
      mode: "MATERIALIZED",
      datasetRef: process.env.CATWORLD_PROJECT_ID ?? "demo",
      description: "Fonte Catworld de exemplo. Substitua pela integração real do cliente."
    }
  });

  await prisma.dataRefreshSchedule.upsert({
    where: { id: "seed-catworld-financeiro-schedule" },
    update: {},
    create: {
      id: "seed-catworld-financeiro-schedule",
      dataSourceId: dataSource.id,
      cronExpression: "*/15 * * * *",
      timezone: "America/Sao_Paulo",
      isActive: true,
      nextRunAt: new Date()
    }
  });

  await prisma.dataContractRegistry.upsert({
    where: { contractId: "financial-revenue-summary" },
    update: {},
    create: {
      contractId: "financial-revenue-summary",
      sourceMode: "MATERIALIZED",
      stagingTable: "stg_financial_revenue",
      materializedTable: "metric_financial_revenue_summary",
      freshnessSeconds: 900,
      allowLiveFallback: false
    }
  });

  const months = [
    { date: new Date("2026-04-01T00:00:00.000Z"), revenue: "184320.50", customerCount: 1048 },
    { date: new Date("2026-05-01T00:00:00.000Z"), revenue: "203870.25", customerCount: 1132 },
    { date: new Date("2026-06-01T00:00:00.000Z"), revenue: "221410.00", customerCount: 1233 },
    { date: new Date("2026-07-01T00:00:00.000Z"), revenue: "248930.00", customerCount: 1284 }
  ];

  for (const month of months) {
    await prisma.financialRevenueMetric.upsert({
      where: { date: month.date },
      update: { revenue: month.revenue, customerCount: month.customerCount },
      create: month
    });
  }

  await prisma.registryDefinition.upsert({
    where: { key: "vendedores" },
    update: {},
    create: {
      key: "vendedores",
      name: "Vendedores",
      description: "Cadastro demo para cruzar metas e dados comerciais.",
      schemaJson: {
        fields: [
          { name: "nome", type: "string", required: true },
          { name: "email", type: "string", required: false },
          { name: "meta", type: "decimal", required: true },
          { name: "ativo", type: "boolean", default: true }
        ]
      }
    }
  });

  await prisma.registryDefinition.upsert({
    where: { key: "centros-custo" },
    update: {},
    create: {
      key: "centros-custo",
      name: "Centros de custo",
      description: "Estrutura auxiliar para rateios, metas e visoes gerenciais.",
      schemaJson: {
        fields: [
          { name: "codigo", label: "Codigo", type: "string", required: true },
          { name: "nome", label: "Nome", type: "string", required: true },
          { name: "orcamento", label: "Orcamento", type: "decimal", required: true },
          { name: "ativo", label: "Ativo", type: "boolean", default: true }
        ]
      }
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
