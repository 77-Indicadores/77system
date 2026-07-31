// Catworld usa configuracao via variáveis de ambiente, não banco de dados.
// CATWORLD_BASE_URL e CATWORLD_TOKEN devem estar no .env do deploy.

export type CatworldConfig = {
  baseUrl: string;
  token: string;
  isConfigured: boolean;
};

export function getCatworldConfig(): CatworldConfig {
  const baseUrl = process.env.CATWORLD_BASE_URL ?? "";
  const token = process.env.CATWORLD_TOKEN ?? "";
  return {
    baseUrl,
    token,
    isConfigured: baseUrl.length > 0 && token.length > 0,
  };
}

export type CatworldHealth = "online" | "indisponível" | "não configurado";

export async function checkCatworldHealth(): Promise<CatworldHealth> {
  const { baseUrl, isConfigured } = getCatworldConfig();
  if (!isConfigured) return "não configurado";
  try {
    const response = await fetch(`${baseUrl}/health`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    return response.ok ? "online" : "indisponível";
  } catch {
    return "indisponível";
  }
}
