export async function GET() {
  const keys = Object.keys(process.env)
    .filter((k) =>
      /^(POSTGRES|DATABASE|BLOB|VERCEL|NEON)/i.test(k),
    )
    .sort();

  let dbError: string | null = null;
  try {
    const { sql } = await import("@vercel/postgres");
    const r = await sql`SELECT 1 as ok`;
    dbError = `ok rows=${r.rows.length}`;
  } catch (e) {
    dbError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }

  return Response.json({ envKeys: keys, dbError });
}
