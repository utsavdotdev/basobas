export const USER_ROLES = ["tenant", "landlord"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: string | null | undefined): value is UserRole {
  return value === "tenant" || value === "landlord";
}
