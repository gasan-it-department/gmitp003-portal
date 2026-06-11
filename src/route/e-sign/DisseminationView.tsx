import { useEffect, useMemo, useState } from "react";
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
  archiveDissemination,
  fetchDocumentFile,
  fetchSignedDocument,
  signMine,
  viewDissemination,
  type DisseminationView,
  type SigningSignatoryArrangement,
} from "@/db/statements/document";
import { useGeo } from "@/provider/GeoProvider";
//
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/custom/Modal";
import {
  ArrowLeft,
  PenLine,
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Download,
  Archive,
} from "lucide-react";

// pdf.js worker — same setup as PlacementEditor.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker as string;

const COLORS = [
  { bg: "rgba(59,130,246,0.18)", border: "#3b82f6" },
  { bg: "rgba(16,185,129,0.18)", border: "#10b981" },
  { bg: "rgba(244,114,182,0.18)", border: "#f472b6" },
  { bg: "rgba(245,158,11,0.18)", border: "#f59e0b" },
  { bg: "rgba(139,92,246,0.18)", border: "#8b5cf6" },
  { bg: "rgba(20,184,166,0.18)", border: "#14b8a6" },
  { bg: "rgba(239,68,68,0.18)", border: "#ef4444" },
  { bg: "rgba(99,102,241,0.18)", border: "#6366f1" },
];
const colorFor = (slot: number) => COLORS[(slot - 1) % COLORS.length];

