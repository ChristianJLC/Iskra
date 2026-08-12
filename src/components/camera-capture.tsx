"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { X, Zap, ZapOff, Image as ImageIcon } from "lucide-react";

type ExtendedConstraintSet = MediaTrackConstraintSet & { torch?: boolean };
type ExtendedCapabilities = MediaTrackCapabilities & { torch?: boolean };

export function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      Promise.resolve().then(() => {
        if (!cancelled) {
          setError("La cámara no está disponible en este navegador. Elige una foto de la galería.");
        }
      });
      return () => {
        cancelled = true;
      };
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        const [track] = stream.getVideoTracks();
        const capabilities = track?.getCapabilities?.() as ExtendedCapabilities | undefined;
        setFlashSupported(Boolean(capabilities?.torch));
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudo acceder a la cámara. Revisa los permisos o elige una foto de la galería.");
        }
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function toggleFlash() {
    const [track] = streamRef.current?.getVideoTracks() ?? [];
    if (!track || !flashSupported) return;

    const next = !flashOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as ExtendedConstraintSet] });
      setFlashOn(next);
    } catch {
      // Algunos navegadores rechazan el cambio de torch; se ignora silenciosamente.
    }
  }

  function handleShutter() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], "meal.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9
    );
  }

  function handleGalleryChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onCapture(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-end p-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar cámara"
          className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        >
          <X size={22} />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {error ? (
          <p className="max-w-xs text-center text-sm text-white/80">{error}</p>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="pointer-events-none relative aspect-square w-[85vw] max-w-md rounded-2xl border-2 border-white/70" />
          </>
        )}
      </div>

      <div className="flex items-center justify-between px-10 pb-10 pt-4">
        <button
          type="button"
          onClick={toggleFlash}
          disabled={!flashSupported}
          aria-label="Activar o desactivar flash"
          className="rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
        >
          {flashOn ? <Zap size={22} /> : <ZapOff size={22} />}
        </button>

        <button
          type="button"
          onClick={handleShutter}
          disabled={Boolean(error)}
          aria-label="Tomar foto"
          className="h-16 w-16 rounded-full border-4 border-white bg-white/20 transition-colors hover:bg-white/30 disabled:opacity-30"
        />

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          aria-label="Elegir de la galería"
          className="rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
        >
          <ImageIcon size={22} />
        </button>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleGalleryChange}
        />
      </div>
    </div>
  );
}
