import type { NextRequest } from "next/server";
import { deleteVote, ensureSchema, upsertVote } from "@/lib/db";
import { isUserId } from "@/lib/users";

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/posts/[id]/vote">,
) {
  await ensureSchema();
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as {
    voter_id?: unknown;
    vote?: unknown;
  } | null;
  if (!body) {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }
  if (!isUserId(body.voter_id)) {
    return Response.json({ error: "invalid voter_id" }, { status: 400 });
  }
  if (body.vote !== "pass" && body.vote !== "reject") {
    return Response.json({ error: "invalid vote" }, { status: 400 });
  }
  const votes = await upsertVote(id, body.voter_id, body.vote);
  if (votes === null) {
    return Response.json(
      { error: "post not found or self-vote not allowed" },
      { status: 400 },
    );
  }
  return Response.json({ votes });
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/posts/[id]/vote">,
) {
  await ensureSchema();
  const { id } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const voterId = searchParams.get("voter_id");
  if (!isUserId(voterId)) {
    return Response.json({ error: "invalid voter_id" }, { status: 400 });
  }
  const votes = await deleteVote(id, voterId);
  return Response.json({ votes });
}
