"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  CATEGORY_LABEL,
  computeVerdict,
  type Post,
  type Vote,
  type VoteKind,
} from "@/lib/types";
import { USER_THEME, type UserId } from "@/lib/users";
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
  const [votes, setVotes] = useState<Vote[]>(post.votes);
  const [voting, setVoting] = useState(false);
  const owner = getUser(post.user_id);
  const isMine = post.user_id === currentUserId;
  const myVote = votes.find((v) => v.voter_id === currentUserId)?.vote ?? null;
  const verdict = computeVerdict(votes, post.user_id);

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

  const handleVote = async (next: VoteKind) => {
    if (isMine || voting) return;
    setVoting(true);
    try {
      if (myVote === next) {
        const res = await fetch(
          `/api/posts/${post.id}/vote?voter_id=${currentUserId}`,
          { method: "DELETE" },
        );
        if (res.ok) {
          const j = (await res.json()) as { votes: Vote[] };
          setVotes(j.votes);
        }
      } else {
        const res = await fetch(`/api/posts/${post.id}/vote`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voter_id: currentUserId, vote: next }),
        });
        if (res.ok) {
          const j = (await res.json()) as { votes: Vote[] };
          setVotes(j.votes);
        }
      }
    } finally {
      setVoting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl overflow-hidden max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.photo_url}
            alt=""
            className="w-full object-contain max-h-[55vh] bg-black"
          />
          {verdict === "pass" && (
            <span className="absolute top-3 left-3 text-xs bg-emerald-500 text-white rounded-full px-3 py-1 font-semibold shadow-lg">
              ✅ 통과
            </span>
          )}
          {verdict === "reject" && (
            <span className="absolute top-3 left-3 text-xs bg-rose-500 text-white rounded-full px-3 py-1 font-semibold shadow-lg">
              ⛔ 거부
            </span>
          )}
          {verdict === "tie" && (
            <span className="absolute top-3 left-3 text-xs bg-zinc-600 text-white rounded-full px-3 py-1 font-semibold shadow-lg">
              🤝 무승부
            </span>
          )}
        </div>

        <div className="p-4 flex flex-col gap-3 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {owner && (
                <span
                  className={`chip ${USER_THEME[owner.id as UserId].soft} ${USER_THEME[owner.id as UserId].text}`}
                >
                  <span>{owner.emoji}</span>
                  <span className="font-medium">{owner.name}</span>
                </span>
              )}
              <span className="text-zinc-400 text-sm">
                {CATEGORY_LABEL[post.category]}
              </span>
            </div>
            <div className="text-xs text-zinc-500">
              {format(new Date(post.captured_at), "MM/dd HH:mm")}
              {post.is_camera && <span className="ml-1">📷</span>}
            </div>
          </div>

          {post.memo && (
            <p className="text-sm text-zinc-700 whitespace-pre-wrap bg-zinc-50 rounded-xl p-3">
              {post.memo}
            </p>
          )}

          <VoteSection
            votes={votes}
            ownerId={post.user_id}
            currentUserId={currentUserId}
            isMine={isMine}
            myVote={myVote}
            voting={voting}
            onVote={handleVote}
          />

          <div className="flex justify-end gap-2 mt-1">
            {isMine && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40 transition"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 transition"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VoteSection({
  votes,
  ownerId,
  currentUserId,
  isMine,
  myVote,
  voting,
  onVote,
}: {
  votes: Vote[];
  ownerId: UserId;
  currentUserId: UserId;
  isMine: boolean;
  myVote: VoteKind | null;
  voting: boolean;
  onVote: (v: VoteKind) => void;
}) {
  const { users, getUser } = useUsers();
  const otherJudges = users.filter((u) => u.id !== ownerId);

  return (
    <div className="rounded-2xl border border-zinc-100 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          친구들의 심사
        </span>
        <span className="text-[11px] text-zinc-400">
          {votes.filter((v) => v.voter_id !== ownerId).length}/
          {otherJudges.length}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {otherJudges.map((u) => {
          const v = votes.find((x) => x.voter_id === u.id);
          return (
            <div
              key={u.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2">
                <span>{u.emoji}</span>
                <span className="text-zinc-700">{u.name}</span>
              </span>
              {v ? (
                <span
                  className={
                    v.vote === "pass"
                      ? "chip bg-emerald-50 text-emerald-700"
                      : "chip bg-rose-50 text-rose-700"
                  }
                >
                  {v.vote === "pass" ? "👍 통과" : "👎 거부"}
                </span>
              ) : (
                <span className="text-[11px] text-zinc-400">미평가</span>
              )}
            </div>
          );
        })}
      </div>

      {!isMine && getUser(currentUserId) && (
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => onVote("pass")}
            disabled={voting}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95 ${
              myVote === "pass"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            } disabled:opacity-50`}
          >
            👍 통과
          </button>
          <button
            onClick={() => onVote("reject")}
            disabled={voting}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95 ${
              myVote === "reject"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/30"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            } disabled:opacity-50`}
          >
            👎 거부
          </button>
        </div>
      )}

      {isMine && (
        <p className="text-[11px] text-zinc-400 mt-1">
          내 식단은 스스로 평가할 수 없어요.
        </p>
      )}
    </div>
  );
}
