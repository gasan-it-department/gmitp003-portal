import { useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { useAuth } from "@/provider/ProtectedRoute";
import {
  usersSignature,
  uploadUserSignature,
  activateUserSignature,
  deleteUserSignature,
  setSignatureQr,
  type UserSignatureItem,
} from "@/db/statements/document";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Checkbox } from "@/components/ui/checkbox";
import Modal from "@/components/custom/Modal";
import ConfirmDelete from "@/layout/ConfirmDelete";

import {
  Signature as SignatureIcon,
  Upload,
  Loader2,
  AlertCircle,
  Search,
  Trash2,
  CheckCircle2,
  Eye,
  CalendarClock,
  Plus,
  Image as ImageIcon,
  X,
  QrCode,
} from "lucide-react";

interface ListProps {
  list: UserSignatureItem[];
  hasMore: boolean;
  lastCursor: string | null;
}

const surfaceErr = (err: unknown, fallback: string) =>
  isAxiosError(err)
    ? err.response?.data?.message ?? err.message
    : err instanceof Error
      ? err.message
      : fallback;

const fmt = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

// Subtle transparent-checker background so users can see the signature
// has an alpha channel.
const CHECKER_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
};

const ManageSignature = () => {
  const auth = useAuth();
  const queryClient = useQueryClient();

  // Per-signature QR toggle. Each Signature row in the list carries its
  // own `qrEnabled` flag, so users can have signature A with QR on and
  // signature B with QR off. Toggle is rendered on each card below.
  const setSigQrMu = useMutation({
    mutationFn: (b: { id: string; qrEnabled: boolean }) =>
      setSignatureQr(auth.token as string, {
        id: b.id,
        userId: auth.userId as string,
        qrEnabled: b.qrEnabled,
      }),
    onMutate: async (vars) => {
      // Optimistic: flip the card immediately, roll back on error.
      // Query key matches `useInfiniteQuery` below: ["user-signature", userId, query].
      await queryClient.cancelQueries({ queryKey: ["user-signature"] });
      const snap = queryClient.getQueriesData<{
        pages: { list: UserSignatureItem[] }[];
      }>({ queryKey: ["user-signature"] });
      queryClient.setQueriesData<{
        pages: { list: UserSignatureItem[] }[];
      }>({ queryKey: ["user-signature"] }, (old) => {
        if (!old) return old as any;
        return {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            list: p.list.map((s) =>
              s.id === vars.id ? { ...s, qrEnabled: vars.qrEnabled } : s,
            ),
          })),
        };
      });
      return { snap };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.snap) {
        for (const [key, data] of ctx.snap) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(surfaceErr(err, "Failed to update QR setting"));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-signature"] });
    },
  });

  const [text, setText] = useState("");
  const [query] = useDebounce(text, 400);
  const [openModal, setOpenModal] = useState<
    | { kind: "preview"; item: UserSignatureItem }
    | { kind: "delete"; item: UserSignatureItem }
    | { kind: "upload" }
    | null
  >(null);

  const {
    data,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
    refetch,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["user-signature", auth.userId, query],
    queryFn: ({ pageParam }) =>
      usersSignature(
        auth.token as string,
        auth.userId as string,
        pageParam as string | null,
        "20",
        query,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!auth.token && !!auth.userId,
    refetchOnWindowFocus: false,
  });

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const items = data?.pages.flatMap((p) => p.list) ?? [];
  const total = items.length;
  const activeId = items.find((i) => i.active)?.id ?? null;

  const refreshList = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["user-signature", auth.userId],
    });
    await refetch();
  };

  const activateMut = useMutation({
    mutationFn: (id: string) =>
      activateUserSignature(
        auth.token as string,
        id,
        auth.userId as string,
      ),
    onSuccess: async () => {
      await refreshList();
      toast.success("Signature set as active");
    },
    onError: (err) => toast.error(surfaceErr(err, "Failed to activate")),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      deleteUserSignature(
        auth.token as string,
        id,
        auth.userId as string,
      ),
    onSuccess: async () => {
      await refreshList();
      toast.success("Signature removed");
      setOpenModal(null);
    },
    onError: (err) => toast.error(surfaceErr(err, "Failed to remove")),
  });

  const uploadMut = useMutation({
    mutationFn: (vars: { file: File; title: string; active: boolean }) =>
      uploadUserSignature(
        auth.token as string,
        auth.userId as string,
        vars.file,
        vars.title,
        vars.active,
      ),
    onSuccess: async () => {
      await refreshList();
      toast.success("Signature uploaded");
      setOpenModal(null);
    },
    onError: (err) => toast.error(surfaceErr(err, "Failed to upload")),
  });

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
              <SignatureIcon className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-gray-900 truncate">
                Signature Management
              </h1>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                Upload, preview, set active, and remove your signatures
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setOpenModal({ kind: "upload" })}
            className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-3 w-3" />
            Upload Signature
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-3 py-2 flex items-center gap-1.5 flex-shrink-0">
        <InputGroup className="bg-white flex-1 max-w-xs">
          <InputGroupAddon>
            <Search className="h-3 w-3 text-gray-400" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by title..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-7 text-[11px]"
          />
        </InputGroup>
        <div className="ml-auto flex items-center gap-1.5">
          {activeId && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200"
            >
              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
              Active set
            </Badge>
          )}
          <span className="text-[10px] text-gray-500">
            {total} signature{total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <div className="max-w-5xl mx-auto">
          {isError ? (
            <div className="border rounded-lg bg-white p-6 text-center max-w-sm mx-auto">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-xs font-semibold text-gray-900 mb-1">
                Failed to load signatures
              </h3>
              <p className="text-[10px] text-gray-500 mb-3">
                {(error as any)?.message ?? "Try again later."}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                className="h-7 text-[10px]"
              >
                Retry
              </Button>
            </div>
          ) : isFetching && total === 0 ? (
            <div className="flex items-center justify-center py-16 gap-1.5 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-[10px]">Loading signatures...</span>
            </div>
          ) : total === 0 ? (
            <div className="border rounded-lg bg-white border-dashed py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                <SignatureIcon className="h-6 w-6 text-gray-300" />
              </div>
              <h3 className="text-xs font-semibold text-gray-700">
                No signatures yet
              </h3>
              <p className="text-[10px] text-gray-500 mt-1 max-w-xs mx-auto">
                Upload a transparent PNG or SVG of your signature so you can
                sign documents inside the portal.
              </p>
              <Button
                size="sm"
                onClick={() => setOpenModal({ kind: "upload" })}
                className="h-7 text-[10px] gap-1.5 mt-3 bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="h-3 w-3" />
                Upload your first
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {items.map((sig) => (
                <SignatureCard
                  key={sig.id}
                  sig={sig}
                  onPreview={() =>
                    setOpenModal({ kind: "preview", item: sig })
                  }
                  onActivate={() => activateMut.mutateAsync(sig.id)}
                  onDelete={() =>
                    setOpenModal({ kind: "delete", item: sig })
                  }
                  onToggleQr={(next) =>
                    setSigQrMu.mutate({ id: sig.id, qrEnabled: next })
                  }
                  qrPending={setSigQrMu.isPending}
                  pendingActivate={activateMut.isPending}
                />
              ))}
            </div>
          )}

          {hasNextPage && (
            <div ref={ref} className="text-center py-3">
              {isFetchingNextPage ? (
                <div className="inline-flex items-center gap-1.5 text-gray-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-[10px]">Loading more...</span>
                </div>
              ) : (
                <span className="text-[10px] text-gray-400">
                  Scroll to load more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview modal */}
      <Modal
        title={undefined}
        onOpen={openModal?.kind === "preview"}
        className="max-w-lg"
        footer={1}
        setOnOpen={() => setOpenModal(null)}
      >
        {openModal?.kind === "preview" && (
          <div className="p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2 pb-2 border-b">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {openModal.item.title}
                </p>
                <p className="text-[10px] text-gray-500">
                  {fmt(openModal.item.timestamp)} ·{" "}
                  {(openModal.item.size / 1024).toFixed(1)} KB
                </p>
              </div>
              {openModal.item.active && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 flex-shrink-0"
                >
                  Active
                </Badge>
              )}
            </div>
            <div
              className="border rounded-md p-4 flex items-center justify-center min-h-[160px]"
              style={CHECKER_STYLE}
            >
              {openModal.item.preview ? (
                <img
                  src={openModal.item.preview}
                  alt={openModal.item.title}
                  className="max-h-48 w-auto object-contain"
                />
              ) : (
                <p className="text-[10px] text-gray-400 italic">
                  No preview available
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        title={undefined}
        onOpen={openModal?.kind === "delete"}
        className=""
        footer={1}
        setOnOpen={() => {
          if (deleteMut.isPending) return;
          setOpenModal(null);
        }}
      >
        {openModal?.kind === "delete" && (
          <ConfirmDelete
            title="Remove signature"
            confirmation="confirm"
            setOnOpen={() => {
              if (!deleteMut.isPending) setOpenModal(null);
            }}
            onFunction={() => {
              if (!deleteMut.isPending)
                deleteMut.mutateAsync(openModal.item.id);
            }}
            isLoading={deleteMut.isPending}
          />
        )}
      </Modal>

      {/* Upload modal */}
      <UploadModal
        isOpen={openModal?.kind === "upload"}
        onClose={() => setOpenModal(null)}
        onUpload={(v) => uploadMut.mutateAsync(v)}
        isPending={uploadMut.isPending}
        hasNoneYet={total === 0}
      />
    </div>
  );
};

// ── Signature card ─────────────────────────────────────────────────────
const SignatureCard = ({
  sig,
  onPreview,
  onActivate,
  onDelete,
  onToggleQr,
  qrPending,
  pendingActivate,
}: {
  sig: UserSignatureItem;
  onPreview: () => void;
  onActivate: () => void;
  onDelete: () => void;
  onToggleQr: (next: boolean) => void;
  qrPending: boolean;
  pendingActivate: boolean;
}) => {
  const isActive = sig.active;
  const qrOn = !!sig.qrEnabled;
  return (
    <div
      className={`border rounded-lg bg-white overflow-hidden ${
        isActive ? "border-emerald-300 ring-2 ring-emerald-100" : ""
      }`}
    >
      <div className="px-2.5 py-1.5 border-b bg-gray-50 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-gray-900 truncate">
            {sig.title}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <CalendarClock className="h-2.5 w-2.5" />
            {fmt(sig.timestamp)}
          </div>
        </div>
        {isActive && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 flex-shrink-0"
          >
            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
            Active
          </Badge>
        )}
      </div>
      <button
        type="button"
        className="h-32 w-full flex items-center justify-center p-2 cursor-zoom-in"
        style={CHECKER_STYLE}
        onClick={onPreview}
        title="Click to preview"
      >
        {sig.preview ? (
          <img
            src={sig.preview}
            alt={sig.title}
            className="max-h-full w-auto object-contain"
          />
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <ImageIcon className="h-6 w-6" />
            <span className="text-[10px] mt-1">No preview</span>
          </div>
        )}
      </button>
      {/* Per-signature QR toggle. Stamps a verification QR beside any box
          that used THIS signature on downloaded PDFs. */}
      <button
        type="button"
        onClick={() => onToggleQr(!qrOn)}
        disabled={qrPending}
        className={`w-full px-2.5 py-1.5 border-t flex items-center gap-1.5 text-[10px] transition ${
          qrOn
            ? "bg-blue-50/40 text-blue-700"
            : "bg-white text-gray-600 hover:bg-gray-50"
        } disabled:opacity-50`}
        title={
          qrOn
            ? "Verification QR will be stamped beside this signature on downloads. Click to disable."
            : "When ON, downloads of signed PDFs add a small QR beside this signature encoding page, coordinates, signedAt and signer id. Click to enable."
        }
      >
        <QrCode className="h-3 w-3" />
        <span className="flex-1 text-left">Verification QR</span>
        <span
          aria-hidden
          className={`relative inline-block h-3.5 w-6 rounded-full transition ${
            qrOn ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all ${
              qrOn ? "left-[12px]" : "left-0.5"
            }`}
          />
        </span>
      </button>
      <div className="px-2 py-1.5 border-t flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={onPreview}
          className="h-6 px-1.5 text-[10px] gap-1 flex-1"
        >
          <Eye className="h-3 w-3" />
          View
        </Button>
        <Button
          size="sm"
          variant={isActive ? "outline" : "default"}
          disabled={isActive || pendingActivate}
          onClick={onActivate}
          className={`h-6 px-1.5 text-[10px] gap-1 flex-1 ${
            !isActive ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
          }`}
        >
          {pendingActivate && !isActive ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3 w-3" />
          )}
          {isActive ? "Active" : "Set active"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="h-6 w-6 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

// ── Upload modal (inline) ──────────────────────────────────────────────
const UploadModal = ({
  isOpen,
  onClose,
  onUpload,
  isPending,
  hasNoneYet,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (vars: {
    file: File;
    title: string;
    active: boolean;
  }) => Promise<unknown>;
  isPending: boolean;
  hasNoneYet: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [active, setActive] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setTitle("");
    setActive(false);
    setDragOver(false);
  };

  const accept = (f: File | null | undefined) => {
    if (!f) return;
    if (
      !/^image\//.test(f.type) &&
      !/\.(png|jpe?g|webp|svg)$/i.test(f.name)
    ) {
      toast.error("Pick a PNG, JPEG, WEBP, or SVG image.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("File is larger than 5 MB.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").slice(0, 40));
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Select a signature file first.");
      return;
    }
    await onUpload({ file, title: title.trim(), active });
    reset();
  };

  return (
    <Modal
      title="Upload Signature"
      onOpen={isOpen}
      className="max-w-md"
      footer={true}
      yesTitle="Upload"
      loading={isPending}
      setOnOpen={() => {
        if (isPending) return;
        reset();
        onClose();
      }}
      onFunction={handleSubmit}
    >
      <div className="space-y-3">
        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            accept(e.dataTransfer.files?.[0]);
          }}
          className={`w-full border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
            dragOver
              ? "border-blue-500 bg-blue-50/60"
              : "border-gray-200 bg-gray-50 hover:bg-gray-100"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => accept(e.target.files?.[0])}
          />
          {file && previewUrl ? (
            <>
              <div
                className="border rounded p-2 bg-white max-h-32 overflow-hidden flex items-center justify-center"
                style={CHECKER_STYLE}
              >
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="max-h-24 w-auto object-contain"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] text-gray-700 font-medium truncate max-w-[200px]">
                  {file.name}
                </p>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {(file.size / 1024).toFixed(1)} KB
                </Badge>
                <button
                  type="button"
                  className="text-gray-400 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className="text-[10px] text-gray-500">
                Click to replace
              </p>
            </>
          ) : (
            <>
              <div className="p-2 bg-blue-50 rounded-full">
                <Upload className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xs font-semibold text-gray-800">
                Drop your signature here
              </p>
              <p className="text-[10px] text-gray-500 text-center">
                PNG with a transparent background works best.<br />
                JPEG, WEBP, SVG also accepted · max 5 MB
              </p>
            </>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="text-[10px] font-semibold text-gray-700">
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Main signature"
            className="h-8 text-xs mt-1"
            disabled={isPending}
          />
          <p className="text-[10px] text-gray-500 mt-1">
            A short label so you can tell signatures apart later.
          </p>
        </div>

        {/* Set active */}
        <label className="flex items-start gap-2 cursor-pointer">
          <Checkbox
            checked={active || hasNoneYet}
            disabled={hasNoneYet || isPending}
            onCheckedChange={(v) => setActive(!!v)}
            className="mt-0.5"
          />
          <div>
            <p className="text-[11px] font-medium text-gray-800">
              Use as my active signature
            </p>
            <p className="text-[10px] text-gray-500">
              {hasNoneYet
                ? "This is your first signature — it will be activated automatically."
                : "Replaces the current active signature."}
            </p>
          </div>
        </label>
      </div>
    </Modal>
  );
};

export default ManageSignature;
