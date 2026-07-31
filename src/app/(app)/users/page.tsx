import { auth } from "@/auth";
import { requirePermission } from "@/domains/rbac/guards";
import { listUsers } from "@/domains/users/service";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  await requirePermission("users.manage");
  const [users, session] = await Promise.all([listUsers(), auth()]);

  return (
    <UsersClient
      users={users}
      currentUserEmail={session?.user?.email ?? ""}
    />
  );
}
