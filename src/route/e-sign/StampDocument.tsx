/**
 * Stamp a document you received.
 *
 * Pick the page, drag your receiving stamp to where you want it, save. The
 * stored file is never rewritten: a document may carry a seal over a hash of
 * its bytes, and changing those bytes would invalidate the very thing the
 * document is evidence of. What is saved is the position; the office's copy
 * is composed on download, so the original stays exactly as it arrived.
 *
 * The stamp is shown at its TRUE physical size — the stamp's millimetres
 * converted to points, divided by the page's own points. A rubber stamp does
 * not shrink to fit the space, which is what measuring it in millimetres was
 * for, so what is dragged here is the size that lands on paper.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { toast } from "sonner";

import { useAuth } from "@/provider/ProtectedRoute";
import { useRoom } from "@/provider/DocumentRoomProvider";
import { fetchDocumentFile } from "@/db/statements/document";
import {
  applyReceiveStamp,
  myReceiveStamp,
  receiveStampMarks,
  receiveStampPreview,
  removeReceiveStampMark,
  stampedDocument,
} from "@/db/statements/receiveStamp";
import { describeApiError } from "@/utils/apiError";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Stamp,
  Loader2,
  Download,
  Trash2,
  AlertCircle,
  Save,
  Check,
  Ruler,
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker as string;

const BP = 10000;
/** Millimetres to PDF points — the same conversion the server prints with. */
const mmToPt = (mm: number) => (mm / 25.4) * 72;
/** Wide enough to aim on, narrow enough to render quickly. */
const PAGE_W = 820;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const StampDocument = () => {
  const auth = useAuth();
  const token = auth.token as string;
  const nav = useNavigate();
  const qc = useQueryClient();
  const { lineId, documentId } = useParams();
  /*
    Which office is taking delivery. The stamp is the room's, so a person in
    two offices stamps as whichever one the module is currently showing —
    the same room the inbox they opened this from is scoped to.
  */
  const { room } = useRoom();
  const roomId = room?.id;
  const [search] = useSearchParams();
  const docName = search.get("name") || "document";

  const [pageNo, setPageNo] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const { data: setup, isLoading: loadingSetup } = useQuery({
    queryKey: ["receive-stamp", roomId],
    queryFn: () => myReceiveStamp(token, roomId),
    enabled: !!token && !!roomId,
  });

  const { data: marks } = useQuery({
    queryKey: ["receive-stamp-marks", documentId],
    queryFn: () => receiveStampMarks(token, documentId as string),
    enabled: !!token && !!documentId,
  });

  /*
    Load my existing stamp once, so re-opening shows where it already is
    instead of an empty page that looks unstamped. Once only: a later
    refetch must not drag the box out from under the cursor — the trap the
    placement editor fell into.
  */
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current || !marks) return;
    if (marks.mine) {
      setPageNo(marks.mine.page);
      setPos({ x: marks.mine.xBp, y: marks.mine.yBp });
      setSavedAt(`${marks.mine.page}:${marks.mine.xBp}:${marks.mine.yBp}`);
    }
    hydrated.current = true;
  }, [marks]);

  const hasArtwork = !!setup?.stamp?.hasImage;
  const hasSignature = !!setup?.signature?.hasImage;
  const widthMm = setup?.stampSize?.widthMm ?? 58;
  const heightMm = setup?.stampSize?.heightMm ?? 30;

  // ── The document ────────────────────────────────────────────────────
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfErr, setPdfErr] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    let revoke: string | null = null;
    setPdfUrl(null);
    setPdfErr(null);
    fetchDocumentFile(token, documentId as string)
      .then((blob) => {
        if (cancelled) return;
        const u = URL.createObjectURL(blob);
        revoke = u;
        setPdfUrl(u);
      })
      .catch((e) => {
        if (!cancelled) setPdfErr(describeApiError(e, "Could not open it."));
      });
    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [token, documentId]);

  // ── The stamp, composed the way it will print ───────────────────────
  const [stampUrl, setStampUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!hasArtwork) return;
    let cancelled = false;
    let revoke: string | null = null;
    receiveStampPreview(token, 600, roomId)
      .then((b) => {
        if (cancelled) return;
        const u = URL.createObjectURL(b);
        revoke = u;
        setStampUrl(u);
      })
      // No signature set up yet — the outline still drags and still saves.
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [hasArtwork, token, roomId]);

  /**
   * The rendered page, and what one PDF point is worth on screen.
   *
   * react-pdf hands back the page's own size in points, so the stamp can be
   * drawn at exactly the fraction of the page the server will print it at,
   * whatever paper the document happens to be.
   */
  const [box, setBox] = useState({ w: 0, h: 0, pxPerPt: 0 });
  const stampW = box.pxPerPt > 0 ? mmToPt(widthMm) * box.pxPerPt : 0;
  const stampH = box.pxPerPt > 0 ? mmToPt(heightMm) * box.pxPerPt : 0;

  /** Basis points the stamp may start at and still fit on the page. */
  const maxXBp = box.w > 0 ? ((box.w - stampW) / box.w) * BP : BP;
  const maxYBp = box.h > 0 ? ((box.h - stampH) / box.h) * BP : BP;

  const wrapRef = useRef<HTMLDivElement>(null);
  /** Where in the stamp it was grabbed, so it doesn't jump to the cursor. */
  const grab = useRef({ dx: 0, dy: 0 });

  const put = (clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el || box.w === 0) return;
    const r = el.getBoundingClientRect();
    const left = clientX - r.left - grab.current.dx;
    const top = clientY - r.top - grab.current.dy;
    setPos({
      x: Math.round(clamp((left / r.width) * BP, 0, maxXBp)),
      y: Math.round(clamp((top / r.height) * BP, 0, maxYBp)),
    });
  };

  const drag = (e: React.PointerEvent) => {
    e.preventDefault();
    const move = (ev: PointerEvent) => put(ev.clientX, ev.clientY);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  /** Clicking bare page drops the stamp centred on the click. */
  const dropHere = (e: React.PointerEvent) => {
    grab.current = { dx: stampW / 2, dy: stampH / 2 };
    put(e.clientX, e.clientY);
    drag(e);
  };

  const dirty = !!pos && `${pageNo}:${pos.x}:${pos.y}` !== (savedAt ?? "");
  const othersHere = useMemo(
    () =>
      (marks?.marks ?? []).filter(
        (m) => m.page === pageNo && m.userId !== auth.userId,
      ),
    [marks, pageNo, auth.userId],
  );

  const applyMu = useMutation({
    mutationFn: () =>
      applyReceiveStamp(token, {
        documentId: documentId as string,
        page: pageNo,
        xBp: pos?.x ?? 0,
        yBp: pos?.y ?? 0,
        roomId,
      }),
    onSuccess: () => {
      setSavedAt(`${pageNo}:${pos?.x}:${pos?.y}`);
      qc.invalidateQueries({ queryKey: ["receive-stamp-marks", documentId] });
      toast.success("Stamped.", {
        description:
          "The file itself is untouched — your copy is composed when you download it.",
      });
    },
    onError: (e) => toast.error(describeApiError(e, "Could not stamp it.")),
  });

  const removeMu = useMutation({
    mutationFn: () => removeReceiveStampMark(token, documentId as string),
    onSuccess: () => {
      setPos(null);
      setSavedAt(null);
      qc.invalidateQueries({ queryKey: ["receive-stamp-marks", documentId] });
      toast.success("Your stamp was removed.");
    },
    onError: (e) => toast.error(describeApiError(e, "Could not remove it.")),
  });

  const [downloading, setDownloading] = useState(false);
  const download = async () => {
    setDownloading(true);
    try {
      const blob = await stampedDocument(token, documentId as string);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docName.replace(/\.pdf$/i, "")} (stamped).pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(describeApiError(e, "Could not build the stamped copy."));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="w-full h-full flex flex-col bg-gray-50 min-h-0">
      {/* ── Bar ────────────────────────────────────────────────────── */}
      <div className="px-3 py-2 border-b bg-white flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => nav(-1)}
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
        </Button>
        <div className="leading-tight min-w-0">
          <div className="text-xs font-semibold text-gray-900 truncate">
            Stamp received — {docName}
          </div>
          <div className="text-[10px] text-gray-500">
            Pick the page, then click or drag your stamp into place
          </div>
        </div>
        <Badge
          variant="outline"
          className="ml-auto text-[10px] h-6 px-2 gap-1 shrink-0"
        >
          <Ruler className="h-3 w-3" />
          {widthMm}mm × {heightMm}mm
        </Badge>
        {savedAt ? (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs shrink-0"
              onClick={download}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-1" />
              )}
              Stamped copy
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => removeMu.mutate()}
              disabled={removeMu.isPending}
              title="Take my stamp off this document"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : null}
        <Button
          size="sm"
          variant={dirty ? "default" : "outline"}
          className="h-7 text-xs shrink-0"
          disabled={!hasArtwork || !pos || applyMu.isPending || !dirty}
          onClick={() => applyMu.mutate()}
        >
          {applyMu.isPending ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : dirty ? (
            <Save className="h-3.5 w-3.5 mr-1" />
          ) : (
            <Check className="h-3.5 w-3.5 mr-1" />
          )}
          {dirty ? "Save stamp" : savedAt ? "Saved" : "Place it first"}
        </Button>
      </div>

      {loadingSetup ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-500">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading your stamp…
        </div>
      ) : !hasArtwork ? (
        /* Nothing to stamp with — say so, and point at the one screen that
           fixes it rather than showing a page with no stamp on it. */
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-sm font-semibold text-gray-800">
              This office has no receiving stamp yet
            </p>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Somebody has to set it up once: state its size in millimetres,
              upload the office's stamp artwork, and drag the date, the name
              and the signature onto it. Anyone in
              {room?.code ? ` ${room.code}` : " the office"} can do it, and it
              then works for everybody — you would only add your own name.
            </p>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => nav(`/${lineId}/documents/receive-stamp`)}
            >
              <Stamp className="h-3.5 w-3.5 mr-1" /> Manage Receive Stamp
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex">
          {/* ── Pages ──────────────────────────────────────────────── */}
          <aside className="w-[86px] border-r bg-white overflow-y-auto shrink-0">
            <div className="px-2 py-1.5 border-b bg-gray-50 text-[10px] font-semibold uppercase tracking-wide text-gray-600 sticky top-0">
              Page
            </div>
            <div className="p-1.5 space-y-1">
              {numPages === 0 ? (
                <div className="text-[10px] text-gray-400 px-1 py-2">…</div>
              ) : null}
              {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => {
                const stamped = (marks?.marks ?? []).some((m) => m.page === n);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPageNo(n)}
                    className={`w-full h-9 rounded-md border text-xs flex items-center justify-center gap-1 ${
                      n === pageNo
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {n}
                    {stamped ? (
                      <Stamp className="h-3 w-3 text-emerald-600" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── The page ───────────────────────────────────────────── */}
          <section className="flex-1 min-h-0 overflow-auto bg-gray-100 p-4">
            {pdfErr ? (
              <p className="text-xs text-rose-600">{pdfErr}</p>
            ) : !pdfUrl ? (
              <div className="h-40 flex items-center justify-center text-xs text-gray-500">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading
                document…
              </div>
            ) : (
              <Document
                file={pdfUrl}
                onLoadSuccess={(p) => setNumPages(p.numPages)}
                loading={
                  <div className="p-6 text-xs text-gray-500">
                    Rendering PDF…
                  </div>
                }
                error={
                  <div className="p-6 text-xs text-rose-600">
                    Failed to render PDF.
                  </div>
                }
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    ref={wrapRef}
                    className="relative bg-white shadow-sm border select-none"
                    style={{ width: "fit-content", touchAction: "none" }}
                    onPointerDown={dropHere}
                  >
                    <Page
                      key={pageNo}
                      pageNumber={pageNo}
                      width={PAGE_W}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      onLoadSuccess={(p) => {
                        // originalWidth is the page in POINTS; width is what
                        // is on screen. Their ratio sizes the stamp exactly.
                        const ow = (p as unknown as { originalWidth: number })
                          .originalWidth;
                        setBox({
                          w: p.width,
                          h: p.height,
                          pxPerPt: ow > 0 ? p.width / ow : 0,
                        });
                      }}
                    />

                    {/* Somebody else's stamp — visible so you don't cover it. */}
                    {othersHere.map((m) => (
                      <div
                        key={m.id}
                        className="absolute pointer-events-none rounded-sm border-2 border-dashed border-gray-400/70 bg-gray-400/10"
                        style={{
                          left: (m.xBp / BP) * box.w,
                          top: (m.yBp / BP) * box.h,
                          width: stampW,
                          height: stampH,
                        }}
                        title={`Stamped by ${
                          `${m.user?.firstName ?? ""} ${
                            m.user?.lastName ?? ""
                          }`.trim() || "somebody else"
                        }${m.room?.code ? ` (${m.room.code})` : ""}`}
                      />
                    ))}

                    {/* Mine. */}
                    {pos && box.w > 0 ? (
                      <div
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          const r = (
                            e.currentTarget as HTMLElement
                          ).getBoundingClientRect();
                          grab.current = {
                            dx: e.clientX - r.left,
                            dy: e.clientY - r.top,
                          };
                          drag(e);
                        }}
                        className="absolute rounded-sm outline outline-2 outline-emerald-500/80 cursor-move"
                        style={{
                          left: (pos.x / BP) * box.w,
                          top: (pos.y / BP) * box.h,
                          width: stampW,
                          height: stampH,
                          backgroundImage: stampUrl
                            ? `url(${stampUrl})`
                            : undefined,
                          backgroundSize: "100% 100%",
                          backgroundColor: stampUrl
                            ? "rgba(255,255,255,0.65)"
                            : "rgba(16,185,129,0.15)",
                        }}
                        title="Drag to move"
                      >
                        {!stampUrl ? (
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-emerald-700 text-center px-1">
                            Your stamp
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <p className="text-[10px] text-gray-500 leading-relaxed max-w-[820px]">
                    Click the page to drop your stamp there, then drag it to
                    adjust. It is shown at its real size — {widthMm}mm ×{" "}
                    {heightMm}mm — so it lands on paper exactly as big as your
                    rubber stamp is. The document itself is never altered: your
                    stamped copy is composed when you download it, which is
                    what keeps the signatures on it valid.
                    {!hasSignature ? (
                      <>
                        {" "}
                        <span className="text-amber-700 font-medium">
                          You have no active signature, so the stamp will print
                          with the date and your name but no signature.
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
              </Document>
            )}
          </section>
        </div>
      )}
    </main>
  );
};

export default StampDocument;
