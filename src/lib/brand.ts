/**
 * Branding configuration — single source of truth.
 *
 * Change these values when deploying for a new customer.
 * All UI text, titles, email signatures and login screens read from here.
 */
export const BRAND = {
  /** Full product name shown in headings and browser title */
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "77System",
  /** Short abbreviation used in small labels and favicon alt */
  short: process.env.NEXT_PUBLIC_BRAND_SHORT ?? "77",
  /** Tagline shown on login screen */
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE ?? "Plataforma de dados e indicadores",
  /** Support / noreply address for transactional emails */
  email: process.env.BRAND_EMAIL ?? "noreply@seudominio.com",
  /** Company or team name in email footers */
  company: process.env.NEXT_PUBLIC_BRAND_COMPANY ?? "Equipe 77",
} as const;
