import { ensureSchema, listUsers } from "@/lib/db";

export async function GET() {
  await ensureSchema();
  const users = await listUsers();
  return Response.json({ users });
}
