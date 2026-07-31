import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "77System",
  description: "Boilerplate 77 para indicadores, cadastros e integracoes."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
