import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma 7 uses a driver adapter. We connect to Supabase Postgres over the
 * pooled connection (DATABASE_URL — Supavisor / pgbouncer) at runtime.
 * Migrations + seeding use the direct connection (DIRECT_URL) instead.
 */
function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — add your Supabase transaction-pooler URL to .env");
  }
  // Cap the node-postgres pool size per instance. The `connection_limit` URL
  // param is ignored by the driver adapter, so we set pg's `max` here to keep
  // serverless instances from exhausting the Supabase transaction pooler.
  const max = Number(process.env.DATABASE_POOL_MAX ?? 1);
  const adapter = new PrismaPg({ connectionString, max });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
