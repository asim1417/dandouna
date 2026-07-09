// ============================================================
//  التحكم بالوصول القائم على الأدوار (RBAC)
//  يُمنع الوصول ما لم يُثبت الإذن صراحةً
// ============================================================

export type Role =
  | "USER"
  | "GUARDIAN"
  | "SPECIALIST"
  | "INSTITUTION"
  | "COMPANY"
  | "CONTENT_EDITOR"
  | "ADMIN";

export type Permission =
  | "assessment:take"
  | "assessment:read:self"
  | "assessment:read:ward"
  | "child:manage"
  | "ward:link"
  | "consent:grant"
  | "mood:write"
  | "scale:manage"
  | "question:manage"
  | "recommendation:manage"
  | "reference:manage"
  | "org:manage"
  | "user:manage"
  | "audit:view"
  | "security:manage";

// صلاحيات إدارة المحتوى (لمشرف المحتوى والمدير)
const CONTENT: Permission[] = [
  "scale:manage",
  "question:manage",
  "recommendation:manage",
  "reference:manage",
];

// مصفوفة الأدوار ← الصلاحيات
const MATRIX: Record<Role, Permission[]> = {
  USER: ["assessment:take", "assessment:read:self", "mood:write", "consent:grant"],
  GUARDIAN: [
    "assessment:take",
    "assessment:read:ward",
    "assessment:read:self",
    "child:manage",
    "ward:link",
    "consent:grant",
    "mood:write",
  ],
  SPECIALIST: ["assessment:read:ward", "assessment:read:self"],
  INSTITUTION: ["org:manage", "assessment:read:ward"],
  COMPANY: ["org:manage"],
  CONTENT_EDITOR: [...CONTENT],
  ADMIN: [
    ...CONTENT,
    "org:manage",
    "user:manage",
    "audit:view",
    "security:manage",
    "assessment:read:self",
    "assessment:read:ward",
  ],
};

export function can(role: Role, perm: Permission): boolean {
  return MATRIX[role]?.includes(perm) ?? false;
}

/** يرمي استثناءً إذا لم يملك الدور الصلاحية المطلوبة. */
export class ForbiddenError extends Error {
  constructor(perm: Permission) {
    super(`لا تملك الصلاحية المطلوبة: ${perm}`);
    this.name = "ForbiddenError";
  }
}

export function assertPermission(role: Role, perm: Permission): void {
  if (!can(role, perm)) throw new ForbiddenError(perm);
}
