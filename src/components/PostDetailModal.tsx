"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CATEGORY_LABEL, type Post } from "@/lib/types";
import { type UserId } from "@/lib/users";
import { useUsers } from "./UsersProvider";

type Props = {
  post: Post;
  currentUserId: UserId;
  onClose: () => void;
  onDeleted: () => void;
};

export function PostDetailModal({ post, currentUserId, onClose, onDeleted }: Props) {
  const { getUser } = useUsers();
  const [deleting, setDeleting] = useState(false);
  const owner = getUser(post.user_id);
  const isMine = post.user_id === currentUserId;

  const handleDelete = async () => {
    if (!confirm("삭제할까요?")) return;
    setDeleting(true);
    const res = await fetch(
      `/api/posts/${post.id}?user_id=${currentUserId}`,
      { method: "DELETE" },
    );
    if (res.ok) onDeleted();
    else setDeleting(false);
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.photo_url}
          alt=""
          className="w-full object-contain max-h-[60vh] bg-black"
        />
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{owner?.emoji}</span>
              <span className="font-medium">{owner?.name}</span>
              <span className="text-zinc-400 text-sm">
                · {CATEGORY_LABEL[post.category]}
              </span>
            </div>
            <div className="text-xs text-zinc-500">
              {format(new Date(post.captured_at), "MM/dd HH:mm")}
              {post.is_camera && <span className="ml-1">📷</span>}
            </div>
          </div>
          {post.memo && (
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">
              {post.memo}
            </p>
          )}
          <div className="flex justify-end gap-2 mt-2">
            {isMine && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg border border-red-200 text-red-600 disabled:opacity-40"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-black text-white"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
