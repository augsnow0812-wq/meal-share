"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addDays, format, isSameDay } from "date-fns";
import { CATEGORY_EMOJI, CATEGORY_LABEL, type Post } from "@/lib/types";
import { type UserId } from "@/lib/users";
import { getWeekRange, WEEKDAYS } from "@/lib/week";
import { useCurrentUser } from "./CurrentUserProvider";
import { UserPicker } from "./UserPicker";
import { useUsers } from "./UsersProvider";
import { PostDetailModal } from "./PostDetailModal";
import { NicknameEditor } from "./NicknameEditor";

export function WeeklyGrid() {
  const { userId, ready, setUserId } = useCurrentUser();
  const { users, getUser } = useUsers();
  const [weekOffset, setWeekOffset] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Post | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [editing, setEditing] = useState(false);

  const week = useMemo(() => getWeekRange(weekOffset), [weekOffset]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const params = new URLSearchParams({
      start: week.start.toISOString(),
      end: week.end.toISOString(),
    });
    fetch(`/api/posts?${params}`)
      .then((r) => r.json())
      .then((j) => setPosts(j.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [week.key, userId, refreshTick]);

  if (!ready) return null;
  if (!userId) return <UserPicker />;

  const me = getUser(userId);

  const cellPosts = (uid: UserId, dayIndex: number) => {
    const day = addDays(week.start, dayIndex);
    return posts.filter(
      (p) => p.user_id === uid && isSameDay(new Date(p.captured_at), day),
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24">
      <header className="flex items-center justify-between mb-4">
        <button
          onClick={() => setEditing(true)}
          className="text-sm text-zinc-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-zinc-100"
          title="닉네임 수정"
        >
          <span>{me?.emoji}</span>
          <span>{me?.name}</span>
          <span className="text-zinc-400 text-xs">✎</span>
        </button>
        <h1 className="text-lg font-semibold">밥친구</h1>
        <button
          onClick={() => setUserId(null)}
          className="text-xs text-zinc-400 w-16 text-right"
        >
          내가 아냐?
        </button>
      </header>

      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setWeekOffset((n) => n - 1)}
          className="px-3 py-1 rounded-lg border border-zinc-200"
        >
          ◀
        </button>
        <div className="text-center">
          <div className="font-medium">{week.label}</div>
          {weekOffset === 0 && (
            <div className="text-xs text-zinc-500">이번 주</div>
          )}
        </div>
        <button
          onClick={() => setWeekOffset((n) => n + 1)}
          disabled={weekOffset >= 0}
          className="px-3 py-1 rounded-lg border border-zinc-200 disabled:opacity-30"
        >
          ▶
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-[80px_repeat(7,minmax(80px,1fr))] gap-1 min-w-full">
          <div className="p-2 text-xs text-zinc-500" />
          {WEEKDAYS.map((wd, i) => {
            const day = addDays(week.start, i);
            return (
              <div key={wd} className="p-2 text-center">
                <div className="text-xs font-medium">{wd}</div>
                <div className="text-xs text-zinc-400">
                  {format(day, "MM/dd")}
                </div>
              </div>
            );
          })}

          {users.map((u) => (
            <div key={u.id} className="contents">
              <div className="p-2 flex items-center gap-1 text-sm">
                <span>{u.emoji}</span>
                <span className="truncate">{u.name}</span>
              </div>
              {Array.from({ length: 7 }).map((_, di) => {
                const items = cellPosts(u.id, di);
                return (
                  <div
                    key={di}
                    className="min-h-20 p-1 rounded-lg bg-zinc-50 flex flex-wrap gap-1 content-start"
                  >
                    {items.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelected(p)}
                        className="relative w-full aspect-square overflow-hidden rounded-md"
                        title={CATEGORY_LABEL[p.category]}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.photo_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0.5 right-0.5 text-xs bg-black/60 text-white rounded px-1">
                          {CATEGORY_EMOJI[p.category]}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center text-sm text-zinc-400 mt-4">불러오는 중...</div>
      )}

      <Link
        href="/upload"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-black text-white text-2xl flex items-center justify-center shadow-lg"
      >
        +
      </Link>

      {selected && (
        <PostDetailModal
          post={selected}
          currentUserId={userId}
          onClose={() => setSelected(null)}
          onDeleted={() => {
            setSelected(null);
            setRefreshTick((n) => n + 1);
          }}
        />
      )}

      {editing && me && (
        <NicknameEditor user={me} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}
