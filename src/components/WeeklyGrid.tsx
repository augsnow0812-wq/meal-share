"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addDays, format, isSameDay, isToday } from "date-fns";
import {
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  computeVerdict,
  type Post,
} from "@/lib/types";
import { USER_THEME, type UserId } from "@/lib/users";
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

  const passedByUser = (uid: UserId) =>
    posts.filter(
      (p) => p.user_id === uid && computeVerdict(p.votes, p.user_id) === "pass",
    ).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-32">
      {/* Header */}
      <header className="flex items-center justify-between mb-5">
        <button
          onClick={() => setEditing(true)}
          className={`group flex items-center gap-2 px-3 py-2 rounded-full card ring-2 ${me ? USER_THEME[me.id as UserId].ring : "ring-zinc-200"} transition active:scale-95`}
          title="닉네임 수정"
        >
          <span className="text-xl leading-none">{me?.emoji}</span>
          <span className="font-medium text-sm">{me?.name}</span>
          <span className="text-zinc-300 text-xs group-hover:text-zinc-500 transition">
            ✎
          </span>
        </button>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight">
          🍚 밥친구
        </h1>
        <button
          onClick={() => setUserId(null)}
          className="text-[11px] text-zinc-400 hover:text-zinc-600 px-2 py-1"
        >
          내가 아냐?
        </button>
      </header>

      {/* Week navigator */}
      <div className="card rounded-2xl px-4 py-3 flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset((n) => n - 1)}
          className="w-9 h-9 rounded-full hover:bg-zinc-100 active:scale-90 transition flex items-center justify-center text-zinc-500"
          aria-label="이전 주"
        >
          ◀
        </button>
        <div className="text-center">
          <div className="font-semibold">{week.label}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {weekOffset === 0 ? "이번 주" : `${-weekOffset}주 전`}
          </div>
        </div>
        <button
          onClick={() => setWeekOffset((n) => n + 1)}
          disabled={weekOffset >= 0}
          className="w-9 h-9 rounded-full hover:bg-zinc-100 active:scale-90 transition disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center text-zinc-500"
          aria-label="다음 주"
        >
          ▶
        </button>
      </div>

      {/* Desktop: user × day grid */}
      <div className="hidden md:block card rounded-2xl p-3 mb-4">
        <div className="grid grid-cols-[100px_repeat(7,minmax(0,1fr))] gap-1.5">
          <div />
          {WEEKDAYS.map((wd, i) => {
            const day = addDays(week.start, i);
            const today = isToday(day);
            return (
              <div key={wd} className="p-2 text-center">
                <div
                  className={`text-xs font-semibold ${today ? "text-rose-600" : ""}`}
                >
                  {wd}
                </div>
                <div className={`text-[11px] mt-0.5 ${today ? "text-rose-500" : "text-zinc-400"}`}>
                  {format(day, "MM/dd")}
                </div>
              </div>
            );
          })}

          {users.map((u) => {
            const theme = USER_THEME[u.id];
            return (
              <div key={u.id} className="contents">
                <div className={`p-2 flex items-center gap-2 rounded-xl ${theme.soft}`}>
                  <span className="text-lg">{u.emoji}</span>
                  <span className="text-sm font-medium truncate">{u.name}</span>
                </div>
                {Array.from({ length: 7 }).map((_, di) => {
                  const items = cellPosts(u.id, di);
                  const day = addDays(week.start, di);
                  const today = isToday(day);
                  return (
                    <div
                      key={di}
                      className={`min-h-24 p-1.5 rounded-xl bg-white/60 flex flex-wrap gap-1 content-start ${
                        today ? "ring-1 ring-rose-200" : ""
                      }`}
                    >
                      {items.length === 0 && (
                        <span className="w-full text-center self-center text-[10px] text-zinc-300">
                          ·
                        </span>
                      )}
                      {items.map((p) => (
                        <PostThumb
                          key={p.id}
                          post={p}
                          onOpen={() => setSelected(p)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: day-by-day vertical layout */}
      <div className="md:hidden flex flex-col gap-3 mb-4">
        {Array.from({ length: 7 }).map((_, di) => {
          const day = addDays(week.start, di);
          const today = isToday(day);
          const dayHasAny = users.some((u) => cellPosts(u.id, di).length > 0);
          return (
            <div
              key={di}
              className={`card rounded-2xl p-3 ${today ? "ring-2 ring-rose-200" : ""}`}
            >
              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-semibold ${today ? "text-rose-600" : ""}`}
                  >
                    {WEEKDAYS[di]}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {format(day, "MM/dd")}
                  </span>
                  {today && (
                    <span className="chip bg-rose-100 text-rose-600">
                      오늘
                    </span>
                  )}
                </div>
                {!dayHasAny && (
                  <span className="text-[11px] text-zinc-300">아직 없어요</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {users.map((u) => {
                  const items = cellPosts(u.id, di);
                  if (items.length === 0) return null;
                  const theme = USER_THEME[u.id];
                  return (
                    <div key={u.id} className="flex items-center gap-2">
                      <div
                        className={`shrink-0 w-16 flex items-center gap-1 px-2 py-1 rounded-full ${theme.soft}`}
                      >
                        <span className="text-sm">{u.emoji}</span>
                        <span className="text-[11px] font-medium truncate">
                          {u.name}
                        </span>
                      </div>
                      <div className="flex-1 flex flex-wrap gap-1.5">
                        {items.map((p) => (
                          <PostThumb
                            key={p.id}
                            post={p}
                            onOpen={() => setSelected(p)}
                            size="lg"
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly summary — 통과 받은 식단 수 */}
      <section className="card rounded-2xl p-4 mb-4">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-700">
            이번 주 통과 ✅
          </h2>
          <span className="text-[11px] text-zinc-400">
            둘 다 👍 받은 식단
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {users.map((u) => {
            const theme = USER_THEME[u.id];
            const passed = passedByUser(u.id);
            return (
              <div
                key={u.id}
                className={`rounded-2xl p-3 ${theme.soft} flex flex-col items-center gap-1`}
              >
                <span className="text-2xl">{u.emoji}</span>
                <span className="text-xs font-medium truncate max-w-full">
                  {u.name}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-2xl font-bold ${theme.text}`}>
                    {passed}
                  </span>
                  <span className="text-[11px] text-zinc-500">통과</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {loading && (
        <div className="text-center text-sm text-zinc-400 mt-4">
          불러오는 중...
        </div>
      )}

      {/* FAB */}
      <Link
        href="/upload"
        className="fixed bottom-6 right-6 h-14 pl-5 pr-6 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 text-white text-base font-semibold flex items-center gap-2 shadow-xl shadow-rose-500/30 active:scale-95 transition"
      >
        <span className="text-xl leading-none">+</span>
        <span>기록하기</span>
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

function PostThumb({
  post,
  onOpen,
  size = "sm",
}: {
  post: Post;
  onOpen: () => void;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "w-20 h-20" : "w-full aspect-square";
  const others = post.votes.filter((v) => v.voter_id !== post.user_id);
  const passCount = others.filter((v) => v.vote === "pass").length;
  const rejectCount = others.filter((v) => v.vote === "reject").length;
  const verdict = computeVerdict(post.votes, post.user_id);

  return (
    <button
      onClick={onOpen}
      className={`relative ${dim} overflow-hidden rounded-lg ring-1 ring-black/5 active:scale-95 transition`}
      title={CATEGORY_LABEL[post.category]}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.photo_url}
        alt=""
        className="w-full h-full object-cover"
      />

      {verdict === "pass" && (
        <span className="absolute top-0.5 left-0.5 text-[10px] bg-emerald-500 text-white rounded-full px-1.5 py-0.5 leading-tight font-semibold shadow">
          통과
        </span>
      )}
      {verdict === "reject" && (
        <span className="absolute top-0.5 left-0.5 text-[10px] bg-rose-500 text-white rounded-full px-1.5 py-0.5 leading-tight font-semibold shadow">
          거부
        </span>
      )}
      {verdict === "tie" && (
        <span className="absolute top-0.5 left-0.5 text-[10px] bg-zinc-500 text-white rounded-full px-1.5 py-0.5 leading-tight font-semibold shadow">
          무승부
        </span>
      )}

      {(passCount > 0 || rejectCount > 0) && (
        <span className="absolute top-0.5 right-0.5 text-[10px] bg-black/60 text-white rounded-full px-1.5 py-0.5 leading-tight flex items-center gap-0.5">
          {passCount > 0 && <span>{passCount}👍</span>}
          {rejectCount > 0 && <span>{rejectCount}👎</span>}
        </span>
      )}

      <span className="absolute bottom-0.5 right-0.5 text-[10px] bg-black/55 text-white rounded-full px-1.5 py-0.5 leading-tight">
        {CATEGORY_EMOJI[post.category]}
      </span>
    </button>
  );
}
