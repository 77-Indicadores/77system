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

export async function checkCatworldHealth(): Promise<"online" | "indisponivel" | "nao_configurado"> {
  const { baseUrl, isConfigured } = getCatworldConfig();
  if (!isConfigured) return "nao_configurado";
  try {
    const response = await fetch(`${baseUrl}/health`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    return response.ok ? "online" : "indisponivel";
  } catch {
    return "indisponivel";
  }
}
