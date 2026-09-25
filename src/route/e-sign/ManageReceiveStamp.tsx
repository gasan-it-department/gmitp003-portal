/**
 * Manage Receive Stamp.
 *
 * An office's receiving stamp is a rubber stamp: a box reading RECEIVED,
 * the office name, and two empty lines — DATE and BY. A clerk inks it onto
 * whatever arrives and writes the date and their name by hand.
 *
 * This is that, done once. Upload the office's own artwork, drag the date,
 * the name and your signature to where they belong ON YOUR stamp, and the
 * app fills those three in from then on. The artwork is never invented
 * here: a receiving stamp that does not look like the office's receiving
 * stamp is not evidence of anything.
 *
 * Everything is positioned in basis points of the artwork (0-10000 of its
 * width and height, measured from the top-left) — the same unit the server
 * prints with, so what is dragged here and what lands on paper divide by
 * the same number and cannot drift apart.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/provider/ProtectedRoute";
import {
  deleteReceiveStamp,
  myReceiveStamp,
  receiveStampImage,
  receiveStampPreview,
  saveReceiveStamp,
  uploadReceiveStampImage,
  type ReceiveStampConfig,
} from "@/db/statements/receiveStamp";
import { describeApiError } from "@/utils/apiError";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Stamp,
  Loader2,
  PenLine,
  CalendarDays,
  Type,
  RefreshCw,
  Trash2,
  AlertCircle,
  Save,
  Check,
} from "lucide-react";

/** The stamp is a physical object: 58mm x 30mm, in points. */
const STAMP_W_PT = (58 / 25.4) * 72;
const STAMP_H_PT = (30 / 25.4) * 72;
const BP = 10000;

/** What the editor is holding, before it is saved. */
type Draft = Pick<
  ReceiveStampConfig,
  | "sigX" | "sigY" | "sigW" | "sigH"
  | "nickname" | "nameX" | "nameY" | "nameSizePt"
  | "dateX" | "dateY" | "dateSizePt"
>;

const DEFAULTS: Draft = {
  sigX: 5200, sigY: 6200, sigW: 3600, sigH: 2600,
  nickname: "", nameX: 2400, nameY: 8600, nameSizePt: 9,
  dateX: 2400, dateY: 7000, dateSizePt: 9,
};

const fp = (d: Draft) => JSON.stringify(d);

/** Today, formatted exactly the way the server will print it. */
const todayText = () =>
  new Date().toLocaleDateString("en-PH", {
    year: "numeric", month: "2-digit", day: "2-digit",
  });

type Handle = "sig" | "name" | "date";

