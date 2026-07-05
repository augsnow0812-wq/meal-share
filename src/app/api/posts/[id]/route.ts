import { del } from "@vercel/blob";
import type { NextRequest } from "next/server";
import { deletePost } from "@/lib/db";
import { isUserId } from "@/lib/users";

export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/posts/[id]">) {
  const { id } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!isUserId(userId)) {
    return Response.json({ error: "invalid user_id" }, { status: 400 });
  }

  const photoUrl = await deletePost(id, userId);
  if (!photoUrl) {
    return Response.json({ error: "not found or not owner" }, { status: 404 });
  }

  try {
    await del(photoUrl);
  } catch {}

  return Response.json({ ok: true });
}
