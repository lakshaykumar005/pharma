import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma 7 uses a driver adapter. We connect to Supabase Postgres over the
 * pooled connection (DATABASE_URL — Supavisor / pgbouncer) at runtime.
 * Migrations + seeding use the direct connection (DIRECT_URL) instead.
 */
function createClient() {
  const connectionString = process.env.DATABASE_URL;
  // Clear, actionable error instead of Prisma's cryptic "Invalid URL".
  // Skipped during `next build` (no DB needed) so the build never fails on this.
  const unfilled = !connectionString || /\[[A-Za-z-]+\]/.test(connectionString);
  if (unfilled && process.env.NEXT_PHASE !== "phase-production-build") {
    throw new Error(
      "DATABASE_URL is missing or still contains [placeholders]. Paste your Supabase " +
        "Transaction pooler connection string into .env (Supabase → Connect → Transaction " +
        "pooler), replace [YOUR-PASSWORD] (URL-encode special characters), then restart. See .env.example.",
    );
  }
  // Cap the node-postgres pool size per instance. The `connection_limit` URL
  // param is ignored by the driver adapter, so we set pg's `max` here to keep
  // serverless instances from exhausting the Supabase transaction pooler.
  const max = Number(process.env.DATABASE_POOL_MAX ?? 1);
  const adapter = new PrismaPg({ connectionString: connectionString ?? "postgresql://unset", max });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
