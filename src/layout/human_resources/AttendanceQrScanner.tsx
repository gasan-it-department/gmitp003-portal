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

/** "try again in 2m 14s", or nothing if the moment has already passed. */
const countdown = (nextAllowedAt?: string | null) => {
  if (!nextAllowedAt) return null;
  const ms = new Date(nextAllowedAt).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `try again in ${m ? `${m}m ` : ""}${sec}s`;
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
  /**
   * Per badge PER ENTRY, the moment it becomes worth reading again.
   *
   * A flat few-second window used to be enough, because a second scan was
   * refused forever and the toast said so once. Now the server enforces a
   * three-minute cool-down, so a badge left in front of the lens would earn
   * a fresh "Duplicate Entry" warning every few seconds for three minutes.
   * The client holds it off until the server would actually count it.
   *
   * Keyed by entry as well as code: switching from AM In to AM Out is a
   * different question, and the same badge must be readable straight away.
   */
  const holdRef = useRef(new Map<string, number>());
  const holdKey = (code: string, forEntry: string) => JSON.stringify([forEntry, code]);

  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Exactly what the browser said, kept verbatim. Chrome funnels several
   *  unrelated failures into NotReadableError, so the raw name and message
   *  are the only way anyone can tell them apart afterwards. */
  const [errDetail, setErrDetail] = useState<string | null>(null);
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

  /**
   * Bumped by every stop().
   *
   * getUserMedia is async, and stop() can only release a stream it can see.
   * Close the scanner while the permission prompt or the driver hand-off is
   * still in flight and the old code stored the stream AFTER the cleanup had
   * already run — a live camera with nobody holding it. The next open then
   * asked Windows for a device this very page was still using, and Chrome
   * answered NotReadableError. That is the "already in use by another
   * program" HR kept seeing: the other program was this tab.
   *
   * So each start captures the generation it began in, and a stream that
   * arrives after its generation was torn down is handed straight back.
   */
  const genRef = useRef(0);
  /**
   * One start at a time; stacked starts hammer the driver, and hammering a
   * flaky Windows driver is how you MAKE it report the camera as busy.
   *
   * A skipped request is remembered rather than dropped. Dropping it is a
   * bug I shipped into this very fix: close and immediately reopen while the
   * first getUserMedia is still pending, and the reopen was refused, leaving
   * a spinner over a camera nobody ever asked for again.
   */
  const startingRef = useRef(false);
  const pendingStartRef = useRef<{ id?: string } | null>(null);
  const startRef = useRef<((id?: string) => Promise<void>) | null>(null);
  /** Read by the queued restart, so a scanner closed in the meantime stays
   *  closed instead of switching the camera light back on. */
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const stop = useCallback(() => {
    genRef.current += 1;
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
    onSuccess: (r, code) => {
      // On a multi-entry sheet the number HR watches is the count for THIS
      // segment, not the sheet total.
      const shown = multi ? r.entryCount : r.attendees;
      if (typeof shown === "number") setCount(shown);
      const where = r.entry ?? entryRef.current;

      // Hold this badge, for this entry, until the server would take it
      // again — recorded or not. Re-reading it before then can only produce
      // the same answer.
      const until = r.nextAllowedAt ? new Date(r.nextAllowedAt).getTime() : 0;
      holdRef.current.set(
        holdKey(code, where),
        Number.isFinite(until) && until > Date.now() ? until : Date.now() + 4000,
      );

      if (r.duplicate) {
        resultToast(
          "warn",
          "Duplicate Entry",
          [
            r.fullName ?? "Already recorded",
            multi ? where : null,
            countdown(r.nextAllowedAt),
          ]
            .filter(Boolean)
            .join(" · "),
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
        const key = holdKey(code, entryRef.current);
        if ((holdRef.current.get(key) ?? 0) <= Date.now()) {
          // Provisional hold so the in-flight request is not fired twice;
          // the reply replaces it with the server's real cool-down.
          holdRef.current.set(key, Date.now() + 4000);
          busyRef.current = true;
          record.mutate(code);
        }
      }
    }
    rafRef.current = requestAnimationFrame(() => void loop());
  }, [readFrame, record]);

  const start = useCallback(
    async (id?: string) => {
      if (startingRef.current) {
        pendingStartRef.current = { id };
        return;
      }
      startingRef.current = true;
      // Always release before asking again. A retry that skips this is how a
      // single failure turns into a camera the page holds against itself.
      stop();
      const gen = genRef.current;
      setError(null);
      setErrDetail(null);

      /**
       * Progressively looser asks.
       *
       * Plenty of Windows webcam drivers — and nearly every virtual camera
       * (OBS, DroidCam, vendor utilities) — refuse a constrained request and
       * accept a bare one. A failure on the first shape is not the answer,
       * it is the first data point.
       */
      const attempts: MediaStreamConstraints[] = [
        ...(id ? [{ video: { deviceId: { exact: id } }, audio: false }] : []),
        {
          video: { facingMode: "environment", width: { ideal: 1280 } },
          audio: false,
        },
        { video: true, audio: false },
      ];

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("This browser cannot open a camera. Use Chrome or Edge.");
        }

        let stream: MediaStream | null = null;
        let lastErr: unknown = null;
        for (const constraints of attempts) {
          try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            break;
          } catch (e) {
            lastErr = e;
            // A refusal is a decision, not a constraint problem — asking
            // again in a different shape only re-prompts and re-annoys.
            if ((e as DOMException)?.name === "NotAllowedError") break;
          }
          // Give the driver a beat to let go between attempts.
          await new Promise((r) => setTimeout(r, 120));
        }
        if (!stream) throw lastErr ?? new Error("Could not start the camera.");

        // Torn down while we were waiting: hand the camera straight back
        // rather than parking a live stream nobody will ever stop.
        if (gen !== genRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

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
            : err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError"
              ? "No camera found on this computer."
              : err?.name === "NotReadableError" || err?.name === "TrackStartError"
                ? "Windows would not hand over the camera."
                : err?.name === "OverconstrainedError"
                  ? "That camera is no longer available. Pick another one below."
                  : (err?.message ?? "Could not start the camera."),
        );
        setErrDetail(
          [err?.name, err?.message].filter(Boolean).join(": ") || null,
        );
        // Offer a picker even on failure — if the default device is a broken
        // virtual camera, choosing a real one is the whole fix.
        try {
          const list = (await navigator.mediaDevices.enumerateDevices()).filter(
            (d) => d.kind === "videoinput",
          );
          setDevices(list);
        } catch {
          /* enumeration is a nicety, not a requirement */
        }
        stop();
      } finally {
        startingRef.current = false;
        const queued = pendingStartRef.current;
        pendingStartRef.current = null;
        if (queued && openRef.current) void startRef.current?.(queued.id);
      }
    },
    [loop, stop],
  );
  useEffect(() => {
    startRef.current = start;
  }, [start]);

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
    void start(next.deviceId);
  };

  if (!open) return null;

  const secure =
    typeof window !== "undefined" &&
    (window.isSecureContext || location.hostname === "localhost");

  /** Chrome says NotReadableError whether the camera is genuinely held by
   *  something else or merely switched off at the hardware or OS level. */
  const busyish = /NotReadableError|TrackStartError|Could not start/i.test(
    errDetail ?? "",
  );

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
                    // Holds are keyed by entry, so nothing to clear — the
                    // same badge is a fresh question for the new segment.
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
              <div className="min-w-0">
                <p className="text-sm font-semibold">Camera unavailable</p>
                <p className="text-sm text-gray-600 mt-1">{error}</p>

                {/* Chrome reports a busy camera and a switched-off camera
                    identically, so name the real candidates instead of
                    asserting one of them. */}
                {busyish && (
                  <ul className="mt-2 space-y-1 text-[12px] text-gray-600 list-disc pl-4">
                    <li>
                      Check the privacy shutter, or the camera key on the
                      keyboard (often F8 / F10 with a crossed-out camera).
                    </li>
                    <li>
                      Windows Settings → Privacy &amp; security → Camera: turn
                      on camera access and &ldquo;Let desktop apps access your
                      camera&rdquo;.
                    </li>
                    <li>
                      Close Teams, Zoom, Meet or the Camera app — and any other
                      tab of this portal with the scanner open.
                    </li>
                  </ul>
                )}

                {/* If the default device is a dead virtual camera, choosing a
                    real one IS the fix — so the picker lives here, not only
                    on the success path. */}
                {devices.length > 1 && (
                  <label className="mt-3 block">
                    <span className="text-[11px] uppercase tracking-wide text-gray-500">
                      Camera
                    </span>
                    <select
                      value={deviceId}
                      onChange={(e) => {
                        setDeviceId(e.target.value);
                        void start(e.target.value || undefined);
                      }}
                      className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm"
                    >
                      {devices.map((d, i) => (
                        <option key={d.deviceId || i} value={d.deviceId}>
                          {d.label || `Camera ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void start(deviceId || undefined)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Try again
                  </button>
                  {deviceId && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeviceId("");
                        void start(undefined);
                      }}
                      className="text-sm font-medium text-gray-600 hover:text-gray-800"
                    >
                      Use any camera
                    </button>
                  )}
                </div>

                {errDetail && (
                  <p className="mt-2.5 font-mono text-[10px] text-gray-400 break-words">
                    {errDetail}
                  </p>
                )}
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
