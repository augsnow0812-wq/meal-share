export async function GET() {
  const keys = Object.keys(process.env)
    .filter((k) =>
      /^(POSTGRES|DATABASE|BLOB|VERCEL|NEON)/i.test(k),
    )
    .sort();

  const results: Record<string, string> = {};
  try {
    const { sql } = await import("@vercel/postgres");
    const r = await sql`SELECT 1 as ok`;
    results.select1 = `ok rows=${r.rows.length}`;
  } catch (e) {
    results.select1 = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }

  try {
    const { ensureSchema } = await import("@/lib/db");
    await ensureSchema();
    results.ensureSchema = "ok";
  } catch (e) {
    results.ensureSchema = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }

  try {
    const { listUsers } = await import("@/lib/db");
    const users = await listUsers();
    results.listUsers = `ok count=${users.length} sample=${JSON.stringify(users[0] ?? null)}`;
  } catch (e) {
    results.listUsers = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }

  return Response.json({ envKeys: keys, ...results });
}
