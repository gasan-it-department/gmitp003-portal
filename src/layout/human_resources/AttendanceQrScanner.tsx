import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import jsQR from "jsqr";
import { toast } from "sonner";
//
import { confirmAttendanceScan } from "@/db/statements/attendance";
//
import {
  ArrowLeft,
  CameraOff,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  SwitchCamera,
  Users,
} from "lucide-react";

const surfaceErr = (err: unknown, fallback = "Something went wrong") => {
  const e = err as any;
  return (
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.message ||
    fallback
  );
};

/** Chrome/Edge expose this natively; everything else falls back to jsQR. */
type BarcodeDetectorLike = {
  detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};
const NativeDetector = (
  globalThis as unknown as {
    BarcodeDetector?: new (o?: { formats?: string[] }) => BarcodeDetectorLike;
  }
).BarcodeDetector;

/**
 * A scan result toast. The Toaster is mounted without `richColors`, so the
 * default success/error styling is monochrome — the colour that tells HR at a
 * glance whether the person got in is built here rather than assumed.
 */
const resultToast = (
  tone: "ok" | "warn" | "bad",
  title: string,
  detail?: string,
) => {
  const skin = {
    ok: { bar: "bg-emerald-500", ring: "border-emerald-200", text: "text-emerald-700", Icon: CheckCircle2 },
    warn: { bar: "bg-amber-500", ring: "border-amber-200", text: "text-amber-700", Icon: AlertTriangle },
    bad: { bar: "bg-red-500", ring: "border-red-200", text: "text-red-700", Icon: XCircle },
  }[tone];
  toast.custom(
    () => (
      <div
        className={`flex items-stretch gap-0 overflow-hidden rounded-lg border ${skin.ring} bg-white shadow-lg w-[340px]`}
      >
        <div className={`w-1.5 ${skin.bar}`} />
        <div className="flex items-start gap-2.5 px-3.5 py-3 min-w-0">
          <skin.Icon className={`h-5 w-5 ${skin.text} flex-shrink-0 mt-0.5`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {title}
            </p>
            {detail && (
              <p className="text-xs text-gray-500 mt-0.5">{detail}</p>
            )}
          </div>
        </div>
      </div>
    ),
    { duration: tone === "ok" ? 2200 : 4000 },
  );
};

/**
 * Full-page live QR scanning for an open attendance sheet, off the computer's
 * own webcam. Reads the same employee ID QR the mobile scanner reads and posts
 * to the same /attendance/confirm, so the auth gate, the snapshot-frozen
 * columns and the duplicate handling are all shared.
 *
 * Two decoders: the browser's native BarcodeDetector where it exists
 * (Chrome/Edge), otherwise jsQR over a canvas frame. A scanner that silently
 * does nothing on Firefox is worse than a slightly slower one.
 */
const AttendanceQrScanner = ({
  open,
  onClose,
  eventId,
  eventTitle,
  entries,
  onRecorded,
}: {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  /** The sheet's scan entries, in HR's order. */
  entries: string[];
  onRecorded?: () => void;
}) => {
  const qc = useQueryClient();
  const auth = useAuth();
  const token = auth.token as string;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  /** True while a scan is in flight, so the loop does not double-fire. */
  const busyRef = useRef(false);
  /** Last code handled, to ignore a badge left sitting in frame. */
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);

  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [count, setCount] = useState<number | null>(null);
  /** The segment being scanned. On a multi-entry sheet HR switches this as
   *  the day moves on: AM In in the morning, AM Out at noon, and so on. */
  const [entry, setEntry] = useState<string>(entries[0] ?? "Attendance");
  const entryRef = useRef(entry);
  useEffect(() => {
    entryRef.current = entry;
  }, [entry]);
  // A fresh sheet (or a changed one) resets to its first entry.
  useEffect(() => {
    setEntry(entries[0] ?? "Attendance");
  }, [entries.join("|")]);
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);

  /** More than one entry means HR must say which segment they are scanning. */
  const multi = entries.length > 1;

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setLive(false);
  }, []);

  /** One call per scan: /attendance/confirm takes the raw code and answers
   *  with the name, whether it was a duplicate, and the running headcount. */
  const record = useMutation({
    mutationFn: (code: string) =>
      confirmAttendanceScan(token, eventId, code, entryRef.current),
    onSuccess: (r) => {
      // On a multi-entry sheet the number HR watches is the count for THIS
      // segment, not the sheet total.
      const shown = multi ? r.entryCount : r.attendees;
      if (typeof shown === "number") setCount(shown);
      const where = r.entry ?? entryRef.current;
      if (r.duplicate) {
        resultToast(
          "warn",
          r.fullName ?? "Already recorded",
          multi ? `Already scanned for ${where}` : "Already on this sheet",
        );
        setFlash("bad");
      } else {
        resultToast(
          "ok",
          r.fullName ?? "Recorded",
          [multi ? where : null, typeof shown === "number" ? `${shown} recorded` : null]
            .filter(Boolean)
            .join(" · ") || "Recorded",
        );
        setFlash("ok");
        qc.invalidateQueries({ queryKey: ["attendance-records", eventId] });
        qc.invalidateQueries({ queryKey: ["attendance-event", eventId] });
        onRecorded?.();
      }
      busyRef.current = false;
    },
    onError: (e) => {
      resultToast("bad", "Not recorded", surfaceErr(e, "Could not read that ID"));
      setFlash("bad");
      busyRef.current = false;
    },
  });

  // Clear the edge flash shortly after each scan.
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 550);
    return () => clearTimeout(t);
  }, [flash]);

  /** One decode attempt against the current video frame. */
  const readFrame = useCallback(async (): Promise<string | null> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    if (detectorRef.current) {
      try {
        const hits = await detectorRef.current.detect(video);
        return hits.length ? hits[0].rawValue : null;
      } catch {
        // A detector that starts throwing is worse than none — drop to jsQR.
        detectorRef.current = null;
      }
    }

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    // Drawn from the raw video, so the mirrored PREVIEW never reaches the
    // decoder — a flipped frame would not decode.
    ctx.drawImage(video, 0, 0, w, h);
    const hit = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, {
      inversionAttempts: "dontInvert",
    });
    return hit?.data ?? null;
  }, []);

  const loop = useCallback(async () => {
    if (!streamRef.current) return;
    if (!busyRef.current) {
      const code = await readFrame();
      if (code) {
        const last = lastCodeRef.current;
        const repeat = last?.code === code && Date.now() - last.at < 4000;
        if (!repeat) {
          lastCodeRef.current = { code, at: Date.now() };
          busyRef.current = true;
          record.mutate(code);
        }
      }
    }
    rafRef.current = requestAnimationFrame(() => void loop());
  }, [readFrame, record]);

  const start = useCallback(
    async (id?: string) => {
      setError(null);
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("This browser cannot open a camera. Use Chrome or Edge.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: id
            ? { deviceId: { exact: id } }
            : { facingMode: "environment", width: { ideal: 1280 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }

        // Labels only populate once permission has been granted.
        const list = (await navigator.mediaDevices.enumerateDevices()).filter(
          (d) => d.kind === "videoinput",
        );
        setDevices(list);
        const active = stream.getVideoTracks()[0]?.getSettings?.().deviceId;
        if (active) setDeviceId(active);

        if (NativeDetector && !detectorRef.current) {
          try {
            detectorRef.current = new NativeDetector({ formats: ["qr_code"] });
          } catch {
            detectorRef.current = null;
          }
        }

        setLive(true);
        rafRef.current = requestAnimationFrame(() => void loop());
      } catch (e) {
        const err = e as DOMException & { message?: string };
        setError(
          err?.name === "NotAllowedError"
            ? "Camera access was blocked. Allow it from the icon in the address bar, then reopen the scanner."
            : err?.name === "NotFoundError"
              ? "No camera found on this computer."
              : err?.name === "NotReadableError"
                ? "The camera is already in use by another program."
                : (err?.message ?? "Could not start the camera."),
        );
        stop();
      }
    },
    [loop, stop],
  );

  // Open → camera on. Close (or unmount) → camera off, so the indicator light
  // never stays on after HR leaves the page.
  useEffect(() => {
    if (!open) {
      stop();
      return;
    }
    void start(deviceId || undefined);
    return stop;
    // deviceId changes go through the explicit switcher below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Escape closes, and the page behind must not scroll while this is up.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const cycleCamera = () => {
    if (devices.length < 2) return;
    const i = devices.findIndex((d) => d.deviceId === deviceId);
    const next = devices[(i + 1) % devices.length];
    setDeviceId(next.deviceId);
    stop();
    setTimeout(() => void start(next.deviceId), 150);
  };

  if (!open) return null;

  const secure =
    typeof window !== "undefined" &&
    (window.isSecureContext || location.hostname === "localhost");

  return createPortal(
    <div className="fixed inset-0 z-[70] bg-black text-white flex flex-col">
      {/* ── Camera ─────────────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        playsInline
        muted
        // Mirrored so moving the badge left moves it left on screen — the
        // decoder reads the raw frame, so this is presentation only.
        style={{ transform: "scaleX(-1)" }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Result flash around the edge of the whole screen */}
      {flash && (
        <div
          className={`pointer-events-none absolute inset-0 ring-[6px] ring-inset transition-opacity duration-300 ${
            flash === "ok" ? "ring-emerald-400" : "ring-red-500"
          }`}
        />
      )}

      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back to sheet</span>
        </button>

        <div className="min-w-0 text-center hidden sm:block">
          <p className="text-sm font-semibold truncate">{eventTitle}</p>
          <p className="text-[11px] text-white/60">
            {live ? "Scanning — hold an ID to the camera" : "Starting camera…"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {count !== null && (
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs tabular-nums">
              <Users className="h-3.5 w-3.5" />
              {count}
            </span>
          )}
          {devices.length > 1 && (
            <button
              type="button"
              onClick={cycleCamera}
              title="Switch camera"
              className="rounded-md p-2 hover:bg-white/10 transition-colors"
            >
              <SwitchCamera className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Which entry these scans go to ──────────────────────────────── */}
      {multi && (
        <div className="relative z-10 px-4 pb-1">
          <div className="mx-auto max-w-3xl">
            <p className="text-[11px] text-white/60 mb-1.5 text-center">
              Scanning into
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {entries.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    setEntry(e);
                    // Let the same badge be scanned again straight away for
                    // the new segment.
                    lastCodeRef.current = null;
                    setCount(null);
                  }}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    entry === e
                      ? "bg-white text-gray-900"
                      : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Aiming frame ───────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        {!secure ? (
          <div className="mx-6 max-w-md rounded-lg bg-amber-500/95 px-4 py-3 text-sm text-white">
            Browsers only allow the camera on a secure (https) page. Open the
            portal over https and reload.
          </div>
        ) : error ? (
          <div className="mx-6 max-w-md rounded-lg bg-white text-gray-900 px-4 py-4 shadow-xl">
            <div className="flex items-start gap-2.5">
              <CameraOff className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Camera unavailable</p>
                <p className="text-sm text-gray-600 mt-1">{error}</p>
                <button
                  type="button"
                  onClick={() => void start(deviceId || undefined)}
                  className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : !live ? (
          <Loader2 className="h-8 w-8 animate-spin text-white/70" />
        ) : (
          <div className="relative w-[min(70vw,320px)] aspect-square">
            <div className="absolute inset-0 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
            {/* corner brackets */}
            {[
              "top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl",
              "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl",
              "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl",
              "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl",
            ].map((c) => (
              <span
                key={c}
                className={`absolute h-10 w-10 border-white/90 ${c}`}
              />
            ))}
            {record.isPending && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom hint ────────────────────────────────────────────────── */}
      <div className="relative z-10 px-4 py-4 text-center bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-xs text-white/70">
          Each scan is recorded straight onto{" "}
          <span className="text-white/90 font-medium">{eventTitle}</span>
          {multi ? (
            <>
              {" "}
              as <span className="text-white/90 font-medium">{entry}</span>
            </>
          ) : null}
          . Press Esc to stop.
        </p>
      </div>
    </div>,
    document.body,
  );
};

export default AttendanceQrScanner;
