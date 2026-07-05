import type { UserId } from "./users";

export type Category = "snack" | "dinner";

export type VoteKind = "pass" | "reject";

export type Vote = {
  voter_id: UserId;
  vote: VoteKind;
};

export type Post = {
  id: string;
  user_id: UserId;
  category: Category;
  photo_url: string;
  captured_at: string;
  is_camera: boolean;
  memo: string | null;
  created_at: string;
  votes: Vote[];
};

export const CATEGORY_LABEL: Record<Category, string> = {
  snack: "간식",
  dinner: "저녁",
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  snack: "🍩",
  dinner: "🍚",
};

export type Verdict = "pass" | "reject" | "tie" | "pending";

/** 자기 자신을 제외한 나머지 2명이 모두 투표를 마쳤을 때만 판정한다. */
export function computeVerdict(votes: Vote[], ownerId: UserId): Verdict {
  const others = votes.filter((v) => v.voter_id !== ownerId);
  if (others.length < 2) return "pending";
  const pass = others.filter((v) => v.vote === "pass").length;
  const reject = others.filter((v) => v.vote === "reject").length;
  if (pass === others.length) return "pass";
  if (reject === others.length) return "reject";
  return "tie";
}
