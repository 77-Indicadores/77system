import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BRAND } from "@/lib/brand";
import { createPasswordResetToken } from "@/domains/auth/reset";
import { sendPasswordResetEmail } from "@/domains/auth/mailer";

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  async function requestReset(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    if (!email) return;

    const token = await createPasswordResetToken(email);
    if (token) {
      const base = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
      const url = `${base}/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, url);
    }
    // Resposta sempre igual para não revelar se o e-mail existe
    redirect("/forgot-password?sent=1");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <form action={requestReset} className="w-full max-w-sm rounded-xl border bg-card p-8">
        <div className="mb-8">
          <div
            className="text-[2.5rem] font-black leading-none tracking-[-0.06em]"
            style={{ color: "var(--sidebar-bg)" }}
          >
            {BRAND.short.slice(0, -1)}<span style={{ color: "hsl(var(--primary))" }}>{BRAND.short.slice(-1)}</span>
          </div>
          <p className="mt-0.5 text-[13px] font-semibold text-card-foreground">{BRAND.name}</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">Recuperação de senha</p>
        </div>

        <ForgotPasswordContent searchParams={searchParams} />

        <p className="mt-6 text-center text-[12px] text-muted-foreground">
          <Link href="/login" className="font-semibold hover:underline">
            Voltar ao login
          </Link>
        </p>
      </form>
    </main>
  );
}

async function ForgotPasswordContent({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  if (sent) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-[13px] text-green-800">
        Se esse e-mail estiver cadastrado, você receberá as instruções em breve. Verifique sua caixa de entrada.
      </div>
    );
  }

  return (
    <>
      <p className="mb-5 text-[13px] text-muted-foreground">
        Informe seu e-mail e enviaremos um link para redefinir sua senha.
      </p>
      <label className="mb-5 block text-sm font-semibold">
        E-mail
        <Input className="mt-1.5" name="email" type="email" autoComplete="email" required />
      </label>
      <Button className="w-full" type="submit">
        Enviar link de recuperação
      </Button>
    </>
  );
}
