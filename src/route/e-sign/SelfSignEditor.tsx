import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
//
import { useAuth } from "@/provider/ProtectedRoute";
import {
  archiveSelfSignDoc,
  fetchDocumentFile,
  fetchSignedDocument,
  getSelfSignDetail,
  saveSelfSignPlacements,
  signSelfSignAll,
  unsignSelfSign,
  usersSignature,
} from "@/db/statements/document";
import { useGeo } from "@/provider/GeoProvider";
//
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/custom/Modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  Save,
  Trash2,
  PenLine,
  Download,
  Archive as ArchiveIcon,
  Square,
  MousePointer2,
  CheckCircle2,
  AlertTriangle,
  Undo2,
} from "lucide-react";

// pdf.js worker — same as the other PDF tools.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker as string;

type Box = {
  key: string;
  page: number;
  xAxis: number; // basis points
  yAxis: number;
  width: number;
  height: number;
};

const MIN_BP = 100;
const uid = () => Math.random().toString(36).slice(2);
const surfaceErr = (err: unknown, fallback = "Something went wrong") => {
  const e = err as any;
  return e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback;
};

const SelfSignEditor = () => {
  const { docId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const geo = useGeo();

  const { data, isLoading } = useQuery({
    queryKey: ["self-sign", "detail", docId],
    queryFn: () =>
      getSelfSignDetail(
        auth.token as string,
        docId as string,
        auth.userId as string,
      ),
    enabled: !!auth.token && !!docId,
    refetchOnMount: "always",
  });

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [tool, setTool] = useState<"select" | "draw">("draw");
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [undoOpen, setUndoOpen] = useState(false);
  // Which signature stamps the doc — "active" = the default/active one.
  const [selectedSigId, setSelectedSigId] = useState<string>("active");

  // The caller's signatures, for the picker in the sign-confirm modal.
  const { data: sigList } = useQuery({
    queryKey: ["user-signature", auth.userId, "self-sign-picker"],
    queryFn: () =>
      usersSignature(
        auth.token as string,
        auth.userId as string,
        null,
        "50",
        "",
      ),
    enabled: !!auth.token && !!auth.userId,
  });

  // Hydrate boxes from server when detail loads.
  useEffect(() => {
    if (!data) return;
    const next: Box[] = [];
    for (const p of data.document.pages) {
      for (const c of p.signCoor) {
        next.push({
          key: c.id,
          page: p.page,
          xAxis: c.xAxis,
          yAxis: c.yAxis,
          width: c.width,
          height: c.height,
        });
      }
    }
    setBoxes(next);
  }, [data]);

  // Fetch PDF bytes for the viewer.
  useEffect(() => {
    let cancelled = false;
    let revoke: string | null = null;
    setPdfUrl(null);
    if (!docId) return;
    fetchDocumentFile(auth.token as string, docId)
      .then((blob) => {
        if (cancelled) return;
        const u = URL.createObjectURL(blob);
        revoke = u;
        setPdfUrl(u);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [docId, auth.token]);

  // Auto-save placements 700ms after the last change.
  const saveMu = useMutation({
    mutationFn: () =>
      saveSelfSignPlacements(auth.token as string, {
        documentId: docId as string,
        arrangementId: data?.arrangement?.id as string,
        userId: auth.userId as string,
        placements: boxes.map((b) => ({
          page: b.page,
          xAxis: b.xAxis,
          yAxis: b.yAxis,
          width: b.width,
          height: b.height,
        })),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["self-sign", "detail", docId] }),
    onError: (e) =>
      console.error("[SelfSign] auto-save failed:", surfaceErr(e)),
  });

  const skipFirst = useRef(true);
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (!data?.arrangement?.id) return;
    if (data.arrangement.status === 1) return; // frozen after sign
    const t = setTimeout(() => saveMu.mutate(), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxes, data?.arrangement?.id, data?.arrangement?.status]);

  const signMu = useMutation({
    mutationFn: async () => {
      const fix = await geo.captureForSign();
      return signSelfSignAll(auth.token as string, {
        arrangementId: data?.arrangement?.id as string,
        userId: auth.userId as string,
        // "active" sentinel = let the backend use the default/active one.
        signatureId: selectedSigId === "active" ? undefined : selectedSigId,
        geo: fix
          ? { lat: fix.lat, lng: fix.lng, accuracy: fix.accuracy }
          : null,
      });
    },
    onSuccess: () => {
      setConfirmOpen(false);
      qc.invalidateQueries({ queryKey: ["self-sign", "detail", docId] });
      qc.invalidateQueries({ queryKey: ["self-sign", "list"] });
    },
    onError: (e) => alert(surfaceErr(e)),
  });

  const unsignMu = useMutation({
    mutationFn: () =>
      unsignSelfSign(auth.token as string, {
        arrangementId: data?.arrangement?.id as string,
        userId: auth.userId as string,
      }),
    onSuccess: () => {
      setUndoOpen(false);
      qc.invalidateQueries({ queryKey: ["self-sign", "detail", docId] });
      qc.invalidateQueries({ queryKey: ["self-sign", "list"] });
    },
    onError: (e) => alert(surfaceErr(e)),
  });

  const archiveMu = useMutation({
    mutationFn: () =>
      archiveSelfSignDoc(auth.token as string, {
        documentId: docId as string,
        userId: auth.userId as string,
      }),
    onSuccess: (r) => {
      alert(r.existed ? "Already archived." : "Archived to room.");
      qc.invalidateQueries({ queryKey: ["self-sign", "detail", docId] });
      qc.invalidateQueries({ queryKey: ["self-sign", "list"] });
    },
    onError: (e) => alert(surfaceErr(e)),
  });

  const handleDownload = async () => {
    if (!data) return;
    try {
      const signed = data.arrangement?.status === 1;
      const blob = signed
        ? await fetchSignedDocument(auth.token as string, docId as string)
        : await fetchDocumentFile(auth.token as string, docId as string);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const base = (data.document.title || data.document.file?.fileName || "document").replace(/\.pdf$/i, "");
      a.download = signed ? `${base}-signed.pdf` : `${base}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(surfaceErr(e));
    }
  };

  // ── Per-page placement helpers ──────────────────────────────────────
  const boxesByPage = useMemo(() => {
    const m = new Map<number, Box[]>();
    for (const b of boxes) {
      const arr = m.get(b.page) ?? [];
      arr.push(b);
      m.set(b.page, arr);
    }
    return m;
  }, [boxes]);

  const upsertBox = (b: Box) =>
    setBoxes((prev) => {
      const i = prev.findIndex((x) => x.key === b.key);
      if (i === -1) return [...prev, b];
      const next = [...prev];
      next[i] = b;
      return next;
    });
  const removeBox = (key: string) =>
    setBoxes((prev) => prev.filter((b) => b.key !== key));

  if (isLoading || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  const isSigned = data.arrangement?.status === 1;
  const isFrozen = isSigned;

  return (
    <main className="w-full h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-3 py-2 border-b bg-white flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => nav("..")}
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
        </Button>
        <div className="leading-tight min-w-0">
          <div className="text-xs font-semibold text-gray-900 truncate">
            {data.document.title || "(untitled)"}
          </div>
          <div className="text-[10px] text-gray-500">
            {isSigned ? (
              <>
                Signed{" "}
                {data.arrangement?.signedAt
                  ? new Date(data.arrangement.signedAt).toLocaleString()
                  : ""}
              </>
            ) : (
              <>
                Draft · {boxes.length} signature box{boxes.length === 1 ? "" : "es"} drawn
              </>
            )}
          </div>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] h-6 px-2 ${
            isSigned
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {isSigned ? "Signed" : "Draft"}
        </Badge>
        <div className="flex items-center bg-gray-100 rounded-md p-0.5 ml-2">
          <button
            type="button"
            disabled={isFrozen}
            className={`h-6 px-2 rounded text-[10px] flex items-center gap-1 ${
              tool === "select"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-600"
            } ${isFrozen ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => setTool("select")}
          >
            <MousePointer2 className="h-3 w-3" /> Select
          </button>
          <button
            type="button"
            disabled={isFrozen}
            className={`h-6 px-2 rounded text-[10px] flex items-center gap-1 ${
              tool === "draw"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-600"
            } ${isFrozen ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => setTool("draw")}
          >
            <Square className="h-3 w-3" /> Draw
          </button>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {isSigned ? null : (
            <span className="text-[10px] text-gray-500">
              {saveMu.isPending ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Save className="h-3 w-3" /> Auto-saved
                </span>
              )}
            </span>
          )}
          {!isSigned && (
            <Select value={selectedSigId} onValueChange={setSelectedSigId}>
              <SelectTrigger
                className="h-7 w-48 text-[11px]"
                title="Which signature will be stamped when you sign"
              >
                <SelectValue placeholder="Active signature (default)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active" className="text-xs">
                  Active signature (default)
                </SelectItem>
                {(sigList?.list ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.title}
                    {s.active ? " — active" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleDownload}
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            {isSigned ? "Download signed" : "Download"}
          </Button>
          {isSigned ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                onClick={() => setUndoOpen(true)}
                disabled={unsignMu.isPending}
              >
                {unsignMu.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Undo2 className="h-3.5 w-3.5 mr-1" />
                )}
                Undo sign
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => archiveMu.mutate()}
                disabled={archiveMu.isPending}
              >
                {archiveMu.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <ArchiveIcon className="h-3.5 w-3.5 mr-1" />
                )}
                Archive to room
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => setConfirmOpen(true)}
              disabled={boxes.length === 0 || signMu.isPending}
              title={
                boxes.length === 0
                  ? "Draw at least one signature box first."
                  : ""
              }
            >
              {signMu.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <PenLine className="h-3.5 w-3.5 mr-1" />
              )}
              Sign all fields ({boxes.length})
            </Button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <section className="flex-1 min-h-0 overflow-auto bg-gray-100 p-4">
        {!pdfUrl ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-500">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Opening PDF...
          </div>
        ) : (
          <Document
            file={pdfUrl}
            onLoadSuccess={(p) => setNumPages(p.numPages)}
            loading={
              <div className="p-6 text-xs text-gray-500">Rendering PDF...</div>
            }
            error={
              <div className="p-6 text-xs text-rose-600">
                Failed to render PDF.
              </div>
            }
          >
            <div className="flex flex-col items-center gap-4">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pn) => (
                <PageCanvas
                  key={pn}
                  pageNumber={pn}
                  tool={tool}
                  frozen={isFrozen}
                  boxes={boxesByPage.get(pn) ?? []}
                  signatureDataUrl={data.signatureDataUrl}
                  signedAt={data.arrangement?.signedAt ?? null}
                  onCreate={(rect) =>
                    upsertBox({ key: uid(), page: pn, ...rect })
                  }
                  onUpdate={upsertBox}
                  onRemove={removeBox}
                />
              ))}
            </div>
          </Document>
        )}
      </section>

      {/* Confirm sign */}
      <Modal
        title="Sign all signature boxes?"
        onOpen={confirmOpen}
        setOnOpen={() => setConfirmOpen(false)}
        footer={true}
        yesTitle="Sign now"
        loading={signMu.isPending}
        onFunction={() => signMu.mutate()}
        className=""
      >
        <div className="space-y-2 text-xs text-gray-700">
          <div className="flex items-start gap-2 px-2 py-1.5 rounded border border-amber-200 bg-amber-50 text-[11px]">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              The selected e-signature will be stamped into every signature
              box you've drawn. Boxes are frozen while the document is
              signed — use "Undo sign" later if you need to edit them again.
            </div>
          </div>

          {/* Signature picker — defaults to the active signature. */}
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-gray-800">
              Signature to use
            </div>
            <Select value={selectedSigId} onValueChange={setSelectedSigId}>
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue placeholder="Active signature (default)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active" className="text-xs">
                  Active signature (default)
                </SelectItem>
                {(sigList?.list ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.title}
                    {s.active ? " — active" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(() => {
              const chosen =
                selectedSigId === "active"
                  ? (sigList?.list ?? []).find((s) => s.active) ?? null
                  : (sigList?.list ?? []).find((s) => s.id === selectedSigId) ??
                    null;
              return chosen?.preview ? (
                <div className="border rounded bg-gray-50 p-1.5 flex items-center justify-center">
                  <img
                    src={chosen.preview}
                    alt={chosen.title}
                    className="max-h-12 object-contain"
                  />
                </div>
              ) : null;
            })()}
          </div>

          <div className="text-[11px]">
            <span className="font-semibold">{boxes.length}</span> field{boxes.length === 1 ? "" : "s"} will be signed.
          </div>
        </div>
      </Modal>

      <Modal
        title="Undo your signature?"
        onOpen={undoOpen}
        setOnOpen={() => setUndoOpen(false)}
        footer={true}
        yesTitle="Undo sign"
        loading={unsignMu.isPending}
        onFunction={() => unsignMu.mutate()}
        className=""
      >
        <div className="space-y-2 text-xs text-gray-700">
          <div className="flex items-start gap-2 px-2 py-1.5 rounded border border-amber-200 bg-amber-50 text-[11px]">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              The document goes back to <span className="font-semibold">Draft</span> —
              the signature stamp is removed, boxes become editable again, and
              you can re-sign anytime. The signed date and location record will
              be cleared.
            </div>
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default SelfSignEditor;

// ─── Per-page canvas ──────────────────────────────────────────────────
const PageCanvas = ({
  pageNumber,
  tool,
  frozen,
  boxes,
  signatureDataUrl,
  signedAt,
  onCreate,
  onUpdate,
  onRemove,
}: {
  pageNumber: number;
  tool: "select" | "draw";
  frozen: boolean;
  boxes: Box[];
  signatureDataUrl: string | null;
  signedAt: string | null;
  onCreate: (rect: {
    xAxis: number;
    yAxis: number;
    width: number;
    height: number;
  }) => void;
  onUpdate: (b: Box) => void;
  onRemove: (key: string) => void;
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<null | {
    x: number;
    y: number;
    w: number;
    h: number;
  }>(null);

  const startDraw = (e: React.PointerEvent) => {
    if (frozen) return;
    if (tool !== "draw") return;
    if ((e.target as HTMLElement).closest("[data-box='1']")) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 10000;
    const y = ((e.clientY - rect.top) / rect.height) * 10000;
    setDraft({ x, y, w: 0, h: 0 });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const moveDraw = (e: React.PointerEvent) => {
    if (!draft) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 10000;
    const y = ((e.clientY - rect.top) / rect.height) * 10000;
    setDraft((d) => (d ? { ...d, w: x - d.x, h: y - d.y } : d));
  };
  const endDraw = (e: React.PointerEvent) => {
    if (!draft) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    const w = Math.abs(draft.w);
    const h = Math.abs(draft.h);
    if (w >= MIN_BP && h >= MIN_BP) {
      const xAxis = Math.max(0, draft.w < 0 ? draft.x + draft.w : draft.x);
      const yAxis = Math.max(0, draft.h < 0 ? draft.y + draft.h : draft.y);
      onCreate({
        xAxis: Math.round(xAxis),
        yAxis: Math.round(yAxis),
        width: Math.round(Math.min(w, 10000 - xAxis)),
        height: Math.round(Math.min(h, 10000 - yAxis)),
      });
    }
    setDraft(null);
  };

  return (
    <div className="relative shadow-sm border bg-white" style={{ width: "fit-content" }}>
      <Page
        pageNumber={pageNumber}
        width={820}
        renderAnnotationLayer={false}
        renderTextLayer={false}
      />
      <div
        ref={wrapRef}
        className="absolute inset-0"
        style={{
          cursor: frozen ? "default" : tool === "draw" ? "crosshair" : "default",
          touchAction: "none",
        }}
        onPointerDown={startDraw}
        onPointerMove={moveDraw}
        onPointerUp={endDraw}
        onPointerCancel={endDraw}
      >
        {boxes.map((b) => (
          <BoxView
            key={b.key}
            box={b}
            tool={tool}
            frozen={frozen}
            signatureDataUrl={signatureDataUrl}
            signedAt={signedAt}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))}
        {draft && !frozen ? (
          <div
            className="absolute pointer-events-none border-2 border-dashed border-blue-500 bg-blue-500/10"
            style={{
              left: `${(draft.w < 0 ? draft.x + draft.w : draft.x) / 100}%`,
              top: `${(draft.h < 0 ? draft.y + draft.h : draft.y) / 100}%`,
              width: `${Math.abs(draft.w) / 100}%`,
              height: `${Math.abs(draft.h) / 100}%`,
            }}
          />
        ) : null}
        {frozen ? (
          <div className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow flex items-center gap-1">
            <CheckCircle2 className="h-2.5 w-2.5" /> Signed
          </div>
        ) : null}
      </div>
      <div className="absolute -left-7 top-1 text-[10px] text-gray-400 font-mono select-none">
        {pageNumber}
      </div>
    </div>
  );
};

const BoxView = ({
  box,
  tool,
  frozen,
  signatureDataUrl,
  signedAt,
  onUpdate,
  onRemove,
}: {
  box: Box;
  tool: "select" | "draw";
  frozen: boolean;
  signatureDataUrl: string | null;
  signedAt: string | null;
  onUpdate: (b: Box) => void;
  onRemove: (key: string) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const startMove = (e: React.PointerEvent) => {
    if (frozen) return;
    if (tool === "draw") return;
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const wrap = target.parentElement as HTMLElement;
    const wrapRect = wrap.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const start = { x: box.xAxis, y: box.yAxis };
    const move = (ev: PointerEvent) => {
      const dx = ((ev.clientX - startX) / wrapRect.width) * 10000;
      const dy = ((ev.clientY - startY) / wrapRect.height) * 10000;
      const nx = Math.max(0, Math.min(10000 - box.width, start.x + dx));
      const ny = Math.max(0, Math.min(10000 - box.height, start.y + dy));
      onUpdate({ ...box, xAxis: Math.round(nx), yAxis: Math.round(ny) });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      target.releasePointerCapture?.(ev.pointerId);
    };
    target.setPointerCapture(e.pointerId);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const startResize = (e: React.PointerEvent) => {
    if (frozen) return;
    e.stopPropagation();
    const handle = e.currentTarget as HTMLElement;
    const wrap = (ref.current as HTMLElement).parentElement as HTMLElement;
    const wrapRect = wrap.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const start = { w: box.width, h: box.height };
    const move = (ev: PointerEvent) => {
      const dw = ((ev.clientX - startX) / wrapRect.width) * 10000;
      const dh = ((ev.clientY - startY) / wrapRect.height) * 10000;
      const nw = Math.max(MIN_BP, Math.min(10000 - box.xAxis, start.w + dw));
      const nh = Math.max(MIN_BP, Math.min(10000 - box.yAxis, start.h + dh));
      onUpdate({ ...box, width: Math.round(nw), height: Math.round(nh) });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      handle.releasePointerCapture?.(ev.pointerId);
    };
    handle.setPointerCapture(e.pointerId);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      ref={ref}
      data-box="1"
      className="absolute group"
      style={{
        left: `${box.xAxis / 100}%`,
        top: `${box.yAxis / 100}%`,
        width: `${box.width / 100}%`,
        height: `${box.height / 100}%`,
        background: frozen ? "transparent" : "rgba(59,130,246,0.18)",
        border: `2px ${frozen ? "solid #10b981" : "dashed #3b82f6"}`,
        cursor: frozen ? "default" : tool === "draw" ? "crosshair" : "move",
        borderRadius: 4,
      }}
      onPointerDown={startMove}
    >
      <div
        className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 select-none"
        style={{ background: frozen ? "#10b981" : "#3b82f6", color: "#fff" }}
      >
        {frozen ? (
          <>
            <CheckCircle2 className="h-2.5 w-2.5" /> Signed
          </>
        ) : (
          "Signature"
        )}
      </div>
      {!frozen ? (
        <>
          <button
            type="button"
            className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-white border shadow flex items-center justify-center hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(box.key);
            }}
            title="Remove"
          >
            <Trash2 className="h-2.5 w-2.5 text-rose-600" />
          </button>
          <div
            className="absolute right-0 bottom-0 h-3 w-3 cursor-nwse-resize"
            style={{
              background: "#3b82f6",
              borderTopLeftRadius: 3,
              touchAction: "none",
            }}
            onPointerDown={startResize}
          />
        </>
      ) : (
        <>
          {signatureDataUrl ? (
            <img
              src={signatureDataUrl}
              alt="signature"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-emerald-700 font-semibold italic px-1 text-center">
              Signed
            </div>
          )}
          {signedAt ? (
            <div className="absolute bottom-0 right-0 px-1 py-0.5 text-[9px] bg-white/85 text-emerald-700 font-semibold leading-none rounded-tl">
              {new Date(signedAt).toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};
