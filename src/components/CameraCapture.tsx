"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";

type Props = {
  onCapture: (blob: Blob, capturedAt: Date) => void;
  onCancel: () => void;
};

export function CameraCapture({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setReady(true);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "카메라를 열 수 없습니다");
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleShoot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const capturedAt = new Date();
    const text = format(capturedAt, "yyyy-MM-dd HH:mm");
    const fontSize = Math.max(20, Math.round(canvas.width / 28));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textBaseline = "bottom";
    ctx.textAlign = "right";
    const padding = Math.round(fontSize * 0.6);
    const x = canvas.width - padding;
    const y = canvas.height - padding;
    ctx.lineWidth = Math.max(2, Math.round(fontSize / 8));
    ctx.strokeStyle = "rgba(0,0,0,0.75)";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillText(text, x, y);

    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob, capturedAt);
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex-1 flex items-center justify-center relative">
        {error ? (
          <div className="text-white p-6 text-center">
            <p>{error}</p>
            <p className="text-sm text-zinc-400 mt-2">
              HTTPS 환경 & 카메라 권한이 필요합니다.
            </p>
          </div>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className="max-h-full max-w-full"
          />
        )}
      </div>
      <div className="flex items-center justify-between p-6 gap-4 bg-black">
        <button
          type="button"
          onClick={onCancel}
          className="text-white px-4 py-2 rounded-lg"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleShoot}
          disabled={!ready}
          className="w-16 h-16 rounded-full bg-white disabled:opacity-40 border-4 border-zinc-300 active:scale-95 transition"
          aria-label="촬영"
        />
        <div className="w-16" />
      </div>
    </div>
  );
}
