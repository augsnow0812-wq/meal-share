import { put } from "@vercel/blob";
import { ensureSchema, insertPost, listPostsBetween } from "@/lib/db";
import { isUserId } from "@/lib/users";

export async function GET(request: Request) {
  await ensureSchema();
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) {
    return Response.json({ error: "start & end required" }, { status: 400 });
  }
  const posts = await listPostsBetween(start, end);
  return Response.json({ posts });
}

export async function POST(request: Request) {
  await ensureSchema();
  const form = await request.formData();

  const userId = form.get("user_id");
  const category = form.get("category");
  const memo = form.get("memo");
  const isCameraRaw = form.get("is_camera");
  const capturedAtRaw = form.get("captured_at");
  const file = form.get("photo");

  if (!isUserId(userId)) {
    return Response.json({ error: "invalid user_id" }, { status: 400 });
  }
  if (category !== "snack" && category !== "dinner") {
    return Response.json({ error: "invalid category" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "photo required" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "photo too large (max 10MB)" }, { status: 400 });
  }

  const isCamera = isCameraRaw === "true" || isCameraRaw === "1";
  const capturedAt = typeof capturedAtRaw === "string" && capturedAtRaw
    ? new Date(capturedAtRaw)
    : new Date();

  const ext = file.type === "image/png" ? "png" : "jpg";
  const key = `posts/${userId}/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;
  const blob = await put(key, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type || "image/jpeg",
  });

  const post = await insertPost({
    user_id: userId,
    category,
    photo_url: blob.url,
    captured_at: capturedAt,
    is_camera: isCamera,
    memo: typeof memo === "string" && memo.trim() ? memo.trim().slice(0, 200) : null,
  });

  return Response.json({ post });
}
