import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import jsQR from "jsqr";
import { toast } from "sonner";
//
import {
  resolveAttendanceScan,
  confirmAttendanceScan,
  type ScanResolution,
} from "@/db/statements/attendance";
//
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  CameraOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  UserRound,
  RotateCw,
  X,
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
 * Live QR scanning from the laptop/desktop webcam, for an open attendance
 * sheet. Reads the same employee ID QR the mobile scanner reads.
 *
 * Two decoders on purpose: the browser's own BarcodeDetector when it exists
 * (native, no per-frame allocation), otherwise jsQR over a canvas frame. HR
 * machines are mostly Chrome/Edge, but a scanner that silently does nothing on
 * Firefox is worse than a slightly slower one.
 */
const AttendanceQrScanner = ({
  eventId,
  eventTitle,
  onRecorded,
}: {
  eventId: string;
  eventTitle: string;
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
  /** Set while a scan is being resolved/confirmed so the loop stops firing. */
  const busyRef = useRef(false);
  /** Last code handled, to ignore the same badge sitting in frame. */
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);

  const [on, setOn] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [pending, setPending] = useState<ScanResolution | null>(null);
  const [recent, setRecent] = useState<{ name: string; at: string }[]>([]);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setOn(false);
  }, []);

  // Never leave the camera light on when the page goes away.
  useEffect(() => stop, [stop]);

  const resolve = useMutation({
    mutationFn: (code: string) => resolveAttendanceScan(token, eventId, code),
    onSuccess: (r) => setPending(r),
    onError: (e) => {
      toast.error(surfaceErr(e, "Could not read that ID"));
      busyRef.current = false;
    },
  });

  const confirm = useMutation({
    mutationFn: (userId: string) => confirmAttendanceScan(token, eventId, userId),
    onSuccess: (_r, userId) => {
      const name =
        pending?.user.id === userId ? pending.user.fullName : "Employee";
      toast.success(`${name} recorded`);
      setRecent((r) => [
        { name, at: new Date().toLocaleTimeString() },
        ...r.slice(0, 7),
      ]);
      setPending(null);
      busyRef.current = false;
      qc.invalidateQueries({ queryKey: ["attendance-records", eventId] });
      onRecorded?.();
    },
    onError: (e) => {
      toast.error(surfaceErr(e, "Could not record that scan"));
      busyRef.current = false;
    },
  });

  /** One decode attempt against the current video frame. */
  const readFrame = useCallback(async (): Promise<string | null> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    if (detectorRef.current) {
      try {
        const hits = await detectorRef.current.detect(video);
        if (hits.length) return hits[0].rawValue;
        return null;
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
    ctx.drawImage(video, 0, 0, w, h);
    const hit = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, {
      inversionAttempts: "dontInvert",
    });
    return hit?.data ?? null;
  }, []);

  const loop = useCallback(async () => {
    if (!streamRef.current) return;
    if (!busyRef.current && !pending) {
      const code = await readFrame();
      if (code) {
        const last = lastCodeRef.current;
        // The badge stays in frame after a scan; ignore it for a few seconds
        // rather than hammering the API with the same code.
        const repeat = last?.code === code && Date.now() - last.at < 4000;
        if (!repeat) {
          lastCodeRef.current = { code, at: Date.now() };
          busyRef.current = true;
          resolve.mutate(code);
        }
      }
    }
    rafRef.current = requestAnimationFrame(() => void loop());
  }, [pending, readFrame, resolve]);

  const start = useCallback(async () => {
    setError(null);
    setStarting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "This browser cannot open a camera. Use Chrome or Edge.",
        );
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? { deviceId: { exact: deviceId } }
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
      if (!deviceId && list[0]?.deviceId) setDeviceId(list[0].deviceId);

      if (NativeDetector && !detectorRef.current) {
        try {
          detectorRef.current = new NativeDetector({ formats: ["qr_code"] });
        } catch {
          detectorRef.current = null;
        }
      }

      setOn(true);
      rafRef.current = requestAnimationFrame(() => void loop());
    } catch (e) {
      const err = e as DOMException & { message?: string };
      setError(
        err?.name === "NotAllowedError"
          ? "Camera access was blocked. Allow it in the browser's address bar, then try again."
          : err?.name === "NotFoundError"
            ? "No camera found on this computer."
            : err?.name === "NotReadableError"
              ? "The camera is already in use by another program."
              : (err?.message ?? "Could not start the camera."),
      );
      stop();
    } finally {
      setStarting(false);
    }
  }, [deviceId, loop, stop]);

  // Restart cleanly when HR picks a different camera.
  const switchCamera = (id: string) => {
    setDeviceId(id);
    if (on) {
      stop();
      setTimeout(() => void start(), 150);
    }
  };

  const secure =
    typeof window !== "undefined" &&
    (window.isSecureContext || location.hostname === "localhost");

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="border-b bg-gray-50/50 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">Live QR scan</h2>
          {on && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[11px] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              Camera on
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {devices.length > 1 && (
            <Select value={deviceId} onValueChange={switchCamera}>
              <SelectTrigger className="h-8 w-48 text-xs">
                <SelectValue placeholder="Camera" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((d, i) => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {on ? (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={stop}>
              <CameraOff className="h-3.5 w-3.5" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              className="gap-1.5 bg-blue-600 hover:bg-blue-700"
              disabled={starting || !secure}
              onClick={() => void start()}
            >
              {starting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
              Start camera
            </Button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-3">
        {!secure && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Browsers only allow the camera on a secure (https) page. Open the
              portal over https and reload.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* ── Viewfinder ─────────────────────────────────────────────── */}
          <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${on ? "" : "opacity-0"}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {!on && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <Camera className="h-10 w-10 text-gray-600" strokeWidth={1.5} />
                <p className="text-sm text-gray-300 mt-3 font-medium">
                  Camera is off
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Start it, then hold an employee ID up to the lens. Each scan
                  is confirmed before it lands on {eventTitle}.
                </p>
              </div>
            )}

            {on && !pending && (
              <>
                {/* Aiming frame */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white/70 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                </div>
                <p className="absolute bottom-2 inset-x-0 text-center text-xs text-white/90">
                  {resolve.isPending ? "Reading…" : "Hold the ID QR in the frame"}
                </p>
              </>
            )}
          </div>

          {/* ── Confirm / recent ───────────────────────────────────────── */}
          <div className="space-y-3">
            {pending ? (
              <div className="rounded-lg border p-3.5 space-y-3">
                <div className="flex items-start gap-3">
                  {pending.user.profilePicture ? (
                    <img
                      src={pending.user.profilePicture}
                      alt=""
                      className="h-14 w-14 rounded-lg object-cover border flex-shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-gray-100 border flex items-center justify-center flex-shrink-0">
                      <UserRound className="h-7 w-7 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {pending.user.fullName}
                    </p>
                    {pending.user.inactive && (
                      <p className="text-xs text-amber-700 flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="h-3 w-3" />
                        This employee is inactive or archived
                      </p>
                    )}
                    {pending.alreadyRecorded && (
                      <p className="text-xs text-blue-700 mt-0.5">
                        Already recorded
                        {pending.recordedAt
                          ? ` at ${new Date(pending.recordedAt).toLocaleTimeString()}`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>

                {pending.columns.length > 0 && (
                  <dl className="text-xs divide-y rounded-md border bg-gray-50/60">
                    {pending.columns.map((c) => (
                      <div key={c.key} className="flex gap-2 px-2.5 py-1.5">
                        <dt className="text-gray-500 w-28 flex-shrink-0 truncate">
                          {c.label}
                        </dt>
                        <dd className="text-gray-900 min-w-0 truncate">
                          {c.value || "—"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-1.5 bg-blue-600 hover:bg-blue-700"
                    disabled={confirm.isPending || pending.alreadyRecorded}
                    onClick={() => confirm.mutate(pending.user.id)}
                  >
                    {confirm.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {pending.alreadyRecorded ? "Already in" : "Confirm"}
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => {
                      setPending(null);
                      busyRef.current = false;
                    }}
                  >
                    <X className="h-4 w-4" />
                    Skip
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-5 text-center">
                <p className="text-sm text-gray-500 font-medium">
                  Nothing scanned yet
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  The employee appears here for you to confirm before they are
                  written to the sheet.
                </p>
              </div>
            )}

            {recent.length > 0 && (
              <div className="rounded-lg border">
                <p className="text-xs font-semibold text-gray-700 px-3 py-2 border-b bg-gray-50/60">
                  Recorded this session
                </p>
                <ul className="divide-y max-h-44 overflow-y-auto">
                  {recent.map((r, i) => (
                    <li
                      key={`${r.name}-${i}`}
                      className="px-3 py-2 flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="text-xs text-gray-900 truncate flex-1">
                        {r.name}
                      </span>
                      <span className="text-[11px] text-gray-400 tabular-nums">
                        {r.at}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {on && (
              <button
                type="button"
                onClick={() => {
                  lastCodeRef.current = null;
                  setPending(null);
                  busyRef.current = false;
                }}
                className="w-full text-xs text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1.5 py-1"
              >
                <RotateCw className="h-3 w-3" />
                Reset scanner
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceQrScanner;
