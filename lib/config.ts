function requireEnv(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export const config = {
  sessionSecret: () => requireEnv("SESSION_SECRET", "dev-only-session-secret-change-me-32"),
  dataEncryptionKey: () =>
    requireEnv("DATA_ENCRYPTION_KEY", "dev-only-encryption-key-change-me!!"),
  adminUsername: () => requireEnv("ADMIN_USERNAME", "admin"),
  adminPassword: () => requireEnv("ADMIN_PASSWORD", "changeme"),
  databaseUrl: () => requireEnv("DATABASE_URL"),
  sshDemoMode: () => process.env.SSH_DEMO_MODE !== "false",
  host: () => requireEnv("HOST", "0.0.0.0"),
  port: () => parseInt(requireEnv("PORT", "3000"), 10),
  baseUrl: () => requireEnv("BASE_URL", "http://localhost:3000"),
  totpUnlockMinutes: 30,
  appName: "OpsNav",
};
