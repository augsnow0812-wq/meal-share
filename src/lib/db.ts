import { sql } from "@vercel/postgres";
import type { Post } from "./types";
import { DEFAULT_USERS, type User, type UserId } from "./users";

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
  const { rows } = await sql<Post>`
    SELECT id, user_id, category, photo_url,
           captured_at::text AS captured_at,
           is_camera, memo,
           created_at::text AS created_at
    FROM posts
    WHERE captured_at >= ${startISO} AND captured_at <= ${endISO}
    ORDER BY captured_at ASC
  `;
  return rows;
}

export async function insertPost(input: {
  user_id: UserId;
  category: "snack" | "dinner";
  photo_url: string;
  captured_at: Date;
  is_camera: boolean;
  memo: string | null;
}): Promise<Post> {
  const { rows } = await sql<Post>`
    INSERT INTO posts (user_id, category, photo_url, captured_at, is_camera, memo)
    VALUES (${input.user_id}, ${input.category}, ${input.photo_url},
            ${input.captured_at.toISOString()}, ${input.is_camera}, ${input.memo})
    RETURNING id, user_id, category, photo_url,
              captured_at::text AS captured_at,
              is_camera, memo,
              created_at::text AS created_at
  `;
  return rows[0];
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
