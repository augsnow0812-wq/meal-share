import type { NextRequest } from "next/server";
import { ensureSchema, updateUser } from "@/lib/db";
import { isUserId, normalizeEmoji, normalizeName } from "@/lib/users";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/users/[id]">,
) {
  await ensureSchema();
  const { id } = await ctx.params;
  if (!isUserId(id)) {
    return Response.json({ error: "invalid user id" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
    emoji?: unknown;
  } | null;
  if (!body) {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const patch: { name?: string; emoji?: string } = {};
  if (body.name !== undefined) {
    const name = normalizeName(body.name);
    if (!name) {
      return Response.json({ error: "invalid name" }, { status: 400 });
    }
    patch.name = name;
  }
  if (body.emoji !== undefined) {
    const emoji = normalizeEmoji(body.emoji);
    if (!emoji) {
      return Response.json({ error: "invalid emoji" }, { status: 400 });
    }
    patch.emoji = emoji;
  }
  if (!("name" in patch) && !("emoji" in patch)) {
    return Response.json({ error: "nothing to update" }, { status: 400 });
  }

  const user = await updateUser(id, patch);
  if (!user) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json({ user });
}
