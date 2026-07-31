import { describe, expect, it } from "vitest";
import { validateRegistryData, parseRegistrySchema } from "@/domains/registries/service";

const schema = parseRegistrySchema({
  fields: [
    { name: "nome", label: "Nome", type: "string", required: true },
    { name: "valor", label: "Valor", type: "decimal", required: true },
    { name: "ativo", label: "Ativo", type: "boolean" },
    { name: "inicio", label: "Início", type: "date" },
    { name: "quantidade", label: "Quantidade", type: "integer" },
  ],
});

describe("validateRegistryData", () => {
  it("aceita dados válidos sem erros", () => {
    const errors = validateRegistryData(
      { nome: "Produto A", valor: "123.45", ativo: true, inicio: "2024-01-01", quantidade: 10 },
      schema
    );
    expect(errors).toHaveLength(0);
  });

  it("rejeita campo obrigatório ausente", () => {
    const errors = validateRegistryData({ valor: 10 }, schema);
    expect(errors.some((e) => e.field === "nome")).toBe(true);
  });

  it("rejeita decimal inválido", () => {
    const errors = validateRegistryData({ nome: "X", valor: "abc" }, schema);
    expect(errors.some((e) => e.field === "valor")).toBe(true);
  });

  it("rejeita inteiro não inteiro", () => {
    const errors = validateRegistryData({ nome: "X", valor: "10", quantidade: 1.5 }, schema);
    expect(errors.some((e) => e.field === "quantidade")).toBe(true);
  });

  it("rejeita data inválida", () => {
    const errors = validateRegistryData({ nome: "X", valor: "10", inicio: "nao-e-data" }, schema);
    expect(errors.some((e) => e.field === "inicio")).toBe(true);
  });

  it("rejeita campos desconhecidos", () => {
    const errors = validateRegistryData({ nome: "X", valor: "10", campo_extra: "opa" }, schema);
    expect(errors.some((e) => e.field === "campo_extra")).toBe(true);
  });

  it("ignora campos opcionais ausentes sem erro", () => {
    const errors = validateRegistryData({ nome: "X", valor: "10" }, schema);
    expect(errors).toHaveLength(0);
  });
});
