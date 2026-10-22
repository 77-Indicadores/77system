import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordAccessChange } from "@/domains/auth/access-activity";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {}
      },
      async authorize(rawCredentials) {
        const credentials = credentialsSchema.safeParse(rawCredentials);
        if (!credentials.success) return null;

        const user = await prisma.user.findUnique({ where: { email: credentials.data.email } });
        if (!user || user.status !== "ACTIVE") return null;

        const valid = await bcrypt.compare(credentials.data.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  events: {
    async signIn({ user }) {
      if (user.email) await recordAccessChange(user.email, "LOGIN");
    },
    async signOut(message) {
      if ("token" in message && typeof message.token?.email === "string") {
        await recordAccessChange(message.token.email, "LOGOUT");
      }
    }
  }
});