const fullName = (u?: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
} | null) =>
  `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || u?.username || "—";

const surfaceErr = (err: unknown, fallback = "Something went wrong") => {
  const e = err as any;
  return (
    e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback
  );
};

const DisseminationViewPage = () => {
  const { newRoomId: queueId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const geo = useGeo();

  const { data, isLoading } = useQuery({
    queryKey: ["dissemination", "view", queueId],
    queryFn: () => viewDissemination(auth.token as string, queueId as string),
    enabled: !!auth.token && !!queueId,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  const [confirmOpen, setConfirmOpen] = useState(false);

  const signMu = useMutation({
    mutationFn: async () => {
      // Pull the freshest cached coords from the module-level provider.
      // The provider already requested permission when the user entered
      // the Document module, so this usually returns instantly.
      const fix = await geo.captureForSign();
      return signMine(auth.token as string, {
        queueRoomId: queueId as string,
        userId: auth.userId as string,
        geo: fix
          ? { lat: fix.lat, lng: fix.lng, accuracy: fix.accuracy }
          : null,
      });
    },
    onSuccess: (res) => {
      setConfirmOpen(false);
      qc.invalidateQueries({ queryKey: ["dissemination", "view", queueId] });
      qc.invalidateQueries({ queryKey: ["dissemination", "inbox"] });
      if (res.signed === 0) {
        // Almost always means none of the slots are bound to this user.
        // Point them at the Claim button instead of leaving them stuck.
        alert(
          "Nothing was signed — no slot is assigned to your account on this dissemination.\n\n" +
            "If you see slots marked 'Unassigned' on the right rail, click 'Claim' on the one you want to sign, then click 'Sign all my fields' again.",
        );
      } else if (res.completed) {
        alert(`Signed ${res.signed} slot(s). All signatures collected — dissemination completed.`);
      }
    },
    onError: (e) => alert(surfaceErr(e)),
  });

  const archiveMu = useMutation({
    mutationFn: () =>
      archiveDissemination(auth.token as string, {
        queueRoomId: queueId as string,
        userId: auth.userId as string,
      }),
    onSuccess: (r) => {
      alert(
        `Archived ${r.created} document(s) into the room archive` +
          (r.skipped > 0 ? ` (${r.skipped} were already archived).` : "."),
      );
    },
    onError: (e) => alert(surfaceErr(e)),
  });

  // Download a single document with signatures burned in. The backend
  // flattens the signatures onto the PDF — the raw signature image is
  // never delivered to the client by this endpoint, so signers' e-signs
  // can't be lifted out and reused on a different document.
  const downloadDoc = async (
    docId: string,
    fileName: string,
    hasAnySig: boolean,
  ) => {
    try {
      const blob = hasAnySig
        ? await fetchSignedDocument(auth.token as string, docId)
        : await fetchDocumentFile(auth.token as string, docId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const base = fileName.replace(/\.pdf$/i, "");
      a.download = hasAnySig ? `${base}-signed.pdf` : `${base}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(surfaceErr(e));
    }
  };

  if (isLoading || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  const queue = data.queue;
  const arrangements = queue.signatotyArrangement;
  // Sign-eligible = pending AND (assigned to me OR unassigned). The
  // backend's signMine will auto-bind unassigned slots to the signer, so
  // they should count toward the visible button total.
  const signable = arrangements.filter(
    (a) => a.status === 0 && (a.userId === auth.userId || !a.userId),
  );
  const mySlots = arrangements.filter((a) => a.userId === auth.userId);
  const myPending = mySlots.filter((a) => a.status === 0);
  // Earlier-index slots that haven't been signed yet — used to warn (but
  // not block) the user when they sign out of the intended order.
  const lowestSignableIdx = signable.length
    ? Math.min(...signable.map((a) => a.index))
    : Infinity;
  const earlierUnsigned = arrangements.filter(
    (a) => a.status === 0 && a.index < lowestSignableIdx,
  );
  const arrById = new Map<string, SigningSignatoryArrangement>(
    arrangements.map((a) => [a.id, a]),
  );

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
            {queue.title || "(no subject)"}
          </div>
          <div className="text-[10px] text-gray-500 flex items-center gap-2">
            <Building2 className="h-3 w-3" />
            <span>From {queue.fromRoom?.code ?? "—"}</span>
            <span>·</span>
            <span>
              Sent by {queue.user ? fullName(queue.user) : "—"}
            </span>
            <span>·</span>
            <span>{new Date(queue.timestamp).toLocaleString()}</span>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`ml-auto text-[10px] h-6 px-2 ${
            queue.status === 2
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : queue.status === 1
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-gray-100 text-gray-700 border-gray-200"
          }`}
        >
          {queue.status === 2
            ? "Completed"
            : queue.status === 1
              ? "Awaiting signatures"
              : "Draft"}
        </Badge>
        {queue.status === 2 || (queue.status === 1 && arrangements.some((a) => a.status === 1)) ? (
          <>
            {queue.documents.map((d) => (
              <Button
                key={d.id}
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() =>
                  downloadDoc(
                    d.id,
                    d.title || d.file?.fileName || "document.pdf",
                    arrangements.some((a) => a.status === 1),
                  )
                }
                title={`Download ${d.title || d.file?.fileName || "document"} (signatures stamped, flattened)`}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                {d.title || d.file?.fileName || "Document"}
              </Button>
            ))}
            {queue.status === 2 ? (
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => archiveMu.mutate()}
                disabled={archiveMu.isPending}
              >
                {archiveMu.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Archive className="h-3.5 w-3.5 mr-1" />
                )}
                Archive to room
              </Button>
            ) : null}
          </>
        ) : (
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={signable.length === 0 || signMu.isPending || queue.status !== 1}
            onClick={() => setConfirmOpen(true)}
            title={
              queue.status !== 1
                ? "This dissemination is not awaiting signatures."
                : signable.length === 0
                  ? "Every pending slot is already assigned to someone else."
                  : ""
            }
          >
            {signMu.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <PenLine className="h-3.5 w-3.5 mr-1" />
            )}
            Sign all my fields
            {signable.length > 0 ? ` (${signable.length})` : ""}
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-[1fr_260px] grid-rows-[minmax(0,1fr)]">
        {/* Documents */}
        <section className="overflow-auto min-h-0 h-full bg-gray-100 p-4">
          {queue.documents.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-500">
              No documents attached to this dissemination.
            </div>
          ) : (
            <div className="space-y-6">
              {queue.documents.map((doc) => (
                <DocumentBlock
                  key={doc.id}
                  doc={doc}
                  view={data}
                  arrById={arrById}
                  myUserId={auth.userId as string}
                />
              ))}
            </div>
          )}
        </section>

        {/* Signatories rail */}
        <aside className="border-l bg-white min-h-0 h-full overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-gray-600" />
            <span className="text-xs font-semibold">
              Signatories ({arrangements.length})
            </span>
          </div>
          <div className="flex-1 overflow-auto divide-y">
            {arrangements.length === 0 ? (
              <div className="p-3 text-[10px] text-gray-500 text-center">
                No signatories required.
              </div>
            ) : (
              arrangements.map((a) => {
                const c = colorFor(a.index + 1);
                const isMe = a.userId === auth.userId;
                const isSigned = a.status === 1;
                return (
                  <div key={a.id} className="px-3 py-2 flex items-center gap-2">
                    <span
                      className="h-6 w-6 rounded-full text-[10px] font-semibold flex items-center justify-center text-white"
                      style={{ background: c.border }}
                    >
                      {a.index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">
                        {a.user ? (
                          fullName(a.user)
                        ) : (
                          <span className="text-gray-500 italic">
                            Unassigned
                          </span>
                        )}
                        {isMe ? (
                          <Badge
                            variant="outline"
                            className="ml-1 text-[9px] h-4 px-1"
                          >
                            You
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">
                        {a.user?.Position?.name || "—"}
                      </div>
                    </div>
                    {isSigned ? (
                      <div className="flex flex-col items-end">
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 px-1.5 bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Signed
                        </Badge>
                        {a.signedAt ? (
                          <span className="text-[9px] text-gray-500 mt-0.5">
                            {new Date(a.signedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 px-1.5 bg-amber-50 text-amber-700 border-amber-200"
                      >
                        <Clock className="h-2.5 w-2.5 mr-0.5" /> Pending
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div className="px-3 py-2 border-t bg-gray-50 text-[10px] text-gray-500">
            Signed{" "}
            <span className="font-semibold text-emerald-700">
              {arrangements.filter((a) => a.status === 1).length}
            </span>{" "}
            of {arrangements.length}
          </div>

        </aside>
      </div>

      {/* Confirm sign-all */}
      <Modal
        title="Sign all your pending fields?"
        onOpen={confirmOpen}
        setOnOpen={() => setConfirmOpen(false)}
        footer={true}
        yesTitle="Sign now"
        loading={signMu.isPending}
        onFunction={() => signMu.mutate()}
        className=""
      >
        <div className="space-y-2 text-xs text-gray-700">
          {/* Order-of-signing advisory — non-blocking. */}
          {earlierUnsigned.length > 0 ? (
            <div className="flex items-start gap-2 px-2 py-1.5 rounded border border-amber-200 bg-amber-50 text-[11px]">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">
                  Signing out of order.
                </span>{" "}
                {earlierUnsigned.length} earlier signator
                {earlierUnsigned.length === 1 ? "y has" : "ies have"} not
                signed yet (
                {earlierUnsigned
                  .map((a) => `#${a.index + 1} ${fullName(a.user)}`)
                  .join(", ")}
                ). You can proceed anyway — the dissemination just won't be
                marked completed until everyone has signed.
              </div>
            </div>
          ) : null}
          <div className="flex items-start gap-2 px-2 py-1.5 rounded border border-gray-200 bg-gray-50 text-[11px]">
            <AlertTriangle className="h-3.5 w-3.5 text-gray-500 mt-0.5 shrink-0" />
            <div>
              Your active e-signature will be stamped on every pending field
              assigned to you on this dissemination. This action can't be undone.
            </div>
          </div>
          <div className="text-[11px]">
            <span className="font-semibold">{signable.length}</span> pending field{signable.length === 1 ? "" : "s"} will be signed.
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default DisseminationViewPage;

// ─── One document block: renders the PDF + overlays each box ─────────
const DocumentBlock = ({
  doc,
  view,
  arrById,
  myUserId,
}: {
  doc: DisseminationView["queue"]["documents"][number];
  view: DisseminationView;
  arrById: Map<string, SigningSignatoryArrangement>;
  myUserId: string;
}) => {
  const auth = useAuth();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let revoke: string | null = null;
    setPdfUrl(null);
    fetchDocumentFile(auth.token as string, doc.id)
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
  }, [auth.token, doc.id]);

  // Build a map of placements per page once for fast lookup during render.
  const placementsByPage = useMemo(() => {
    const m = new Map<number, typeof doc.pages[number]["signCoor"]>();
    for (const p of doc.pages) m.set(p.page, p.signCoor);
    return m;
  }, [doc]);

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
        <FileText className="h-3.5 w-3.5 text-gray-600" />
        <span className="text-xs font-semibold truncate">
          {doc.title || doc.file?.fileName || "Untitled document"}
        </span>
      </div>
      <div className="p-4 flex justify-center">
        {!pdfUrl ? (
          <div className="h-48 flex items-center justify-center text-xs text-gray-500">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading document...
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
                <PagePreview
                  key={pn}
                  pageNumber={pn}
                  placements={placementsByPage.get(pn) ?? []}
                  arrById={arrById}
                  view={view}
                  myUserId={myUserId}
                />
              ))}
            </div>
          </Document>
        )}
      </div>
    </div>
  );
};

const PagePreview = ({
  pageNumber,
  placements,
  arrById,
  view,
  myUserId,
}: {
  pageNumber: number;
  placements: Array<{
    id: string;
    xAxis: number;
    yAxis: number;
    width: number;
    height: number;
    signatoryArrangementId: string | null;
  }>;
  arrById: Map<string, SigningSignatoryArrangement>;
  view: DisseminationView;
  myUserId: string;
}) => {
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
      <div className="absolute inset-0 pointer-events-none">
        {placements.map((p) => {
          const arr = p.signatoryArrangementId
            ? arrById.get(p.signatoryArrangementId)
            : null;
          const slot = (arr?.index ?? 0) + 1;
          const c = colorFor(slot);
          const isSigned = arr?.status === 1;
          const isMineSlot = arr?.userId === myUserId;
          const sigImg =
            isSigned && arr?.userId
              ? view.signaturesByUser[arr.userId]?.dataUrl
              : null;

          return (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: `${p.xAxis / 100}%`,
                top: `${p.yAxis / 100}%`,
                width: `${p.width / 100}%`,
                height: `${p.height / 100}%`,
                background: isSigned ? "transparent" : c.bg,
                border: `2px ${isSigned ? "solid" : "dashed"} ${
                  isSigned ? "#10b981" : c.border
                }`,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              {/* Label */}
              <div
                className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 select-none"
                style={{
                  background: isSigned ? "#10b981" : c.border,
                  color: "#fff",
                }}
              >
                {isSigned ? (
                  <>
                    <CheckCircle2 className="h-2.5 w-2.5" /> Signed
                  </>
                ) : (
                  <>
                    Slot #{slot}
                    {isMineSlot ? " (you)" : ""}
                  </>
                )}
              </div>
              {/* Signature image once signed, with signed-at date pill. */}
              {isSigned ? (
                <>
                  {sigImg ? (
                    <img
                      src={sigImg}
                      alt="signature"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-emerald-700 font-semibold italic px-1 text-center">
                      Signed by{" "}
                      {arr?.user
                        ? `${arr.user.firstName ?? ""} ${arr.user.lastName ?? ""}`.trim() ||
                          arr.user.username ||
                          "—"
                        : "—"}
                    </div>
                  )}
                  {arr?.signedAt ? (
                    <div className="absolute bottom-0 right-0 px-1 py-0.5 text-[9px] bg-white/85 text-emerald-700 font-semibold leading-none rounded-tl">
                      {new Date(arr.signedAt).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
