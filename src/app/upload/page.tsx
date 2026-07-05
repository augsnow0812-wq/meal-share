"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CameraCapture } from "@/components/CameraCapture";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import { UserPicker } from "@/components/UserPicker";
import type { Category } from "@/lib/types";

export default function UploadPage() {
  const router = useRouter();
  const { userId, ready } = useCurrentUser();
  const [category, setCategory] = useState<Category>("snack");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedAt, setCapturedAt] = useState<Date | null>(null);
  const [isCamera, setIsCamera] = useState(false);
  const [memo, setMemo] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!ready) return null;
  if (!userId) return <UserPicker />;

  const openAlbum = () => fileInputRef.current?.click();

  const setBlobAsFile = (blob: Blob, when: Date, camera: boolean) => {
    const f = new File([blob], `meal-${Date.now()}.jpg`, {
      type: blob.type || "image/jpeg",
    });
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
    setCapturedAt(when);
    setIsCamera(camera);
  };

  const handleAlbum = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
    setCapturedAt(new Date());
    setIsCamera(false);
  };

  const handleSubmit = async () => {
    if (!file || !capturedAt) return;
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("user_id", userId);
      fd.set("category", category);
      fd.set("photo", file);
      fd.set("captured_at", capturedAt.toISOString());
      fd.set("is_camera", isCamera ? "true" : "false");
      if (memo.trim()) fd.set("memo", memo.trim());

      const res = await fetch("/api/posts", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `업로드 실패 (${res.status})`);
      }
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드 실패");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-5 pb-12 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-zinc-500 text-sm px-3 py-1 rounded-full hover:bg-zinc-100 transition"
        >
          ← 홈
        </Link>
        <h1 className="text-lg font-semibold">🍚 밥 기록하기</h1>
        <div className="w-14" />
      </div>

      <div className="card rounded-2xl p-4 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium mb-2">카테고리</label>
          <div className="flex gap-2">
            {(["snack", "dinner"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`flex-1 py-3 rounded-xl font-medium transition active:scale-95 ${
                  category === c
                    ? "bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/20"
                    : "bg-white/70 text-zinc-700 ring-1 ring-zinc-200 hover:bg-white"
                }`}
              >
                {c === "snack" ? "🍩 간식" : "🍚 저녁"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">사진</label>
          {previewUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="preview"
                className="w-full rounded-2xl object-cover max-h-96 ring-1 ring-black/5"
              />
              <button
                type="button"
                onClick={() => {
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                  setFile(null);
                  setCapturedAt(null);
                }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 backdrop-blur"
              >
                ✕
              </button>
              {isCamera && (
                <div className="text-xs text-zinc-500 mt-2">
                  📷 촬영 시각 워터마크 포함
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="flex-1 py-8 rounded-2xl bg-white/70 ring-1 ring-zinc-200 hover:bg-white flex flex-col items-center gap-1 transition active:scale-95"
              >
                <span className="text-3xl">📷</span>
                <span className="text-sm font-medium">촬영</span>
              </button>
              <button
                type="button"
                onClick={openAlbum}
                className="flex-1 py-8 rounded-2xl bg-white/70 ring-1 ring-zinc-200 hover:bg-white flex flex-col items-center gap-1 transition active:scale-95"
              >
                <span className="text-3xl">🖼️</span>
                <span className="text-sm font-medium">앨범</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAlbum}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            메모 <span className="text-zinc-400 text-xs">(선택)</span>
          </label>
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            maxLength={200}
            placeholder="예: 회사 근처 국밥"
            className="w-full bg-white/70 ring-1 ring-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>
      </div>

      {error && (
        <p className="text-rose-600 text-sm bg-rose-50 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!file || submitting}
        className="w-full py-4 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white font-semibold shadow-lg shadow-rose-500/25 disabled:opacity-40 disabled:shadow-none active:scale-[0.98] transition"
      >
        {submitting ? "업로드 중..." : "🍚 등록하기"}
      </button>

      {cameraOpen && (
        <CameraCapture
          onCapture={(blob, when) => {
            setBlobAsFile(blob, when, true);
            setCameraOpen(false);
          }}
          onCancel={() => setCameraOpen(false)}
        />
      )}
    </div>
  );
}
