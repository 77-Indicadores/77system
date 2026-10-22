"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * O sinal de presenca e de tela.
 *
 * Manda a rota JUNTO com o sinal de presenca, de minuto em minuto, e so'
 * enquanto a aba esta' visivel: aba de fundo esquecida nao e' tempo de uso, e
 * contar como tempo transformaria a trilha num medidor de quem esquece abas.
 *
 * O SINAL DE DESPEDIDA fecha a visita com a hora real. Sem ele, quem abre a
 * tela, olha quarenta segundos e troca deixaria uma visita parada no ultimo
 * minuto cheio -- e vinte minutos de tela virariam dezenove. Vai por
 * `sendBeacon`, que e' o unico jeito de uma requisicao sobreviver ao
 * fechamento da aba.
 */
export function UserActivityHeartbeat() {
  const pathname = usePathname();
  // A rota num ref para o sinal de minuto sempre ler a atual sem reinstalar o
  // intervalo a cada navegacao.
  const rotaAtual = useRef(pathname);
  rotaAtual.current = pathname;

  useEffect(() => {
    const match = /^\/dashboard\/([^/]+)$/.exec(pathname);
    if (!match) return;
    void fetch("/api/screen-views", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: decodeURIComponent(match[1]) }),
    }).catch(() => {});
  }, [pathname]);

  useEffect(() => {
    const send = (rota: string, fim = false) => {
      void fetch("/api/user-activity", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rota, fim }),
      }).catch(() => {});
    };

    const despedir = (rota: string) => {
      const corpo = JSON.stringify({ rota, fim: true });
      // `sendBeacon` sobrevive ao fechamento da aba; o fetch nao. Se o
      // navegador recusar (fila cheia), tenta o caminho normal -- numa troca de
      // tela ele ainda da' tempo.
      const ok =
        typeof navigator !== "undefined" &&
        typeof navigator.sendBeacon === "function" &&
        navigator.sendBeacon("/api/user-activity", new Blob([corpo], { type: "application/json" }));
      if (!ok) send(rota, true);
    };

    send(pathname);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") send(rotaAtual.current);
    }, 60_000);

    const aoEsconder = () => {
      if (document.visibilityState === "hidden") despedir(rotaAtual.current);
      else send(rotaAtual.current);
    };
    const aoFocar = () => send(rotaAtual.current);
    // Nomeado, e nao inline: a cada navegacao este efeito roda de novo, e um
    // ouvinte anonimo nunca sai -- vinte telas depois seriam vinte despedidas
    // por aba fechada.
    const aoSair = () => despedir(rotaAtual.current);

    document.addEventListener("visibilitychange", aoEsconder);
    window.addEventListener("focus", aoFocar);
    window.addEventListener("pagehide", aoSair);

    // Ao TROCAR de tela, fecha a visita da anterior: e' a mesma despedida que o
    // fechamento da aba faz, e sem ela a visita so' terminaria por silencio,
    // tres minutos depois.
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", aoEsconder);
      window.removeEventListener("focus", aoFocar);
      window.removeEventListener("pagehide", aoSair);
      despedir(pathname);
    };
  }, [pathname]);

  return null;
}
