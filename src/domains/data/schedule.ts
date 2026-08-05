const CRON_FIELD_PATTERN = /^[\d*/,.-]+$/;

export function normalizeCronExpression(expression: string) {
  return expression.trim().replace(/\s+/g, " ");
}

export function validateCronExpression(expression: string) {
  const normalized = normalizeCronExpression(expression);
  const parts = normalized.split(" ");

  if (parts.length !== 5 || parts.some((part) => part.length === 0)) {
    return { ok: false as const, message: "Use uma expressao cron com 5 campos, ex: */15 * * * *." };
  }

  if (!parts.every((part) => CRON_FIELD_PATTERN.test(part))) {
    return { ok: false as const, message: "O cron so pode conter numeros, *, /, virgula, ponto e hifen." };
  }

  const intervalMatch = parts[0].match(/^\*\/(\d+)$/);
  if (intervalMatch) {
    const interval = Number(intervalMatch[1]);
    if (!Number.isInteger(interval) || interval < 1 || interval > 59) {
      return { ok: false as const, message: "O intervalo em minutos deve ficar entre 1 e 59." };
    }
  }

  return { ok: true as const, cronExpression: normalized };
}

// Supports simple minute intervals directly. Other valid five-field crons fall back to the next full hour.
export function computeNextRun(expression: string, from = new Date()): Date {
  const parts = normalizeCronExpression(expression).split(" ");
  const minutePart = parts[0];

  const match = minutePart.match(/^\*\/(\d+)$/);
  if (match) {
    const interval = parseInt(match[1], 10) * 60 * 1000;
    return new Date(from.getTime() + interval);
  }

  const next = new Date(from);
  next.setMinutes(next.getMinutes() + 60, 0, 0);
  return next;
}
