import os from "node:os";
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { seedDefaultAvailability } from "./seed-data";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const globalForDb = globalThis as unknown as { __db?: Promise<Db> };

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;

  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    return drizzle(neon(url), { schema }) as unknown as Db;
  }

  // No DATABASE_URL: run an in-process Postgres (PGlite) stored in the temp folder,
  // migrate it on first use and give it default opening hours.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");

  // Kept outside the project folder so the dev server's file watcher ignores it.
  const dataDir =
    process.env.PGLITE_DIR || path.join(os.tmpdir(), "doctor-booking-pglite");
  const client = new PGlite(dataDir);
  const db = drizzle(client, { schema });
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  });
  await seedDefaultAvailability(db as unknown as Db);
  return db as unknown as Db;
}

export function getDb(): Promise<Db> {
  return (globalForDb.__db ??= createDb());
}

/** True when a query failed because it broke a unique constraint. */
export function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth++) {
    if ((current as { code?: string }).code === "23505") return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}
