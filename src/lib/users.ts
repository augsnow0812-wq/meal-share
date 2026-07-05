export const USER_IDS = ["user_1", "user_2", "user_3"] as const;
export type UserId = (typeof USER_IDS)[number];

export type User = {
  id: UserId;
  name: string;
  emoji: string;
};

export const DEFAULT_USERS: User[] = [
  { id: "user_1", name: "혜진", emoji: "🍰" },
  { id: "user_2", name: "혜주", emoji: "🍜" },
  { id: "user_3", name: "지영", emoji: "🥗" },
];

export function isUserId(v: unknown): v is UserId {
  return typeof v === "string" && (USER_IDS as readonly string[]).includes(v);
}

export const NAME_MAX = 12;
export const EMOJI_MAX = 8;

export function normalizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, NAME_MAX);
}

export function normalizeEmoji(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return Array.from(trimmed).slice(0, 4).join("").slice(0, EMOJI_MAX);
}
