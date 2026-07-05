"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { isUserId, type UserId } from "@/lib/users";

type Ctx = {
  userId: UserId | null;
  setUserId: (id: UserId | null) => void;
  ready: boolean;
};

const CurrentUserContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "meal-share:user-id";

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserIdState] = useState<UserId | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isUserId(stored)) {
      setUserIdState(stored);
    }
    setReady(true);
  }, []);

  const setUserId = (id: UserId | null) => {
    setUserIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <CurrentUserContext.Provider value={{ userId, setUserId, ready }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within CurrentUserProvider");
  return ctx;
}
