import { expect, test } from "@playwright/test";

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "77System" })).toBeVisible();
});

test("super77 can reach dashboard and registries", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("super77@77.local");
  await page.getByLabel("Senha").fill("super77-dev-password");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Indicadores" })).toBeVisible({ timeout: 30000 });
  await page.goto("/dashboard/financeiro.receitas");
  await expect(page.getByRole("heading", { name: "Receitas" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByText("Receita materializada")).toBeVisible();
  await page.goto("/registries");
  await expect(page.getByRole("heading", { name: "Cadastros" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vendedores" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Centros de custo" })).toBeVisible();
  await page.goto("/registries/centros-custo");
  await expect(page.getByRole("heading", { name: "Centros de custo" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Codigo" })).toBeVisible();
});
