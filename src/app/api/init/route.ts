import { ensureSchema } from "@/lib/db";

export async function POST() {
  await ensureSchema();
  return Response.json({ ok: true });
}
