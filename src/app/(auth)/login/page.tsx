import Link from "next/link";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BRAND } from "@/lib/brand";

export default function LoginPage() {
  async function login(formData: FormData) {
    "use server";
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <form action={login} className="w-full max-w-sm rounded-xl border bg-card p-8">
        {/* Logo */}
        <div className="mb-8">
          <div
            className="text-[2.5rem] font-black leading-none tracking-[-0.06em]"
            style={{ color: "var(--sidebar-bg)" }}
          >
            {BRAND.short.slice(0, -1)}<span style={{ color: "hsl(var(--primary))" }}>{BRAND.short.slice(-1)}</span>
          </div>
          <p className="mt-0.5 text-[13px] font-semibold text-card-foreground">{BRAND.name}</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">{BRAND.tagline}</p>
        </div>

        <label className="mb-4 block text-sm font-semibold">
          Email
          <Input className="mt-1.5" name="email" type="email" autoComplete="email" required />
        </label>
        <label className="mb-6 block text-sm font-semibold">
          Senha
          <Input className="mt-1.5" name="password" type="password" autoComplete="current-password" required />
        </label>
        <Button className="w-full" type="submit">
          Entrar
        </Button>
        <p className="mt-5 text-center text-[12px] text-muted-foreground">
          <Link href="/forgot-password" className="font-semibold hover:underline">
            Esqueci minha senha
          </Link>
        </p>
      </form>
    </main>
  );
}
