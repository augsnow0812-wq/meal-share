"use client";

import { useCurrentUser } from "./CurrentUserProvider";
import { useUsers } from "./UsersProvider";

export function UserPicker() {
  const { setUserId } = useCurrentUser();
  const { users } = useUsers();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <h1 className="text-2xl font-bold">누구세요?</h1>
      <p className="text-sm text-zinc-500">한 번만 선택하면 이 기기에 기억됩니다.</p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => setUserId(u.id)}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-6 py-4 text-lg font-medium hover:bg-zinc-100 active:scale-95 transition"
          >
            <span className="text-2xl">{u.emoji}</span>
            <span>{u.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
