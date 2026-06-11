import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useAuth } from "@/provider/ProtectedRoute";
import {
  createComplaint,
  listComplaints,
  listServiceLineUsers,
  removeComplaint,
  type ComplaintItem,
  type LineUserMini,
} from "@/db/statements/service";
//
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Modal from "@/components/custom/Modal";
import {
  ArrowLeft,
  MessageSquareWarning,
  Plus,
  Loader2,
  Inbox,
  Trash2,
  Search,
  MessageSquare,
  Paperclip,
  Upload,
  X,
  User as UserIcon,
  UserX,
} from "lucide-react";

const surfaceErr = (err: unknown, fallback = "Something went wrong") => {
  const e = err as any;
  return e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  open:         { label: "Open",        cls: "bg-amber-50 text-amber-700 border-amber-200" },
  in_progress:  { label: "In Progress", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  resolved:     { label: "Resolved",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed:       { label: "Closed",      cls: "bg-gray-100 text-gray-700 border-gray-200" },
};
const PRIORITY: Record<string, string> = {
  low:    "bg-gray-50 text-gray-700 border-gray-200",
  normal: "bg-blue-50 text-blue-700 border-blue-200",
  high:   "bg-rose-50 text-rose-700 border-rose-200",
};
const CATEGORIES = [
  { key: "general",    label: "General" },
  { key: "hr",         label: "HR" },
  { key: "facilities", label: "Facilities" },
  { key: "it",         label: "IT" },
  { key: "payroll",    label: "Payroll" },
  { key: "safety",     label: "Safety" },
];

const fullName = (u?: LineUserMini | null) =>
  `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || u?.username || "—";

const Complaints = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  const qc = useQueryClient();
  const [onOpen, setOnOpen] = useState(false);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);

  const { ref } = useInView({
    onChange(inView) {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["complaints", "mine", auth.userId, status],
    queryFn: ({ pageParam }) =>
      listComplaints(auth.token as string, {
        userId: auth.userId as string,
        status,
        lastCursor: pageParam,
        limit: "20",
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (l) => (l.hasMore ? l.lastCursor : undefined),
    enabled: !!auth.token && !!auth.userId,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
  const rows = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.list),
    [data],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        fullName(r.againstUser).toLowerCase().includes(q),
    );
  }, [rows, query]);

  const removeMu = useMutation({
    mutationFn: (id: string) =>
      removeComplaint(auth.token as string, id, auth.userId as string),
    onSuccess: () => {
      setRemoveId(null);
      qc.invalidateQueries({ queryKey: ["complaints", "mine", auth.userId] });
    },
    onError: (e) => alert(surfaceErr(e)),
  });

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
        <Link
          to={`/${lineId}/services`}
          className="h-7 px-2 rounded hover:bg-white border bg-white text-[10px] flex items-center gap-1 text-gray-600"
        >
          <ArrowLeft className="h-3 w-3" /> Services
        </Link>
        <div className="h-7 w-7 rounded-md bg-white border flex items-center justify-center">
          <MessageSquareWarning className="h-3.5 w-3.5 text-gray-700" />
        </div>
        <div>
          <div className="text-xs font-semibold">My Complaints</div>
          <div className="text-[10px] text-gray-500">
            File concerns about coworkers or operations with evidence.
          </div>
        </div>
      </div>

      <div className="px-3 py-2 border-b flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, description, person..."
            className="h-7 pl-7 text-xs"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-7 text-xs w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All status</SelectItem>
            <SelectItem value="open" className="text-xs">Open</SelectItem>
            <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
            <SelectItem value="resolved" className="text-xs">Resolved</SelectItem>
            <SelectItem value="closed" className="text-xs">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-7 text-xs ml-auto"
          onClick={() => setOnOpen(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> New complaint
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="h-40 flex items-center justify-center text-xs text-gray-500">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center">
            <Inbox className="h-6 w-6 text-gray-300 mb-2" />
            <div className="text-xs font-medium text-gray-700">
              No complaints yet
            </div>
            <div className="text-[10px] text-gray-500">
              Click <span className="font-semibold">New complaint</span> to file one.
            </div>
          </div>
        ) : (
          <div className="border rounded-lg bg-white overflow-hidden divide-y">
            {filtered.map((r: ComplaintItem) => {
              const s = STATUS[r.status] ?? STATUS.open;
              const targetName = fullName(r.againstUser);
              return (
                <Link
                  to={r.id}
                  key={r.id}
                  className="px-3 py-2 flex items-center gap-3 hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium truncate">
                        {r.title}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-5 px-1.5 ${s.cls}`}
                      >
                        {s.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-5 px-1.5 ${PRIORITY[r.priority] ?? ""}`}
                      >
                        {r.priority}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        {r.category}
                      </Badge>
                      {r.againstUser ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 px-1.5 bg-rose-50 text-rose-700 border-rose-200"
                        >
                          <UserX className="h-2.5 w-2.5 mr-0.5" />
                          vs. {targetName}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-[10px] text-gray-500 flex items-center gap-3 flex-wrap">
                      <span className="truncate max-w-md">
                        {r.description}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {r._count?.replies ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        {r._count?.evidence ?? 0}
                      </span>
                      <span className="text-gray-400">
                        {new Date(r.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {r.status === "open" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setRemoveId(r.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </Link>
              );
            })}
            <div ref={ref} className="h-6 flex items-center justify-center">
              {isFetchingNextPage ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
              ) : null}
            </div>
          </div>
        )}
      </div>

      <NewComplaintModal
        open={onOpen}
        onClose={() => setOnOpen(false)}
        onSaved={() =>
          qc.invalidateQueries({ queryKey: ["complaints", "mine", auth.userId] })
        }
      />

      <Modal
        title="Withdraw complaint?"
        onOpen={!!removeId}
        setOnOpen={() => setRemoveId(null)}
        footer={true}
        yesTitle="Withdraw"
        loading={removeMu.isPending}
        onFunction={() => removeId && removeMu.mutate(removeId)}
        className=""
      >
        <p className="text-xs text-gray-600">
          This will permanently delete the complaint and all its evidence.
          Only open complaints can be withdrawn.
        </p>
      </Modal>
    </div>
  );
};

export default Complaints;

// ─── New complaint modal: user picker + multi-file evidence ───────────
const NewComplaintModal = ({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const auth = useAuth();
  const { lineId } = useParams();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [description, setDescription] = useState("");
  const [againstUser, setAgainstUser] = useState<LineUserMini | null>(null);
  const [picker, setPicker] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle("");
    setCategory("general");
    setPriority("normal");
    setDescription("");
    setAgainstUser(null);
    setFiles([]);
  };

  const mu = useMutation({
    mutationFn: () =>
      createComplaint(auth.token as string, {
        userId: auth.userId as string,
        lineId: lineId as string,
        title,
        category,
        priority,
        description,
        againstUserId: againstUser?.id,
        files,
      }),
    onSuccess: () => {
      onSaved();
      reset();
      onClose();
    },
    onError: (e) => alert(surfaceErr(e)),
  });

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  };
  const removeFile = (i: number) =>
    setFiles((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <>
      <Modal
        title="File a complaint"
        onOpen={open}
        setOnOpen={() => {
          reset();
          onClose();
        }}
        footer={true}
        yesTitle="Submit"
        loading={mu.isPending}
        onFunction={() => mu.mutate()}
        className="sm:max-w-2xl"
      >
        <div className="space-y-2.5">
          <div>
            <label className="text-[10px] font-semibold uppercase text-gray-600">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs"
              placeholder="Short summary"
            />
          </div>

          {/* Against-user picker */}
          <div>
            <label className="text-[10px] font-semibold uppercase text-gray-600">
              Complaint against
            </label>
            {againstUser ? (
              <div className="border rounded-md p-2 flex items-center gap-2 bg-rose-50/40 border-rose-200">
                <div className="h-6 w-6 rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold flex items-center justify-center">
                  {(againstUser.firstName?.[0] ?? "") + (againstUser.lastName?.[0] ?? "")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">
                    {fullName(againstUser)}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">
                    {againstUser.Position?.name || "—"}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-500"
                  onClick={() => setAgainstUser(null)}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs w-full justify-start"
                onClick={() => setPicker(true)}
              >
                <UserIcon className="h-3.5 w-3.5 mr-1 text-gray-500" />
                Choose a person to complain about (optional)
              </Button>
            )}
            <div className="text-[10px] text-gray-500 mt-1">
              Leave empty if this isn't about a specific coworker.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold uppercase text-gray-600">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key} className="text-xs">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase text-gray-600">
                Priority
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="text-xs">Low</SelectItem>
                  <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                  <SelectItem value="high" className="text-xs">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase text-gray-600">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[100px]"
              placeholder="Describe what happened, when, and the impact..."
            />
          </div>

          {/* Evidence */}
          <div>
            <label className="text-[10px] font-semibold uppercase text-gray-600">
              Evidence (optional)
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-md p-3 text-center hover:border-blue-400 cursor-pointer transition"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
            >
              <Upload className="h-5 w-5 text-gray-400 mx-auto mb-1" />
              <div className="text-[11px] text-gray-700 font-medium">
                Drop files here or click to upload
              </div>
              <div className="text-[10px] text-gray-500">
                PNG, JPG, WebP, GIF, PDF · up to 10MB each
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf"
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>
            {files.length > 0 ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="border rounded-md px-2 py-1.5 flex items-center gap-2"
                  >
                    <Paperclip className="h-3 w-3 text-gray-500" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-medium truncate">
                        {f.name}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {(f.size / 1024).toFixed(0)} KB
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-rose-600"
                      onClick={() => removeFile(i)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Modal>

      <UserPickerModal
        open={picker}
        onClose={() => setPicker(false)}
        lineId={lineId as string}
        excludeUserId={auth.userId as string}
        onPick={(u) => {
          setAgainstUser(u);
          setPicker(false);
        }}
      />
    </>
  );
};

// ─── Coworker picker ──────────────────────────────────────────────────
const UserPickerModal = ({
  open,
  onClose,
  lineId,
  excludeUserId,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  lineId: string;
  excludeUserId: string;
  onPick: (u: LineUserMini) => void;
}) => {
  const auth = useAuth();
  const [query, setQuery] = useState("");

  // Load once, filter client-side for instant feel.
  const { data, isLoading } = useQuery({
    queryKey: ["service-line-users", lineId],
    queryFn: () => listServiceLineUsers(auth.token as string, lineId, ""),
    enabled: !!auth.token && !!lineId && open,
  });

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const users = (data?.list ?? []).filter((u) => u.id !== excludeUserId);
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = fullName(u).toLowerCase();
      const pos = (u.Position?.name ?? "").toLowerCase();
      return name.includes(q) || pos.includes(q);
    });
  }, [data, query, excludeUserId]);

  return (
    <Modal
      title="Choose coworker"
      onOpen={open}
      setOnOpen={onClose}
      footer={1}
      onFunction={() => {}}
      className=""
    >
      <div className="space-y-2">
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or position..."
            className="h-8 pl-7 text-xs"
            autoFocus
          />
        </div>
        <div className="border rounded-md max-h-72 overflow-auto divide-y">
          {isLoading ? (
            <div className="h-24 flex items-center justify-center text-xs text-gray-500">
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-xs text-gray-500">
              No coworkers found.
            </div>
          ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => onPick(u)}
                className="w-full px-3 py-2 hover:bg-blue-50/40 flex items-center gap-2 text-left"
              >
                <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold flex items-center justify-center">
                  {(u.firstName?.[0] ?? "") + (u.lastName?.[0] ?? "")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">
                    {fullName(u)}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">
                    {u.Position?.name || "—"}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
