import { del } from "@vercel/blob";
import { deleteOldPosts, ensureSchema, listOldPhotoUrls } from "@/lib/db";

const RETENTION_DAYS = 30;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  await ensureSchema();
  const urls = await listOldPhotoUrls(RETENTION_DAYS);

  if (urls.length > 0) {
    try {
      await del(urls);
    } catch (e) {
      console.error("blob delete failed", e);
    }
  }

  const deleted = await deleteOldPosts(RETENTION_DAYS);
  return Response.json({ deleted, blobsRemoved: urls.length });
}
