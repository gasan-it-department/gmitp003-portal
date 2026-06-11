import { useEffect, useMemo, useRef, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
//
import {
  disseminationDocuments,
  fetchDocumentFile,
  removeDisseminationDocument,
  saveSignaturePlacements,
  uploadDisseminationDocument,
  type PlacementDocument,
  type PlacementSignatory,
} from "@/db/statements/document";
//
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Save,
  Trash2,
  FileText,
  MousePointer2,
  Square,
  Upload,
  Plus,
  Minus,
  PenLine,
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker as string;

// ── Types ─────────────────────────────────────────────────────────────
export type Placement = {
  key: string;
  page: number;
  slotIndex: number; // 1-based
  xAxis: number;
  yAxis: number;
  width: number;
  height: number;
};

const COLORS = [
  { bg: "rgba(59,130,246,0.18)", border: "#3b82f6", text: "#1d4ed8" },
  { bg: "rgba(16,185,129,0.18)", border: "#10b981", text: "#047857" },
  { bg: "rgba(244,114,182,0.18)", border: "#f472b6", text: "#be185d" },
  { bg: "rgba(245,158,11,0.18)", border: "#f59e0b", text: "#b45309" },
  { bg: "rgba(139,92,246,0.18)", border: "#8b5cf6", text: "#6d28d9" },
  { bg: "rgba(20,184,166,0.18)", border: "#14b8a6", text: "#0f766e" },
  { bg: "rgba(239,68,68,0.18)", border: "#ef4444", text: "#b91c1c" },
  { bg: "rgba(99,102,241,0.18)", border: "#6366f1", text: "#4338ca" },
];
const colorFor = (slot: number) => COLORS[(slot - 1) % COLORS.length];

const surfaceErr = (err: unknown, fallback = "Something went wrong") => {
  const anyErr = err as any;
  return (
    anyErr?.response?.data?.message ||
    anyErr?.response?.data?.error ||
    anyErr?.message ||
    fallback
  );
};
const uid = () => Math.random().toString(36).slice(2);
const MIN_BP = 100;

interface Props {
  queueRoomId: string;
  token: string;
  userId: string;
  lineId: string;
  /** Notifies the parent when the max slot used changes (so the
   *  signatories step can demand at least that many signatories). */
  onMaxSlotChange?: (n: number) => void;
}

const PlacementEditor = ({
  queueRoomId,
  token,
  userId,
  lineId,
  onMaxSlotChange,
}: Props) => {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["dissemination", "documents", queueRoomId],
    queryFn: () => disseminationDocuments(token, queueRoomId),
    enabled: !!token && !!queueRoomId,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const docs: PlacementDocument[] = data?.documents ?? [];
  const sigs: PlacementSignatory[] = data?.signatories ?? [];

  // Active document
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  useEffect(() => {
    if (!activeDocId && docs.length > 0) setActiveDocId(docs[0].id);
    if (activeDocId && !docs.find((d) => d.id === activeDocId)) {
      setActiveDocId(docs[0]?.id ?? null);
    }
  }, [docs, activeDocId]);
  const activeDoc = docs.find((d) => d.id === activeDocId) || null;

  // Slot model: user picks how many slots they need (1..N) and which
  // slot each box belongs to.
  const [slotCount, setSlotCount] = useState(1);
  const [activeSlot, setActiveSlot] = useState(1);

  // Local placements (per active doc)
  const [placements, setPlacements] = useState<Placement[]>([]);

  // Hydrate from server (resolve signatoryArrangementId -> slotIndex via sigs map).
  const arrIdToSlot = useMemo(() => {
    const m = new Map<string, number>();
    sigs.forEach((s) => m.set(s.id, s.index + 1));
    return m;
  }, [sigs]);

  useEffect(() => {
    if (!activeDoc) {
      setPlacements([]);
      return;
    }
    const next: Placement[] = [];
    for (const p of activeDoc.pages) {
      for (const c of p.signCoor) {
        const slot = c.signatoryArrangementId
          ? arrIdToSlot.get(c.signatoryArrangementId)
          : undefined;
        next.push({
          key: c.id,
          page: p.page,
          slotIndex: slot ?? 1,
          xAxis: c.xAxis,
          yAxis: c.yAxis,
          width: c.width,
          height: c.height,
        });
      }
    }
    setPlacements(next);
  }, [activeDoc, arrIdToSlot]);

  // Track max slot used (across all docs) for parent
  useEffect(() => {
    if (!onMaxSlotChange) return;
    let max = 0;
    for (const d of docs) {
      for (const p of d.pages) {
        for (const c of p.signCoor) {
          const slot = c.signatoryArrangementId
            ? arrIdToSlot.get(c.signatoryArrangementId) ?? 0
            : 0;
          if (slot > max) max = slot;
        }
      }
    }
    // also include unsaved local placements on active doc
    for (const p of placements) if (p.slotIndex > max) max = p.slotIndex;
    onMaxSlotChange(max);
  }, [docs, placements, arrIdToSlot, onMaxSlotChange]);

  // Slot count is driven by the queue's signatories when they exist
  // (signatories are picked before this step). Falls back to a free-form
  // 1..8 picker if the editor is opened without signatories yet.
  useEffect(() => {
    if (sigs.length > 0) {
      setSlotCount(sigs.length);
      setActiveSlot((s) => Math.min(s, sigs.length));
      return;
    }
    const usedMax = placements.reduce(
      (m, p) => Math.max(m, p.slotIndex),
      1,
    );
    setSlotCount((n) => Math.max(n, usedMax));
  }, [placements, sigs.length]);

  // Fetch PDF
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    let urlToRevoke: string | null = null;
    setPdfUrl(null);
    if (!activeDocId) return;
    fetchDocumentFile(token, activeDocId)
      .then((blob) => {
        if (cancelled) return;
        const u = URL.createObjectURL(blob);
        urlToRevoke = u;
        setPdfUrl(u);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    };
  }, [activeDocId, token]);

  const [numPages, setNumPages] = useState(0);
  const [tool, setTool] = useState<"select" | "draw">("draw");

  // Save (per document)
  const saveMu = useMutation({
    mutationFn: () =>
      saveSignaturePlacements(token, {
        queueRoomId,
        documentId: activeDocId as string,
        userId,
        lineId,
        placements: placements.map((p) => ({
          page: p.page,
          slotIndex: p.slotIndex,
          xAxis: p.xAxis,
          yAxis: p.yAxis,
          width: p.width,
          height: p.height,
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["dissemination", "documents", queueRoomId],
      });
      qc.invalidateQueries({
        queryKey: ["dissemination", "detail", queueRoomId],
      });
    },
    onError: (e) => {
      // Auto-save shouldn't pop loud alerts on every keystroke — log it
      // so the user can still see if something's wrong without blocking.
      console.error("[PlacementEditor] auto-save failed:", e);
    },
  });

  // Auto-save: every time the placements array for the active document
  // changes, debounce 700ms and persist. This kills the entire class of
  // "I drew boxes but never clicked Save" bugs that left dispatched
  // queues with zero SignatureCoor rows. Skips while the doc is still
  // hydrating (no activeDocId yet).
  const skipAutoSaveRef = useRef(true);
  useEffect(() => {
    // Skip first effect run for a freshly-loaded doc (hydration sets
    // placements once, no need to round-trip back to the server).
    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false;
      return;
    }
    if (!activeDocId) return;
    const t = setTimeout(() => {
      saveMu.mutate();
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placements, activeDocId]);

  // When the active doc changes, the next render will hydrate placements
  // from the server response — don't echo that back as a "save".
  useEffect(() => {
    skipAutoSaveRef.current = true;
  }, [activeDocId]);

  // Upload / remove docs
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const pdfs = Array.from(files).filter(
      (f) =>
        f.type === "application/pdf" ||
        f.name.toLowerCase().endsWith(".pdf"),
    );
    if (pdfs.length === 0) return;
    setUploading(true);
    try {
      for (const f of pdfs) {
        await uploadDisseminationDocument(token, {
          queueRoomId,
          userId,
          lineId,
          file: f,
          title: f.name.replace(/\.pdf$/i, ""),
        });
      }
      qc.invalidateQueries({
        queryKey: ["dissemination", "documents", queueRoomId],
      });
      qc.invalidateQueries({
        queryKey: ["dissemination", "detail", queueRoomId],
      });
    } catch (e) {
      alert(surfaceErr(e, "Upload failed"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this document and its placements?")) return;
    try {
      await removeDisseminationDocument(token, {
        id,
        queueRoomId,
        userId,
        lineId,
      });
      qc.invalidateQueries({
        queryKey: ["dissemination", "documents", queueRoomId],
      });
      qc.invalidateQueries({
        queryKey: ["dissemination", "detail", queueRoomId],
      });
    } catch (e) {
      alert(surfaceErr(e, "Remove failed"));
    }
  };

  const placementsForPage = (n: number) =>
    placements.filter((p) => p.page === n);
  const upsert = (p: Placement) =>
    setPlacements((prev) => {
      const i = prev.findIndex((x) => x.key === p.key);
      if (i === -1) return [...prev, p];
      const next = [...prev];
      next[i] = p;
      return next;
    });
  const removeBox = (key: string) =>
    setPlacements((prev) => prev.filter((p) => p.key !== key));

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading documents...
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="px-3 py-2 border-b bg-white flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5 mr-1" />
          )}
          Upload PDF
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <div className="flex items-center bg-gray-100 rounded-md p-0.5 ml-2">
          <button
            type="button"
            className={`h-6 px-2 rounded text-[10px] flex items-center gap-1 ${
              tool === "select"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-600"
            }`}
            onClick={() => setTool("select")}
          >
            <MousePointer2 className="h-3 w-3" /> Select
          </button>
          <button
            type="button"
            className={`h-6 px-2 rounded text-[10px] flex items-center gap-1 ${
              tool === "draw"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-600"
            }`}
            onClick={() => setTool("draw")}
          >
            <Square className="h-3 w-3" /> Draw
          </button>
        </div>
        <div className="ml-2 text-[10px] text-gray-500">
          Active slot:{" "}
          <span
            className="font-semibold px-1.5 py-0.5 rounded text-white"
            style={{ background: colorFor(activeSlot).border }}
          >
            #{activeSlot}
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] h-6 px-2 ml-auto">
          {placements.length} box
          {placements.length === 1 ? "" : "es"} on this document
        </Badge>
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={() => saveMu.mutate()}
          disabled={
            saveMu.isPending || !activeDocId || placements.length === 0
          }
        >
          {saveMu.isPending ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5 mr-1" />
          )}
          Save placements
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-[200px_1fr_220px] grid-rows-[minmax(0,1fr)]">
        {/* Documents rail */}
        <aside className="border-r bg-white min-h-0 h-full overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50">
            <span className="text-[10px] font-semibold uppercase text-gray-600 tracking-wide">
              Documents
            </span>
          </div>
          {docs.length === 0 ? (
            <div className="p-4 text-[10px] text-gray-500 text-center">
              Upload a PDF to begin.
            </div>
          ) : (
            <div className="divide-y">
              {docs.map((d) => {
                const on = d.id === activeDocId;
                const count = d.pages.reduce(
                  (a, p) => a + p.signCoor.length,
                  0,
                );
                return (
                  <div
                    key={d.id}
                    className={`px-3 py-2 hover:bg-gray-50 flex items-center gap-2 ${
                      on ? "bg-blue-50/60" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left flex items-center gap-2"
                      onClick={() => setActiveDocId(d.id)}
                    >
                      <FileText
                        className={`h-3.5 w-3.5 ${on ? "text-blue-600" : "text-gray-500"}`}
                      />
                      <span className="text-xs font-medium truncate flex-1">
                        {d.title || d.file?.fileName || "Untitled"}
                      </span>
                      {count > 0 ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1"
                        >
                          {count}
                        </Badge>
                      ) : null}
                    </button>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-rose-600"
                      onClick={() => handleRemove(d.id)}
                      title="Remove"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* PDF canvas — scrolls on both axes independently */}
        <section className="overflow-auto min-h-0 h-full bg-gray-100">
          {docs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2 p-6">
              <Upload className="h-7 w-7 text-gray-300" />
              <div className="text-xs font-medium text-gray-700">
                No documents yet
              </div>
              <div className="text-[10px] text-gray-500">
                Upload a PDF to start placing e-signature boxes.
              </div>
            </div>
          ) : !pdfUrl ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-500">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Opening PDF...
            </div>
          ) : (
            <Document
              file={pdfUrl}
              onLoadSuccess={(p) => setNumPages(p.numPages)}
              loading={
                <div className="p-6 text-xs text-gray-500">
                  Rendering PDF...
                </div>
              }
              error={
                <div className="p-6 text-xs text-rose-600">
                  Failed to render PDF.
                </div>
              }
            >
              <div className="py-4 px-4 flex flex-col items-center gap-4">
                {Array.from({ length: numPages }, (_, i) => i + 1).map(
                  (pn) => (
                    <PageCanvas
                      key={pn}
                      pageNumber={pn}
                      tool={tool}
                      activeSlot={activeSlot}
                      placements={placementsForPage(pn)}
                      onCreate={(rect) =>
                        upsert({
                          key: uid(),
                          page: pn,
                          slotIndex: activeSlot,
                          ...rect,
                        })
                      }
                      onUpdate={upsert}
                      onRemove={removeBox}
                    />
                  ),
                )}
              </div>
            </Document>
          )}
        </section>

        {/* Slots rail */}
        <aside className="border-l bg-white min-h-0 h-full overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase text-gray-600 tracking-wide">
              Signatory slots
            </span>
            {sigs.length > 0 ? (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                {sigs.length} from queue
              </Badge>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="h-5 w-5 rounded border bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-40"
                  onClick={() =>
                    setSlotCount((n) => {
                      const min = placements.reduce(
                        (m, p) => Math.max(m, p.slotIndex),
                        1,
                      );
                      return Math.max(min, n - 1);
                    })
                  }
                  disabled={slotCount <= 1}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-[10px] font-semibold w-4 text-center">
                  {slotCount}
                </span>
                <button
                  type="button"
                  className="h-5 w-5 rounded border bg-white hover:bg-gray-50 flex items-center justify-center"
                  onClick={() => setSlotCount((n) => Math.min(8, n + 1))}
                  disabled={slotCount >= 8}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          <div className="p-2 space-y-1.5">
            {Array.from({ length: slotCount }, (_, i) => i + 1).map((s) => {
              const c = colorFor(s);
              const on = s === activeSlot;
              const count = placements.filter(
                (p) => p.slotIndex === s,
              ).length;
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => setActiveSlot(s)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md border text-xs ${
                    on
                      ? "border-gray-800 shadow-sm bg-white"
                      : "border-transparent hover:border-gray-200"
                  }`}
                >
                  <span
                    className="h-5 w-5 rounded-full text-[10px] font-semibold flex items-center justify-center"
                    style={{ background: c.border, color: "#fff" }}
                  >
                    {s}
                  </span>
                  <span className="flex-1 text-left text-xs font-medium text-gray-800">
                    Signatory #{s}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] h-4 px-1"
                    style={{
                      borderColor: c.border,
                      color: c.text,
                      background: c.bg,
                    }}
                  >
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
          <div className="p-3 border-t mt-2 text-[10px] text-gray-500 leading-relaxed">
            <div className="flex items-center gap-1 mb-1 text-gray-700 font-semibold">
              <PenLine className="h-3 w-3" /> How this works
            </div>
            Each box is tied to a slot number. When the dissemination is
            dispatched and signatory #N signs, their e-sign automatically
            renders inside every box marked slot #N.
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PlacementEditor;

// ─── Per-page canvas ────────────────────────────────────────────────
const PageCanvas = ({
  pageNumber,
  tool,
  activeSlot,
  placements,
  onCreate,
  onUpdate,
  onRemove,
}: {
  pageNumber: number;
  tool: "select" | "draw";
  activeSlot: number;
  placements: Placement[];
  onCreate: (rect: {
    xAxis: number;
    yAxis: number;
    width: number;
    height: number;
  }) => void;
  onUpdate: (p: Placement) => void;
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
    <div
      className="relative shadow-sm border bg-white"
      style={{ width: "fit-content" }}
    >
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
          cursor: tool === "draw" ? "crosshair" : "default",
          touchAction: "none",
        }}
        onPointerDown={startDraw}
        onPointerMove={moveDraw}
        onPointerUp={endDraw}
        onPointerCancel={endDraw}
      >
        {placements.map((p) => (
          <BoxView
            key={p.key}
            placement={p}
            color={colorFor(p.slotIndex)}
            tool={tool}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onReassign={(slot) => onUpdate({ ...p, slotIndex: slot })}
          />
        ))}
        {draft ? (
          <div
            className="absolute pointer-events-none border-2 border-dashed"
            style={{
              borderColor: colorFor(activeSlot).border,
              background: colorFor(activeSlot).bg,
              left: `${(draft.w < 0 ? draft.x + draft.w : draft.x) / 100}%`,
              top: `${(draft.h < 0 ? draft.y + draft.h : draft.y) / 100}%`,
              width: `${Math.abs(draft.w) / 100}%`,
              height: `${Math.abs(draft.h) / 100}%`,
            }}
          />
        ) : null}
      </div>
      <div className="absolute -left-7 top-1 text-[10px] text-gray-400 font-mono select-none">
        {pageNumber}
      </div>
    </div>
  );
};

// ─── Single box ─────────────────────────────────────────────────────
const BoxView = ({
  placement,
  color,
  tool,
  onUpdate,
  onRemove,
  onReassign,
}: {
  placement: Placement;
  color: { bg: string; border: string; text: string };
  tool: "select" | "draw";
  onUpdate: (p: Placement) => void;
  onRemove: (key: string) => void;
  onReassign: (slot: number) => void;
}) => {
  const boxRef = useRef<HTMLDivElement>(null);

  const startMove = (e: React.PointerEvent) => {
    if (tool === "draw") return;
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const wrap = target.parentElement as HTMLElement;
    const wrapRect = wrap.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const start = { x: placement.xAxis, y: placement.yAxis };

    const move = (ev: PointerEvent) => {
      const dx = ((ev.clientX - startX) / wrapRect.width) * 10000;
      const dy = ((ev.clientY - startY) / wrapRect.height) * 10000;
      const nx = Math.max(0, Math.min(10000 - placement.width, start.x + dx));
      const ny = Math.max(0, Math.min(10000 - placement.height, start.y + dy));
      onUpdate({ ...placement, xAxis: Math.round(nx), yAxis: Math.round(ny) });
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
    e.stopPropagation();
    const handle = e.currentTarget as HTMLElement;
    const wrap = (boxRef.current as HTMLElement).parentElement as HTMLElement;
    const wrapRect = wrap.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const start = { w: placement.width, h: placement.height };

    const move = (ev: PointerEvent) => {
      const dw = ((ev.clientX - startX) / wrapRect.width) * 10000;
      const dh = ((ev.clientY - startY) / wrapRect.height) * 10000;
      const nw = Math.max(
        MIN_BP,
        Math.min(10000 - placement.xAxis, start.w + dw),
      );
      const nh = Math.max(
        MIN_BP,
        Math.min(10000 - placement.yAxis, start.h + dh),
      );
      onUpdate({ ...placement, width: Math.round(nw), height: Math.round(nh) });
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
      ref={boxRef}
      data-box="1"
      className="absolute group"
      style={{
        left: `${placement.xAxis / 100}%`,
        top: `${placement.yAxis / 100}%`,
        width: `${placement.width / 100}%`,
        height: `${placement.height / 100}%`,
        background: color.bg,
        border: `2px dashed ${color.border}`,
        cursor: tool === "draw" ? "crosshair" : "move",
        borderRadius: 4,
      }}
      onPointerDown={startMove}
    >
      <div
        className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 select-none"
        style={{ background: color.border, color: "#fff" }}
      >
        Slot #{placement.slotIndex}
      </div>
      <div className="absolute -top-5 right-6 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
          <button
            key={s}
            type="button"
            className="h-4 w-4 rounded text-[9px] font-semibold border border-white"
            style={{
              background:
                s === placement.slotIndex
                  ? color.border
                  : COLORS[(s - 1) % COLORS.length].border,
              color: "#fff",
              opacity: s === placement.slotIndex ? 1 : 0.55,
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onReassign(s);
            }}
            title={`Assign to slot #${s}`}
          >
            {s}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-white border shadow flex items-center justify-center hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(placement.key);
        }}
        title="Remove"
      >
        <Trash2 className="h-2.5 w-2.5 text-rose-600" />
      </button>
      <div
        className="absolute right-0 bottom-0 h-3 w-3 cursor-nwse-resize"
        style={{
          background: color.border,
          borderTopLeftRadius: 3,
          touchAction: "none",
        }}
        onPointerDown={startResize}
      />
    </div>
  );
};
