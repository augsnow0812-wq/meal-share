"use client";

import { USER_THEME, type UserId } from "@/lib/users";
import { useCurrentUser } from "./CurrentUserProvider";
import { useUsers } from "./UsersProvider";

export function UserPicker() {
  const { setUserId } = useCurrentUser();
  const { users } = useUsers();

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 gap-8">
      <div className="text-center">
        <div className="text-5xl mb-3">🍚</div>
        <h1 className="text-2xl font-bold tracking-tight">밥친구</h1>
        <p className="text-sm text-zinc-500 mt-2">
          누구세요? 한 번만 알려주면 이 기기에 기억할게요.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {users.map((u) => {
          const theme = USER_THEME[u.id as UserId];
          return (
            <button
              key={u.id}
              onClick={() => setUserId(u.id)}
              className={`card flex items-center gap-4 rounded-2xl px-5 py-4 text-lg font-medium ring-2 ${theme.ring} active:scale-95 transition`}
            >
              <span className="text-3xl">{u.emoji}</span>
              <span className="flex-1 text-left">{u.name}</span>
              <span className={`text-xs ${theme.text}`}>선택 →</span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-zinc-400">
        나중에 상단 좌측 이름을 탭하면 닉네임을 바꿀 수 있어요.
      </p>
    </div>
  );
}
