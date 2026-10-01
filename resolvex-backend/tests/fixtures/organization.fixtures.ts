export const ACTIVE_ORG = {
  code: "AUTH_TEST_ORG",
  name: "Authentication Test Organization",
  timezone: "Asia/Kolkata",
  contactEmail: "auth-org@test.com",
  contactPhone: "9876543210",
  adminName: "Authentication Admin",
  adminEmail: "auth-admin@test.com",
  adminPassword: "Password@123",
} as const;

export const PENDING_ORG = {
  code: "AUTH_PENDING_ORG",
  name: "Pending Authentication Organization",
  timezone: "Asia/Kolkata",
  contactEmail:
    "auth-pending@test.com",
  contactPhone: "9876543211",
  adminName: "Pending Admin",
  adminEmail:
    "pending-admin@test.com",
  adminPassword: "Password@123",
} as const;