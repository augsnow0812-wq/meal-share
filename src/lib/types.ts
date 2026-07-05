import type { UserId } from "./users";

export type Category = "snack" | "dinner";

export type Post = {
  id: string;
  user_id: UserId;
  category: Category;
  photo_url: string;
  captured_at: string;
  is_camera: boolean;
  memo: string | null;
  created_at: string;
};

export const CATEGORY_LABEL: Record<Category, string> = {
  snack: "간식",
  dinner: "저녁",
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  snack: "🍩",
  dinner: "🍚",
};
