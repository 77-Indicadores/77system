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

/** America/Sao_Paulo is permanently UTC-3 (no DST since 2019). */
const SP_OFFSET_MS = 3 * 60 * 60 * 1000;

export function computeNextRun(expression: string, from = new Date()): Date {
  const parts = normalizeCronExpression(expression).split(" ");
  const [minutePart, hourPart, dayOfMonth, month, dayOfWeek] = parts;

  // */N * * * * — run every N minutes
  const intervalMatch = minutePart.match(/^\*\/(\d+)$/);
  if (intervalMatch) {
    return new Date(from.getTime() + parseInt(intervalMatch[1], 10) * 60_000);
  }

  // M H * * * — daily at a fixed time expressed in America/Sao_Paulo
  if (
    /^\d+$/.test(minutePart) &&
    /^\d+$/.test(hourPart) &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeek === "*"
  ) {
    // SP = UTC-3, so UTC hour = SP hour + 3
    const targetHourUTC = parseInt(hourPart, 10) + 3;
    const next = new Date(from);
    next.setUTCHours(targetHourUTC, parseInt(minutePart, 10), 0, 0);
    if (next.getTime() <= from.getTime()) next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }

  // Fallback: next full UTC hour
  const next = new Date(from);
  next.setUTCMinutes(60, 0, 0);
  return next;
}

export { SP_OFFSET_MS };
