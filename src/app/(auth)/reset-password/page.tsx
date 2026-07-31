import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BRAND } from "@/lib/brand";
import { consumePasswordResetToken, validatePasswordResetToken } from "@/domains/auth/reset";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string; done?: string }>;
}) {
  const { token, error, done } = await searchParams;

  async function resetPassword(formData: FormData) {
    "use server";
    const raw = String(formData.get("token") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");

    if (!raw || !password || password !== confirm || password.length < 8) {
      redirect(`/reset-password?token=${raw}&error=invalid`);
    }

    const ok = await consumePasswordResetToken(raw, password);
    if (!ok) {
      redirect(`/reset-password?token=${raw}&error=expired`);
    }
    redirect("/reset-password?done=1");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8">
        <div className="mb-8">
          <div
            className="text-[2.5rem] font-black leading-none tracking-[-0.06em]"
            style={{ color: "var(--sidebar-bg)" }}
          >
            {BRAND.short.slice(0, -1)}<span style={{ color: "hsl(var(--primary))" }}>{BRAND.short.slice(-1)}</span>
          </div>
          <p className="mt-0.5 text-[13px] font-semibold text-card-foreground">{BRAND.name}</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">Nova senha</p>
        </div>

        {done ? (
          <>
            <div className="rounded-lg border bg-muted p-4 text-[13px] text-card-foreground">
              Senha redefinida com sucesso! Faça login com sua nova senha.
            </div>
            <Link
              href="/login"
              className="mt-5 block text-center text-[13px] font-semibold hover:underline"
            >
              Ir para o login
            </Link>
          </>
        ) : !token ? (
          <InvalidToken />
        ) : (
          <ResetForm token={token} error={error} resetPassword={resetPassword} />
        )}
      </div>
    </main>
  );
}

async function ResetForm({
  token,
  error,
  resetPassword,
}: {
  token: string;
  error?: string;
  resetPassword: (fd: FormData) => Promise<void>;
}) {
  const email = await validatePasswordResetToken(token);
  if (!email) return <InvalidToken />;

  return (
    <form action={resetPassword}>
      <input type="hidden" name="token" value={token} />

      {error === "invalid" && (
        <p className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-[12px] text-destructive">
          As senhas não coincidem ou são muito curtas (mínimo 8 caracteres).
        </p>
      )}
      {error === "expired" && (
        <p className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-[12px] text-destructive">
          Link expirado ou já utilizado.{" "}
          <Link href="/forgot-password" className="font-semibold underline">
            Solicite um novo.
          </Link>
        </p>
      )}

      <p className="mb-5 text-[13px] text-muted-foreground">
        Redefinindo senha para <strong>{email}</strong>
      </p>

      <label className="mb-4 block text-sm font-semibold">
        Nova senha
        <Input
          className="mt-1.5"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <label className="mb-6 block text-sm font-semibold">
        Confirmar senha
        <Input
          className="mt-1.5"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <Button className="w-full" type="submit">
        Salvar nova senha
      </Button>
    </form>
  );
}

function InvalidToken() {
  return (
    <>
      <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
        Link inválido, expirado ou já utilizado.
      </p>
      <Link
        href="/forgot-password"
        className="block text-center text-[13px] font-semibold hover:underline"
      >
        Solicitar novo link
      </Link>
    </>
  );
}
