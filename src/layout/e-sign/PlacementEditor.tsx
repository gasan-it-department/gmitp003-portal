import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Lock,
  Check,
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

/**
 * What the server would be sent for this set of boxes.
 *
 * Geometry only. The local `key` is a client-side handle that changes on
 * every round trip, so including it would make every comparison fail. Two
 * lists with the same fingerprint are the same save, and the second one is
 * not worth making.
 */
const fingerprintOf = (list: Placement[]) =>
  JSON.stringify(
    list
      .map(
        (p) =>
          `${p.page}:${p.slotIndex}:${p.xAxis}:${p.yAxis}:${p.width}:${p.height}`,
      )
      .sort(),
  );

interface Props {
  queueRoomId: string;
  token: string;
  userId: string;
  lineId: string;
  /** Notifies the parent when the max slot used changes (so the
   *  signatories step can demand at least that many signatories). */
  onMaxSlotChange?: (n: number) => void;
  /** Takes the user back to the step where signatories are chosen. Given
   *  by the wizard; absent when the editor is opened on its own. */
  onPickSignatories?: () => void;
}

const PlacementEditor = ({
  queueRoomId,
  token,
  userId,
  lineId,
  onMaxSlotChange,
  onPickSignatories,
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

  /**
   * This routing is being sent without e-sign.
   *
   * Only true once the query has answered — `sigs` is [] while loading
   * too, and flashing "nothing to sign" at somebody who picked four
   * signatories would be alarming. Existing boxes keep the picker: they
   * came from somewhere and the owner has to be able to see and remove
   * them.
   */
  const noSigning = !isLoading && !!data && sigs.length === 0;

  /**
   * May the user put a new box on the page?
   *
   * Only if somebody is going to sign it. A routing with no signatories is
   * a memo being handed round — the recipients need to HAVE it, not sign
   * it — and a signature box on one is a box that will sit empty forever.
   * Existing boxes stay removable; drawing another is refused here and
   * again on the server, because this is the UI for one of two clients.
   */
  const canDraw = !noSigning;

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

  /**
   * Which document the local `placements` array was last filled from, and
   * the fingerprint of what the server holds for it.
   *
   * Hydration keys on the document ID, never on the object identity of the
   * query result. Saving deletes every SignatureCoor row and recreates it,
   * so a refetched document is never deeply equal to the one before — react
   * query hands back a new object and this effect used to re-run, replacing
   * the local array with one carrying entirely new keys. Two things broke:
   *
   *   A drag in flight still held the old key. Its next update matched
   *   nothing, so it was appended instead of applied — the duplicate box.
   *
   *   Re-running also re-armed the auto-save, which saved, which refetched,
   *   which re-hydrated. Production logs show that loop rewriting every box
   *   roughly every 0.8 seconds for as long as the step stayed open.
   *
   * Once loaded, the local array is the truth. The server is told about it;
   * it does not get to tell us back.
   */
  const hydratedFor = useRef<string | null>(null);
  /** Fingerprint of what the server holds for the active document. State,
   *  not a ref, because the Save button is painted from it. */
  const [savedFingerprint, setSavedFingerprint] = useState<string | null>(null);

  useEffect(() => {
    if (!activeDoc) {
      if (hydratedFor.current !== null) {
        hydratedFor.current = null;
        setSavedFingerprint(null);
        setPlacements([]);
      }
      return;
    }
    if (hydratedFor.current === activeDoc.id) return;
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
    hydratedFor.current = activeDoc.id;
    // What we just read IS what the server holds — nothing to save yet.
    setSavedFingerprint(fingerprintOf(next));
    setPlacements(next);
  }, [activeDoc, arrIdToSlot]);

  // Track max slot used (across all docs) for parent
  useEffect(() => {
    if (!onMaxSlotChange) return;
    let max = 0;
    for (const d of docs) {
      // The active document's server rows are stale the moment the user
      // draws anything; `placements` below is the live version of it.
      if (d.id === activeDocId) continue;
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
  }, [docs, placements, arrIdToSlot, activeDocId, onMaxSlotChange]);

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
  /**
   * Saves an explicit document and an explicit set of boxes.
   *
   * It used to read both off component state at the moment it fired, which
   * is fine for a button and wrong for anything scheduled: a save queued
   * for document A and flushed after the user clicked document B would
   * have written A's boxes onto B. Passing them in makes that impossible.
   */
  const saveMu = useMutation({
    mutationFn: (arg: { documentId: string; placements: Placement[] }) =>
      saveSignaturePlacements(token, {
        queueRoomId,
        documentId: arg.documentId,
        userId,
        lineId,
        placements: arg.placements.map((p) => ({
          page: p.page,
          slotIndex: p.slotIndex,
          xAxis: p.xAxis,
          yAxis: p.yAxis,
          width: p.width,
          height: p.height,
        })),
      }),
    onSuccess: () => {
      // Refetching here is safe again now that hydration keys on document
      // ID: the response arrives, nothing re-reads it into local state, and
      // the cache is correct for the next time this editor is mounted.
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

  const fingerprint = useMemo(() => fingerprintOf(placements), [placements]);
  const dirty = savedFingerprint !== null && fingerprint !== savedFingerprint;

  /**
   * True while a box is being drawn, moved or resized.
   *
   * Saving mid-drag is work thrown away — the user has not finished moving
   * the box — and it is the moment the duplicate used to appear. The ref is
   * what the effect reads; `dragTick` is what makes React look again when
   * the pointer comes up, since a ref changing is invisible to it.
   */
  const draggingRef = useRef(false);
  const [dragTick, setDragTick] = useState(0);
  const setDragging = useCallback((on: boolean) => {
    if (draggingRef.current === on) return;
    draggingRef.current = on;
    // Bump on BOTH edges. Going down has to re-run the effect so that a
    // timer armed by an earlier edit is cleared before it can fire into
    // the middle of this drag; coming up has to re-run it to arm the save
    // the drag just earned.
    setDragTick((n) => n + 1);
  }, []);

  // Auto-save: once the boxes actually differ from what the server holds,
  // and the pointer is not mid-drag, debounce 700ms and persist. This kills
  // the "I drew boxes but never clicked Save" class of bug without the
  // write loop the naive version caused — an unchanged list is never sent.
  useEffect(() => {
    if (!activeDocId) return;
    if (!dirty) return;
    if (draggingRef.current) return;
    // One save at a time. The server replaces a document's whole set of
    // boxes, so two overlapping writes can land in either order and the
    // loser silently wins. When this one settles the effect runs again.
    if (saveMu.isPending) return;
    const sending = fingerprint;
    const docId = activeDocId;
    const rows = placements;
    const t = setTimeout(() => {
      saveMu.mutate(
        { documentId: docId, placements: rows },
        { onSuccess: () => setSavedFingerprint(sending) },
      );
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint, dirty, activeDocId, dragTick, saveMu.isPending]);

  /** The manual button. Same path as the auto-save, no debounce. */
  const saveNow = () => {
    if (!activeDocId || saveMu.isPending) return;
    const sending = fingerprint;
    saveMu.mutate(
      { documentId: activeDocId, placements },
      { onSuccess: () => setSavedFingerprint(sending) },
    );
  };

  /**
   * Move to another document, flushing anything the debounce is still
   * holding. Switching used to drop up to 700ms of work on the floor,
   * because hydrating the new document replaces the array the pending save
   * would have read.
   */
  const switchDoc = (id: string) => {
    if (id === activeDocId) return;
    if (activeDocId && dirty) {
      saveMu.mutate({ documentId: activeDocId, placements });
    }
    setActiveDocId(id);
  };

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
  const addBox = (p: Placement) => setPlacements((prev) => [...prev, p]);

  /**
   * Move or resize a box that already exists. Never appends.
   *
   * A drag registers window listeners that close over the placement as it
   * was at pointer-down. If that box has since gone — deleted, or replaced
   * by a re-hydration — the pointer is dragging something that no longer
   * exists, and adding it back is how one box became two. Dropping the
   * update is the honest outcome: there is nothing there to move.
   */
  const updateBox = (p: Placement) =>
    setPlacements((prev) => {
      const i = prev.findIndex((x) => x.key === p.key);
      if (i === -1) return prev;
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
        {canDraw ? (
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
        ) : (
          <div className="ml-2 flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            <Lock className="h-3 w-3" />
            {placements.length > 0
              ? "No signatories — these boxes can only be removed"
              : "No signatories — nothing to place"}
          </div>
        )}
        {canDraw ? (
          <div className="ml-2 text-[10px] text-gray-500">
            Active slot:{" "}
            <span
              className="font-semibold px-1.5 py-0.5 rounded text-white"
              style={{ background: colorFor(activeSlot).border }}
            >
              #{activeSlot}
            </span>
          </div>
        ) : null}
        <Badge variant="outline" className="text-[10px] h-6 px-2 ml-auto">
          {placements.length} box
          {placements.length === 1 ? "" : "es"} on this document
        </Badge>
        <Button
          size="sm"
          variant={dirty ? "default" : "outline"}
          className="h-7 text-xs"
          onClick={saveNow}
          disabled={saveMu.isPending || !activeDocId || !dirty}
          title={
            dirty
              ? "Save now instead of waiting for the auto-save"
              : "Everything on this document is already saved"
          }
        >
          {saveMu.isPending ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : dirty ? (
            <Save className="h-3.5 w-3.5 mr-1" />
          ) : (
            <Check className="h-3.5 w-3.5 mr-1" />
          )}
          {saveMu.isPending
            ? "Saving…"
            : dirty
              ? "Save placements"
              : "Saved"}
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
                // The active document's count comes from local state: the
                // save deliberately no longer refetches this query, so its
                // server-side signCoor rows are a snapshot from load time.
                const count =
                  d.id === activeDocId
                    ? placements.length
                    : d.pages.reduce((a, p) => a + p.signCoor.length, 0);
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
                      onClick={() => switchDoc(d.id)}
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
                {noSigning ? (
                  <div className="w-full max-w-[820px] rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 flex items-start gap-2">
                    <Lock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-amber-900">
                        Signature boxes are off for this routing
                      </div>
                      <div className="text-[10px] text-amber-800 leading-relaxed mt-0.5">
                        {placements.length > 0
                          ? "Nobody is signing, so these boxes would never be filled. Remove them, or go back and choose who signs."
                          : "Nobody is signing this document. The recipients get it as it is — there is nothing to place on the page."}
                      </div>
                    </div>
                    {onPickSignatories ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] shrink-0 bg-white"
                        onClick={onPickSignatories}
                      >
                        Choose signatories
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {Array.from({ length: numPages }, (_, i) => i + 1).map(
                  (pn) => (
                    <PageCanvas
                      key={pn}
                      pageNumber={pn}
                      tool={canDraw ? tool : "select"}
                      canDraw={canDraw}
                      activeSlot={activeSlot}
                      placements={placementsForPage(pn)}
                      onCreate={(rect) =>
                        addBox({
                          key: uid(),
                          page: pn,
                          slotIndex: activeSlot,
                          ...rect,
                        })
                      }
                      onUpdate={updateBox}
                      onRemove={removeBox}
                      onDragChange={setDragging}
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
            {noSigning && placements.length === 0 ? null : sigs.length > 0 ? (
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
          {noSigning && placements.length === 0 ? (
            <div className="p-3 text-[10px] text-gray-500 leading-relaxed">
              <div className="text-gray-700 font-semibold mb-1">
                No signatories on this routing
              </div>
              There is nothing to place. Attach the documents and dispatch —
              the recipients get them as they are. To collect signatures
              instead, go back a step and choose who signs.
            </div>
          ) : null}
          <div className="p-2 space-y-1.5">
            {(noSigning && placements.length === 0
              ? []
              : Array.from({ length: slotCount }, (_, i) => i + 1)
            ).map((s) => {
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
  canDraw,
  activeSlot,
  placements,
  onCreate,
  onUpdate,
  onRemove,
  onDragChange,
}: {
  pageNumber: number;
  tool: "select" | "draw";
  /** False when the routing has no signatories: existing boxes can still
   *  be removed, but no new one may be drawn. */
  canDraw: boolean;
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
  /** Raised while any pointer drag is in progress, so the auto-save can
   *  wait for the user to let go. */
  onDragChange: (dragging: boolean) => void;
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<null | {
    x: number;
    y: number;
    w: number;
    h: number;
  }>(null);

  /**
   * A draw in progress, if any.
   *
   * This used to be committed from the overlay's own onPointerUp, with the
   * pointer captured on whatever `e.target` happened to be. Release outside
   * the overlay — or on a box that had just rendered under the cursor — and
   * that pointerup never arrived, so the draft SURVIVED the drag. Moving or
   * resizing a box then re-entered the overlay's pointermove/pointerup (both
   * of those drags listen on `window`), the stale draft grew to wherever the
   * box was dragged, and letting go created a second box on top of the one
   * being moved. That is the duplicate.
   *
   * The draw now owns the pointer the same way move and resize do: window
   * listeners keyed to the pointer that started it, torn down on release
   * whatever it is released over. A ref alongside the state so the listeners
   * read the live value rather than the one captured at mousedown.
   */
  const draftRef = useRef<null | { x: number; y: number; w: number; h: number }>(
    null,
  );
  const drawingId = useRef<number | null>(null);

  /** Abandon whatever is being drawn, committing nothing. */
  const cancelDraw = useCallback(() => {
    draftRef.current = null;
    drawingId.current = null;
    setDraft(null);
  }, []);

  // Switching tools abandons a draw. A rectangle begun in draw mode has no
  // meaning once the user has moved on to selecting, and keeping it is how
  // it used to leak into the next drag.
  useEffect(() => {
    cancelDraw();
  }, [tool, cancelDraw]);

  const startDraw = (e: React.PointerEvent) => {
    if (!canDraw) return;
    if (tool !== "draw") return;
    if (drawingId.current !== null) return; // one draw at a time
    if ((e.target as HTMLElement).closest("[data-box='1']")) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 10000;
    const y = ((e.clientY - rect.top) / rect.height) * 10000;
    const seed = { x, y, w: 0, h: 0 };
    draftRef.current = seed;
    drawingId.current = e.pointerId;
    setDraft(seed);
    onDragChange(true);

    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== drawingId.current) return;
      const d = draftRef.current;
      if (!d) return;
      const r = wrap.getBoundingClientRect();
      const nx = ((ev.clientX - r.left) / r.width) * 10000;
      const ny = ((ev.clientY - r.top) / r.height) * 10000;
      const next = { ...d, w: nx - d.x, h: ny - d.y };
      draftRef.current = next;
      setDraft(next);
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== drawingId.current) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      const d = draftRef.current;
      // Clear BEFORE creating: onCreate re-renders this overlay, and a draft
      // still sitting there during that render is the whole bug.
      cancelDraw();
      onDragChange(false);
      if (!d || ev.type === "pointercancel") return;
      const w = Math.abs(d.w);
      const h = Math.abs(d.h);
      if (w < MIN_BP || h < MIN_BP) return;
      const xAxis = Math.max(0, d.w < 0 ? d.x + d.w : d.x);
      const yAxis = Math.max(0, d.h < 0 ? d.y + d.h : d.y);
      onCreate({
        xAxis: Math.round(xAxis),
        yAxis: Math.round(yAxis),
        width: Math.round(Math.min(w, 10000 - xAxis)),
        height: Math.round(Math.min(h, 10000 - yAxis)),
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
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
          cursor: canDraw && tool === "draw" ? "crosshair" : "default",
          touchAction: "none",
        }}
        onPointerDown={startDraw}
      >
        {placements.map((p) => (
          <BoxView
            key={p.key}
            placement={p}
            color={colorFor(p.slotIndex)}
            tool={tool}
            canDraw={canDraw}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onReassign={(slot) => onUpdate({ ...p, slotIndex: slot })}
            onInteract={cancelDraw}
            onDragChange={onDragChange}
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
  canDraw,
  onUpdate,
  onRemove,
  onReassign,
  onInteract,
  onDragChange,
}: {
  placement: Placement;
  color: { bg: string; border: string; text: string };
  tool: "select" | "draw";
  /** False when the routing has no signatories — the box may be removed
   *  but not reassigned to a slot that will never be filled. */
  canDraw: boolean;
  onUpdate: (p: Placement) => void;
  onRemove: (key: string) => void;
  onReassign: (slot: number) => void;
  /** Called before a move or resize, so a half-drawn box is abandoned. */
  onInteract?: () => void;
  /** Raised for the length of a move or resize, so the auto-save waits. */
  onDragChange: (dragging: boolean) => void;
}) => {
  const boxRef = useRef<HTMLDivElement>(null);

  const startMove = (e: React.PointerEvent) => {
    if (tool === "draw") return;
    e.stopPropagation();
    onInteract?.();
    onDragChange(true);
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
      onDragChange(false);
    };
    target.setPointerCapture(e.pointerId);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const startResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    onInteract?.();
    onDragChange(true);
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
      onDragChange(false);
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
      <div
        className="absolute -top-5 right-6 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5"
        hidden={!canDraw}
      >
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
