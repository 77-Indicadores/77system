import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { describe, expect, it } from "vitest";
import { ROUTE_PERMISSIONS } from "@/domains/rbac/permissions";
import {
  PERMISSAO_CADASTRO,
  PERMISSAO_GRUPO,
  PERMISSAO_TELA,
  TIPO_CADASTRO,
  TIPO_GRUPO,
  TIPO_TELA,
} from "@/domains/rbac/recursos";

type Contract = {
  roles: Record<string, { permissions: string[] }>;
  permissions: Array<{ id: string }>;
  resource_types: string[];
};

const contract = YAML.parse(
  fs.readFileSync(path.join(process.cwd(), "contracts", "permissions", "permissions.yaml"), "utf8")
) as Contract;

describe("route permissions", () => {
  it("protects super77 routes", () => {
    expect(ROUTE_PERMISSIONS["/super77"]).toBe("super77.access");
    expect(ROUTE_PERMISSIONS["/super77/catworld"]).toBe("integrations.catworld.view");
  });

  it("protects job and export APIs", () => {
    expect(ROUTE_PERMISSIONS["/api/jobs"]).toBe("system.jobs.view");
    expect(ROUTE_PERMISSIONS["/api/exports"]).toBe("exports.excel.create");
  });
});

describe("alçada de acesso", () => {
  /*
   * Este é o teste que sustenta o modelo inteiro: se o operador voltar a receber as
   * permissões amplas no contrato, todo operador passa a ver tudo e a concessão por
   * usuário deixa de restringir qualquer coisa — sem nenhum erro aparecer.
   */
  it("não concede as permissões amplas ao papel operador", () => {
    const operador = contract.roles.operador.permissions;
    expect(operador).not.toContain(PERMISSAO_GRUPO);
    expect(operador).not.toContain(PERMISSAO_TELA);
    expect(operador).not.toContain(PERMISSAO_CADASTRO);
  });

  it("mantém as permissões amplas no papel super77", () => {
    const super77 = contract.roles.super77.permissions;
    expect(super77).toContain(PERMISSAO_GRUPO);
    expect(super77).toContain(PERMISSAO_TELA);
    expect(super77).toContain(PERMISSAO_CADASTRO);
  });

  it("declara no contrato as permissões que a alçada grava", () => {
    const declaradas = new Set(contract.permissions.map((p) => p.id));
    for (const key of [PERMISSAO_GRUPO, PERMISSAO_TELA, PERMISSAO_CADASTRO]) {
      expect(declaradas.has(key)).toBe(true);
    }
  });

  it("usa tipos de recurso declarados no contrato", () => {
    const tipos = new Set(contract.resource_types);
    for (const tipo of [TIPO_GRUPO, TIPO_TELA, TIPO_CADASTRO]) {
      expect(tipos.has(tipo)).toBe(true);
    }
  });
});
