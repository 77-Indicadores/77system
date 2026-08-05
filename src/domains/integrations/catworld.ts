// Catworld usa configuracao via variáveis de ambiente, não banco de dados.
// Variáveis obrigatórias no .env do deploy:
//   CATWORLD_BASE_URL        ex: https://catworld.77indicadores.com.br
//   CATWORLD_TOKEN           token de API (cw_live_...)
//   CATWORLD_PROJECT_ID      UUID do projeto no Catworld — dá acesso a todos
//                            os datasets do projeto sem precisar de dataset_id

export type CatworldConfig = {
  baseUrl: string;
  token: string;
  projectId: string;
  isConfigured: boolean;
};

export function getCatworldConfig(): CatworldConfig {
  const baseUrl = process.env.CATWORLD_BASE_URL ?? "";
  const token = process.env.CATWORLD_TOKEN ?? "";
  const projectId = process.env.CATWORLD_PROJECT_ID ?? "";
  return {
    baseUrl,
    token,
    projectId,
    isConfigured: baseUrl.length > 0 && token.length > 0 && projectId.length > 0,
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
