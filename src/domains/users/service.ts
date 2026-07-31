import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type UserRow = {
  id: string;
  name: string | null;
  email: string;
  status: "ACTIVE" | "DISABLED";
  createdAt: Date;
  roles: Array<{ role: { key: string; name: string } }>;
  scopes: Array<{ id: string; dimension: string; value: string }>;
};

export async function listUsers(): Promise<UserRow[]> {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
      roles: { select: { role: { select: { key: true, name: true } } } },
      scopes: {
        select: { id: true, dimension: true, value: true },
        orderBy: [{ dimension: "asc" }, { value: "asc" }],
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  roleKey: string;
}) {
  const passwordHash = await bcrypt.hash(data.password, 12);
  const role = await prisma.role.findUniqueOrThrow({ where: { key: data.roleKey } });
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase().trim(),
      passwordHash,
      status: "ACTIVE",
      roles: { create: { roleId: role.id } },
    },
  });
}

export async function updateUser(
  id: string,
  data: { name?: string; email?: string; status?: "ACTIVE" | "DISABLED" }
) {
  return prisma.user.update({ where: { id }, data });
}

export async function setUserRole(userId: string, roleKey: string) {
  const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } });
  await prisma.userRole.deleteMany({ where: { userId } });
  await prisma.userRole.create({ data: { userId, roleId: role.id } });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}
