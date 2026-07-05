import { sql } from "@vercel/postgres";
import type { Post, Vote, VoteKind } from "./types";
import { DEFAULT_USERS, type User, type UserId } from "./users";

type PostRow = Omit<Post, "votes">;

export async function ensureSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('snack','dinner')),
      photo_url TEXT NOT NULL,
      captured_at TIMESTAMPTZ NOT NULL,
      is_camera BOOLEAN NOT NULL DEFAULT FALSE,
      memo TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS posts_captured_at_idx ON posts (captured_at DESC)`;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  for (const u of DEFAULT_USERS) {
    await sql`
      INSERT INTO users (id, name, emoji)
      VALUES (${u.id}, ${u.name}, ${u.emoji})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  await sql`
    CREATE TABLE IF NOT EXISTS post_votes (
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      voter_id TEXT NOT NULL,
      vote TEXT NOT NULL CHECK (vote IN ('pass','reject')),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (post_id, voter_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS post_votes_post_id_idx ON post_votes (post_id)`;
}

export async function listUsers(): Promise<User[]> {
  const { rows } = await sql<User>`
    SELECT id, name, emoji FROM users ORDER BY id ASC
  `;
  return rows;
}

export async function updateUser(
  id: UserId,
  patch: { name?: string; emoji?: string },
): Promise<User | null> {
  const { rows } = await sql<User>`
    UPDATE users
    SET name  = COALESCE(${patch.name  ?? null}, name),
        emoji = COALESCE(${patch.emoji ?? null}, emoji),
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, name, emoji
  `;
  return rows[0] ?? null;
}

export async function listPostsBetween(startISO: string, endISO: string): Promise<Post[]> {
  const { rows } = await sql<PostRow>`
    SELECT id, user_id, category, photo_url,
           captured_at::text AS captured_at,
           is_camera, memo,
           created_at::text AS created_at
    FROM posts
    WHERE captured_at >= ${startISO} AND captured_at <= ${endISO}
    ORDER BY captured_at ASC
  `;
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const { rows: voteRows } = await sql<{
    post_id: string;
    voter_id: UserId;
    vote: VoteKind;
  }>`
    SELECT post_id, voter_id, vote
    FROM post_votes
    WHERE post_id = ANY(${ids as unknown as string}::uuid[])
  `;
  const byPost = new Map<string, Vote[]>();
  for (const v of voteRows) {
    const list = byPost.get(v.post_id) ?? [];
    list.push({ voter_id: v.voter_id, vote: v.vote });
    byPost.set(v.post_id, list);
  }
  return rows.map((r) => ({ ...r, votes: byPost.get(r.id) ?? [] }));
}

export async function insertPost(input: {
  user_id: UserId;
  category: "snack" | "dinner";
  photo_url: string;
  captured_at: Date;
  is_camera: boolean;
  memo: string | null;
}): Promise<Post> {
  const { rows } = await sql<PostRow>`
    INSERT INTO posts (user_id, category, photo_url, captured_at, is_camera, memo)
    VALUES (${input.user_id}, ${input.category}, ${input.photo_url},
            ${input.captured_at.toISOString()}, ${input.is_camera}, ${input.memo})
    RETURNING id, user_id, category, photo_url,
              captured_at::text AS captured_at,
              is_camera, memo,
              created_at::text AS created_at
  `;
  return { ...rows[0], votes: [] };
}

export async function upsertVote(
  postId: string,
  voterId: UserId,
  vote: VoteKind,
): Promise<Vote[] | null> {
  const { rows: owner } = await sql<{ user_id: UserId }>`
    SELECT user_id FROM posts WHERE id = ${postId}
  `;
  if (owner.length === 0) return null;
  if (owner[0].user_id === voterId) return null;
  await sql`
    INSERT INTO post_votes (post_id, voter_id, vote)
    VALUES (${postId}, ${voterId}, ${vote})
    ON CONFLICT (post_id, voter_id)
    DO UPDATE SET vote = EXCLUDED.vote, updated_at = NOW()
  `;
  return listVotesForPost(postId);
}

export async function deleteVote(
  postId: string,
  voterId: UserId,
): Promise<Vote[]> {
  await sql`
    DELETE FROM post_votes WHERE post_id = ${postId} AND voter_id = ${voterId}
  `;
  return listVotesForPost(postId);
}

async function listVotesForPost(postId: string): Promise<Vote[]> {
  const { rows } = await sql<Vote>`
    SELECT voter_id, vote FROM post_votes WHERE post_id = ${postId}
  `;
  return rows;
}

export async function deletePost(id: string, user_id: UserId): Promise<string | null> {
  const { rows } = await sql<{ photo_url: string }>`
    DELETE FROM posts WHERE id = ${id} AND user_id = ${user_id}
    RETURNING photo_url
  `;
  return rows[0]?.photo_url ?? null;
}

export async function listOldPhotoUrls(olderThanDays: number): Promise<string[]> {
  const { rows } = await sql<{ photo_url: string }>`
    SELECT photo_url FROM posts
    WHERE captured_at < NOW() - MAKE_INTERVAL(days => ${olderThanDays})
  `;
  return rows.map((r) => r.photo_url);
}

export async function deleteOldPosts(olderThanDays: number): Promise<number> {
  const { rowCount } = await sql`
    DELETE FROM posts
    WHERE captured_at < NOW() - MAKE_INTERVAL(days => ${olderThanDays})
  `;
  return rowCount ?? 0;
}
