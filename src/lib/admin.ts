import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { can, type Permission } from "@/lib/rbac";

/** يتحقق أن المستخدم يملك الصلاحية أو يوجّهه بعيدًا. يعيد المستخدم عند النجاح. */
export async function requirePermission(perm: Permission) {
  const user = await currentUser();
  if (!user) redirect("/auth");
  if (!can(user.role, perm)) redirect("/parent-dashboard");
  return user;
}
