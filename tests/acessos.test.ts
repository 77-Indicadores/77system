import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/acessos/json/route";
import { slugDaRota } from "@/domains/acessos/rotas";

afterEach(() => vi.unstubAllEnvs());

describe("exportação pública de acessos", () => {
  it("recusa consultas quando não há secret configurada", async () => {
    vi.stubEnv("ACCESS_EXPORT_SECRET", "");
    const response = await GET(new Request("http://localhost/api/acessos/json?secret=qualquer"));
    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("recusa secret incorreta antes de consultar dados", async () => {
    vi.stubEnv("ACCESS_EXPORT_SECRET", "segredo-do-cliente");
    const response = await GET(new Request("http://localhost/api/acessos/json?secret=errado"));
    expect(response.status).toBe(401);
  });
});

describe("rotas de acesso do boilerplate", () => {
  it("registra dashboards pelo slug e agrupa subrotas administrativas", () => {
    expect(slugDaRota("/dashboard/financeiro.dre")).toBe("financeiro.dre");
    expect(slugDaRota("/super77/data/jobs")).toBe("/super77/data");
    expect(slugDaRota("/rota-nao-configurada")).toBeNull();
  });
});