const ManageReceiveStamp = () => {
  const auth = useAuth();
  const qc = useQueryClient();
  const token = auth.token as string;

  const { data, isLoading } = useQuery({
    queryKey: ["receive-stamp", auth.userId],
    queryFn: () => myReceiveStamp(token),
    enabled: !!token,
  });

  const [draft, setDraft] = useState<Draft>(DEFAULTS);
  const [savedFp, setSavedFp] = useState<string | null>(null);
  const hydrated = useRef(false);

  // Load the saved setup once. Later refetches must not stamp over a drag
  // in progress — the same trap the placement editor fell into.
  useEffect(() => {
    if (hydrated.current || !data) return;
    const next: Draft = data.stamp
      ? {
          sigX: data.stamp.sigX, sigY: data.stamp.sigY,
          sigW: data.stamp.sigW, sigH: data.stamp.sigH,
          nickname: data.stamp.nickname ?? "",
          nameX: data.stamp.nameX, nameY: data.stamp.nameY,
          nameSizePt: data.stamp.nameSizePt,
          dateX: data.stamp.dateX, dateY: data.stamp.dateY,
          dateSizePt: data.stamp.dateSizePt,
        }
      : DEFAULTS;
    setDraft(next);
    setSavedFp(fp(next));
    hydrated.current = true;
  }, [data]);

  const dirty = savedFp !== null && fp(draft) !== savedFp;
  const hasArtwork = !!data?.stamp?.hasImage;
  const hasSignature = !!data?.signature?.hasImage;

  // ── the artwork ─────────────────────────────────────────────────────
  const [artUrl, setArtUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!hasArtwork) { setArtUrl(null); return; }
    let dead = false;
    let url: string | null = null;
    receiveStampImage(token)
      .then((b) => {
        if (dead) return;
        url = URL.createObjectURL(b);
        setArtUrl(url);
      })
      .catch(() => undefined);
    return () => {
      dead = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [hasArtwork, token, data?.stamp?.updatedAt]);

  const fileRef = useRef<HTMLInputElement>(null);
  const uploadMu = useMutation({
    mutationFn: (f: File) => uploadReceiveStampImage(token, f),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receive-stamp", auth.userId] });
      toast.success("Stamp artwork uploaded.");
    },
    onError: (e) =>
      toast.error(describeApiError(e, "Could not upload that image.")),
  });

  const saveMu = useMutation({
    mutationFn: () => saveReceiveStamp(token, draft),
    onSuccess: () => {
      setSavedFp(fp(draft));
      qc.invalidateQueries({ queryKey: ["receive-stamp", auth.userId] });
      refreshPreview();
      toast.success("Saved.");
    },
    onError: (e) => toast.error(describeApiError(e, "Could not save.")),
  });

  const removeMu = useMutation({
    mutationFn: () => deleteReceiveStamp(token),
    onSuccess: () => {
      hydrated.current = false;
      setDraft(DEFAULTS);
      setSavedFp(null);
      qc.invalidateQueries({ queryKey: ["receive-stamp", auth.userId] });
      toast.success("Stamp removed.");
    },
    onError: (e) => toast.error(describeApiError(e, "Could not remove it.")),
  });

  // ── the finished preview, rendered by the server ────────────────────
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const refreshPreview = useCallback(() => {
    if (!hasArtwork) return;
    setPreviewing(true);
    receiveStampPreview(token, 900)
      .then((b) => {
        setPreviewUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return URL.createObjectURL(b);
        });
      })
      .catch(() => undefined)
      .finally(() => setPreviewing(false));
  }, [hasArtwork, token]);

  useEffect(() => {
    if (hasArtwork) refreshPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasArtwork]);

  // ── dragging on the canvas ──────────────────────────────────────────
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasH, setCanvasH] = useState(0);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCanvasH(el.clientHeight));
    ro.observe(el);
    setCanvasH(el.clientHeight);
    return () => ro.disconnect();
  }, [artUrl]);

  /** Points to on-screen pixels, so type is shown at its true size. */
  const pxPerPt = canvasH > 0 ? canvasH / STAMP_H_PT : 0;

  const startDrag = (which: Handle, mode: "move" | "resize") =>
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const wrap = canvasRef.current;
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const from = { ...draft };

      const move = (ev: PointerEvent) => {
        const dx = ((ev.clientX - startX) / r.width) * BP;
        const dy = ((ev.clientY - startY) / r.height) * BP;
        setDraft((d) => {
          const clamp = (v: number) => Math.max(0, Math.min(BP, Math.round(v)));
          if (which === "sig" && mode === "resize") {
            return {
              ...d,
              sigW: Math.max(200, Math.min(BP - from.sigX, Math.round(from.sigW + dx))),
              sigH: Math.max(150, Math.min(BP - from.sigY, Math.round(from.sigH + dy))),
            };
          }
          if (which === "sig") {
            return {
              ...d,
              sigX: Math.max(0, Math.min(BP - d.sigW, Math.round(from.sigX + dx))),
              sigY: Math.max(0, Math.min(BP - d.sigH, Math.round(from.sigY + dy))),
            };
          }
          if (which === "name") {
            return { ...d, nameX: clamp(from.nameX + dx), nameY: clamp(from.nameY + dy) };
          }
          return { ...d, dateX: clamp(from.dateX + dx), dateY: clamp(from.dateY + dy) };
        });
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };

  const pct = (bp: number) => `${(bp / BP) * 100}%`;

  const dateText = useMemo(todayText, []);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <main className="w-full h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-3 py-2 border-b bg-white flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center">
          <Stamp className="h-3.5 w-3.5 text-blue-600" />
        </div>
        <div className="leading-tight min-w-0">
          <div className="text-xs font-semibold text-gray-900">
            Manage Receive Stamp
          </div>
          <div className="text-[10px] text-gray-500">
            Your office's own stamp, with the date, your name and your
            signature filled in automatically
          </div>
        </div>
        <Badge variant="outline" className="ml-auto text-[10px] h-6 px-2">
          {data?.stampSize.widthMm ?? 58}mm × {data?.stampSize.heightMm ?? 30}mm
        </Badge>
        <Button
          size="sm"
          variant={dirty ? "default" : "outline"}
          className="h-7 text-xs"
          disabled={!hasArtwork || saveMu.isPending || !dirty}
          onClick={() => saveMu.mutate()}
          title={dirty ? "Save this layout" : "Everything is already saved"}
        >
          {saveMu.isPending ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : dirty ? (
            <Save className="h-3.5 w-3.5 mr-1" />
          ) : (
            <Check className="h-3.5 w-3.5 mr-1" />
          )}
          {saveMu.isPending ? "Saving…" : dirty ? "Save layout" : "Saved"}
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="mx-auto max-w-5xl space-y-4">
          {/* No signature on file — say so before anything else, because the
              stamp cannot be completed without one. */}
          {!hasSignature ? (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-[11px] text-amber-900 leading-relaxed">
                <span className="font-semibold">
                  You have no active signature on file.
                </span>{" "}
                The stamp carries the same signature your documents are signed
                with, so set one up in Signature Management first — a receiving
                stamp signed by a different hand than the signature on record
                is worse than no stamp at all. You can still place everything
                here; the signature area will simply print empty until then.
              </div>
            </div>
          ) : null}

          {/* ── The artwork ───────────────────────────────────────────── */}
          {!hasArtwork ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
              }}
              className="w-full border-2 border-dashed border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors p-8 flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              <div className="p-2.5 bg-blue-50 rounded-full">
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-gray-800">
                Upload your receiving stamp
              </p>
              <p className="text-[11px] text-gray-500 text-center max-w-md leading-relaxed">
                A PNG of your office's own stamp — the box with RECEIVED, the
                office name, and the empty DATE and BY lines.{" "}
                <span className="font-medium text-gray-700">
                  58mm × 30mm
                </span>
                , with a transparent background so it inks over the page
                instead of covering it.
              </p>
              {uploadMu.isPending ? (
                <span className="text-[11px] text-blue-600 flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                </span>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
              {/* ── The canvas ──────────────────────────────────────── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500">
                    Drag each piece to where it belongs on your stamp
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1.5 text-[10px]"
                    onClick={() => fileRef.current?.click()}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> Replace artwork
                  </Button>
                </div>

                <div
                  ref={canvasRef}
                  className="relative w-full select-none rounded-md border-2 border-dashed border-gray-300 bg-white overflow-hidden"
                  style={{
                    aspectRatio: `${STAMP_W_PT} / ${STAMP_H_PT}`,
                    touchAction: "none",
                  }}
                >
                  {artUrl ? (
                    <img
                      src={artUrl}
                      alt="Your receiving stamp"
                      className="absolute inset-0 h-full w-full object-fill pointer-events-none"
                    />
                  ) : null}

                  {/* Date — filled in automatically when the stamp is used */}
                  <div
                    onPointerDown={startDrag("date", "move")}
                    className="absolute cursor-move whitespace-nowrap rounded-sm bg-amber-100/60 outline outline-1 outline-amber-400 px-0.5"
                    style={{
                      left: pct(draft.dateX),
                      top: pct(draft.dateY),
                      fontSize: Math.max(6, draft.dateSizePt * pxPerPt),
                      lineHeight: 1.1,
                    }}
                    title="The date, filled in automatically"
                  >
                    {dateText}
                  </div>

                  {/* Name / nickname */}
                  <div
                    onPointerDown={startDrag("name", "move")}
                    className="absolute cursor-move whitespace-nowrap rounded-sm bg-sky-100/60 outline outline-1 outline-sky-400 px-0.5"
                    style={{
                      left: pct(draft.nameX),
                      top: pct(draft.nameY),
                      fontSize: Math.max(6, draft.nameSizePt * pxPerPt),
                      lineHeight: 1.1,
                    }}
                    title="Your name, as it prints on the BY line"
                  >
                    {draft.nickname || "YOUR NAME"}
                  </div>

                  {/* Signature area */}
                  <div
                    onPointerDown={startDrag("sig", "move")}
                    className="absolute cursor-move rounded-sm bg-emerald-100/40 outline outline-1 outline-emerald-500"
                    style={{
                      left: pct(draft.sigX),
                      top: pct(draft.sigY),
                      width: pct(draft.sigW),
                      height: pct(draft.sigH),
                    }}
                    title="Where your signature prints"
                  >
                    <span className="absolute -top-4 left-0 text-[9px] font-semibold text-emerald-700">
                      Signature
                    </span>
                    <span
                      onPointerDown={startDrag("sig", "resize")}
                      className="absolute -right-1 -bottom-1 h-3 w-3 rounded-sm bg-emerald-600 cursor-nwse-resize"
                      style={{ touchAction: "none" }}
                    />
                  </div>
                </div>

                <p className="text-[10px] text-gray-500 leading-relaxed">
                  The green box is where your signature prints — it keeps its
                  own proportions inside whatever box you draw, so it is never
                  stretched. The amber and blue labels show the date and your
                  name at their real printed size.
                </p>
              </div>

              {/* ── The controls ────────────────────────────────────── */}
              <div className="space-y-3">
                <div className="rounded-md border bg-white p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Type className="h-3 w-3 text-sky-600" />
                    <span className="text-[11px] font-semibold text-gray-800">
                      Name on the BY line
                    </span>
                  </div>
                  <Input
                    value={draft.nickname}
                    maxLength={40}
                    placeholder="e.g. JUDE"
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, nickname: e.target.value }))
                    }
                    className="h-8 text-xs"
                  />
                  <label className="block">
                    <span className="text-[10px] text-gray-600">
                      Font size — {draft.nameSizePt}pt
                    </span>
                    <input
                      type="range"
                      min={4}
                      max={24}
                      step={0.5}
                      value={draft.nameSizePt}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          nameSizePt: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-sky-600"
                    />
                  </label>
                  <p className="text-[10px] text-gray-500">
                    A nickname is fine — it is how colleagues recognise who
                    took delivery.
                  </p>
                </div>

                <div className="rounded-md border bg-white p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3 w-3 text-amber-600" />
                    <span className="text-[11px] font-semibold text-gray-800">
                      Date
                    </span>
                  </div>
                  <label className="block">
                    <span className="text-[10px] text-gray-600">
                      Font size — {draft.dateSizePt}pt
                    </span>
                    <input
                      type="range"
                      min={4}
                      max={24}
                      step={0.5}
                      value={draft.dateSizePt}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          dateSizePt: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-amber-600"
                    />
                  </label>
                  <p className="text-[10px] text-gray-500">
                    Filled in automatically with the day the document is
                    received. Nobody types it.
                  </p>
                </div>

                <div className="rounded-md border bg-white p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <PenLine className="h-3 w-3 text-emerald-600" />
                    <span className="text-[11px] font-semibold text-gray-800">
                      Signature
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    {hasSignature ? (
                      <>
                        Using{" "}
                        <span className="font-medium text-gray-700">
                          {data?.signature?.title}
                        </span>{" "}
                        — your active signature. Change it in Signature
                        Management and the stamp follows.
                      </>
                    ) : (
                      "No active signature yet. Set one up in Signature Management."
                    )}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Drag the green box to move it, the corner to resize.
                  </p>
                </div>

                {/* The real thing, composed by the server */}
                <div className="rounded-md border bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-800">
                      As it will print
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1.5 text-[10px]"
                      onClick={refreshPreview}
                      disabled={previewing}
                    >
                      {previewing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Your stamp, as it will print"
                      className="w-full rounded border"
                    />
                  ) : (
                    <div className="h-16 flex items-center justify-center text-[10px] text-gray-400">
                      Save the layout to see it
                    </div>
                  )}
                  <p className="text-[10px] text-gray-500">
                    Rendered by the same code that prints it, so this is the
                    stamp — not an approximation of it.
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-[10px] text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    if (confirm("Remove this stamp and start again?")) {
                      removeMu.mutate();
                    }
                  }}
                  disabled={removeMu.isPending}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Remove stamp
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,.png"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadMu.mutate(f);
          if (fileRef.current) fileRef.current.value = "";
        }}
      />
    </main>
  );
};

export default ManageReceiveStamp;
