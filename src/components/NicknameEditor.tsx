"use client";

import { useState } from "react";
import { NAME_MAX, type User } from "@/lib/users";
import { useUsers } from "./UsersProvider";

type Props = {
  user: User;
  onClose: () => void;
};

export function NicknameEditor({ user, onClose }: Props) {
  const { updateUser } = useUsers();
  const [name, setName] = useState(user.name);
  const [emoji, setEmoji] = useState(user.emoji);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedName = name.trim();
  const trimmedEmoji = emoji.trim();
  const changed =
    trimmedName !== user.name || trimmedEmoji !== user.emoji;
  const valid = trimmedName.length > 0 && trimmedEmoji.length > 0;

  const handleSave = async () => {
    if (!changed || !valid) return;
    setSaving(true);
    setError(null);
    try {
      await updateUser(user.id, { name: trimmedName, emoji: trimmedEmoji });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">닉네임 수정 ✎</h2>
        <p className="text-xs text-zinc-500 -mt-2">
          변경하면 친구들 화면에도 반영돼요.
        </p>

        <div>
          <label className="block text-sm font-medium mb-1">이모지</label>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={8}
            className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-2xl text-center"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX}
            className="w-full border border-zinc-200 rounded-xl px-4 py-3"
            autoFocus
          />
          <div className="text-xs text-zinc-400 mt-1 text-right">
            {trimmedName.length}/{NAME_MAX}
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-zinc-200"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!changed || !valid || saving}
            className="flex-1 py-3 rounded-xl bg-black text-white disabled:opacity-40"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
