import { auth } from "@/lib/auth";
import type { Role } from "@/lib/rbac";

export interface SessionUser {
  id: string;
  role: Role;
  isMinor: boolean;
}

/** يعيد المستخدم الحالي من الجلسة، أو null. لا يُقرأ المعرّف من جسم الطلب أبدًا. */
export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  const u = session?.user as
    | { id?: string; role?: Role; isMinor?: boolean }
    | undefined;
  if (!u?.id || !u.role) return null;
  return { id: u.id, role: u.role, isMinor: !!u.isMinor };
}
