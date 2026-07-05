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

export const USER_THEME: Record<
  UserId,
  { ring: string; bg: string; text: string; dot: string; soft: string }
> = {
  user_1: {
    ring: "ring-rose-300",
    bg: "bg-rose-500",
    text: "text-rose-600",
    dot: "bg-rose-500",
    soft: "bg-rose-50",
  },
  user_2: {
    ring: "ring-amber-300",
    bg: "bg-amber-500",
    text: "text-amber-700",
    dot: "bg-amber-500",
    soft: "bg-amber-50",
  },
  user_3: {
    ring: "ring-emerald-300",
    bg: "bg-emerald-500",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    soft: "bg-emerald-50",
  },
};

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
