"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_USERS, type User, type UserId } from "@/lib/users";

type Ctx = {
  users: User[];
  getUser: (id: string | null | undefined) => User | undefined;
  updateUser: (id: UserId, patch: { name?: string; emoji?: string }) => Promise<User>;
  refresh: () => Promise<void>;
};

const UsersContext = createContext<Ctx | null>(null);

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/users", { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { users: User[] };
    if (Array.isArray(json.users) && json.users.length) setUsers(json.users);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getUser = useCallback(
    (id: string | null | undefined) => users.find((u) => u.id === id),
    [users],
  );

  const updateUser = useCallback(
    async (id: UserId, patch: { name?: string; emoji?: string }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `update failed (${res.status})`);
      }
      const { user } = (await res.json()) as { user: User };
      setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
      return user;
    },
    [],
  );

  return (
    <UsersContext.Provider value={{ users, getUser, updateUser, refresh }}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers must be used within UsersProvider");
  return ctx;
}
