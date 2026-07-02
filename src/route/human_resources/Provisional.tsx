import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";

import { useAuth } from "@/provider/ProtectedRoute";
import {
  provisionalPositionsList,
  createProvisionalPosition,
  provisionalInvite,
  provisionalPersonnel,
  downloadProvisionalPersonnelExcel,
  provisionalTransfer,
  provisionalRemove,
  provisionalRenew,
  updateProvisionalPosition,
  updateProvisionalPersonnel,
  getLinetUnits,
  lineApplications,
} from "@/db/statement";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Modal from "@/components/custom/Modal";
import FormTags from "@/layout/FormTags";
import { Checkbox } from "@/components/ui/checkbox";

import {
  ArrowLeftRight,
  Briefcase,
  CalendarPlus,
  CheckSquare,
  Clock4,
  FileSpreadsheet,
  Filter,
  ListRestart,
  Loader2,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  UserCheck,
  UserCircle,
  UserCog,
  UserMinus,
  Users,
  X,
} from "lucide-react";

const EMP_TYPES = [
  "Job Order",
  "Contract of Service",
  "Casual",
  "Contractual",
  "Temporary",
];
// Positions no longer carry an employment type, but the backend still requires
// one — store a neutral placeholder so creation validates.
const DEFAULT_PROV_EMP_TYPE = "Non-Plantilla";
const TERM_OPTIONS = [3, 6, 9, 12, 24];

interface Page<T> {
  list: T[];
  hasMore: boolean;
  lastCursor: string | null;
}
interface ProvPosition {
  id: string;
  title: string;
  empType: string;
  termMonths: number;
  slots: number;
  description?: string | null;
  filled: number;
  pending: number;
  open: number;
  salaryGrade?: { id: string; grade: number; amount: number } | null;
}
interface Personnel {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  username?: string | null;
  status: string;
  term?: string | null;
  department?: { name?: string | null } | null;
  SalaryGrade?: { id: string; grade: number; amount: number } | null;
  submittedApplications?: {
    ApplicationSkillTags?: { id: string; tags: string | null }[];
  } | null;
}
interface Applicant {
  id: string;
  firstname: string;
  lastname: string;
}

const Provisional = () => {
  const { lineId } = useParams();
  const nav = useNavigate();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const token = auth.token as string;

  const [posText, setPosText] = useState("");
  const [posQuery] = useDebounce(posText, 600);
  const [persText, setPersText] = useState("");
  const [persQuery] = useDebounce(persText, 600);
  const [persStatus, setPersStatus] = useState("all");
  const [persTerm, setPersTerm] = useState("all");
  const [exporting, setExporting] = useState(false);

  // ── Skill-tag filter (multi-select popup, mirrors the Applications filter) ─
  type TagSel = { tag: string; cont: string };
  const [appliedTags, setAppliedTags] = useState<TagSel[]>([]);
  const [tagDraft, setTagDraft] = useState<TagSel[]>([]);
  const [tagsOpen, setTagsOpen] = useState(false);
  const tagList = appliedTags.map((t) => t.tag);

  // ── Multi-select ─────────────────────────────────────────────────────────
  const [onMultiSelect, setOnMultiSelect] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  // ── Transfer / remove / renew modal state ────────────────────────────────
  // An action target is one row OR the current multi-selection.
  type ActionTarget = {
    ids: string[];
    label: string;
    status?: string;
    term?: string | null;
    current?: string | null;
  };
  const [transferFor, setTransferFor] = useState<ActionTarget | null>(null);
  const [transferUnitId, setTransferUnitId] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [removeFor, setRemoveFor] = useState<ActionTarget | null>(null);
  const [removeMessage, setRemoveMessage] = useState("");
  const [removing, setRemoving] = useState(false);
  const [renewFor, setRenewFor] = useState<ActionTarget | null>(null);
  const [renewMonths, setRenewMonths] = useState(3);
  const [renewing, setRenewing] = useState(false);

  // ── Create-position modal state ──────────────────────────────────────────
  const [newOpen, setNewOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [empType, setEmpType] = useState(DEFAULT_PROV_EMP_TYPE);
  const [termMonths, setTermMonths] = useState(3);
  const [slots, setSlots] = useState(1);
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── Edit-personnel modal state ───────────────────────────────────────────
  const [editPers, setEditPers] = useState<Personnel | null>(null);
  const [editPersStatus, setEditPersStatus] = useState("");
  const [savingPers, setSavingPers] = useState(false);

  // ── Hire modal state ─────────────────────────────────────────────────────
  const [hireFor, setHireFor] = useState<ProvPosition | null>(null);
  const [hireUnitId, setHireUnitId] = useState("");
  const [pickedApplicant, setPickedApplicant] = useState<Applicant | null>(null);
  const [hireMessage, setHireMessage] = useState("");
  const [applicantText, setApplicantText] = useState("");
  const [applicantQuery] = useDebounce(applicantText, 500);
  const [inviting, setInviting] = useState(false);

  // ── Positions list ───────────────────────────────────────────────────────
  const pos = useInfiniteQuery<Page<ProvPosition>>({
    queryKey: ["provisional-positions", lineId, posQuery],
    queryFn: ({ pageParam }) =>
      provisionalPositionsList(
        token,
        lineId as string,
        pageParam as string | null,
        "20",
        posQuery,
      ),
    initialPageParam: null,
    getNextPageParam: (last) => (last.hasMore ? last.lastCursor : undefined),
    enabled: !!token && !!lineId,
    refetchOnWindowFocus: false,
  });
  const positions = pos.data?.pages.flatMap((p) => p.list) ?? [];
  const { ref: posRef } = useInView({
    threshold: 0.5,
    onChange: (v) => {
      if (v && pos.hasNextPage && !pos.isFetchingNextPage) pos.fetchNextPage();
    },
  });

  // ── Personnel list ───────────────────────────────────────────────────────
  const pers = useInfiniteQuery<Page<Personnel>>({
    queryKey: [
      "provisional-personnel",
      lineId,
      persQuery,
      persStatus,
      persTerm,
      tagList,
    ],
    queryFn: ({ pageParam }) =>
      provisionalPersonnel(
        token,
        lineId as string,
        pageParam as string | null,
        "20",
        persQuery,
        persStatus === "all" ? undefined : persStatus,
        persTerm === "all" ? undefined : persTerm,
        tagList.length ? tagList : undefined,
      ),
    initialPageParam: null,
    getNextPageParam: (last) => (last.hasMore ? last.lastCursor : undefined),
    enabled: !!token && !!lineId,
    refetchOnWindowFocus: false,
  });
  const personnel = pers.data?.pages.flatMap((p) => p.list) ?? [];
  const { ref: persRef } = useInView({
    threshold: 0.5,
    onChange: (v) => {
      if (v && pers.hasNextPage && !pers.isFetchingNextPage) pers.fetchNextPage();
    },
  });

  // Units for the hire-time + transfer unit pickers.
  const units = useQuery<Page<{ id: string; name?: string | null }>>({
    queryKey: ["units-for-provisional", lineId],
    queryFn: () => getLinetUnits(token, lineId as string, null, "100", ""),
    enabled: !!token && !!lineId && (!!hireFor || !!transferFor),
    refetchOnWindowFocus: false,
  });

  // Eligible applicants for the hire picker.
  const applicants = useQuery<Page<Applicant>>({
    queryKey: ["prov-eligible-applicants", lineId, applicantQuery],
    queryFn: () =>
      lineApplications(
        token,
        lineId as string,
        null,
        "30",
        applicantQuery,
        [],
        undefined,
        undefined,
        undefined,
        true,
      ),
    enabled: !!token && !!lineId && !!hireFor,
    refetchOnWindowFocus: false,
  });

  const resetCreate = () => {
    setTitle("");
    setEmpType(DEFAULT_PROV_EMP_TYPE);
    setTermMonths(3);
    setSlots(1);
    setDescription("");
  };

  const openCreate = () => {
    setEditingId(null);
    resetCreate();
    setNewOpen(true);
  };

  const openEditPosition = (p: ProvPosition) => {
    setEditingId(p.id);
    setTitle(p.title);
    setEmpType(p.empType || DEFAULT_PROV_EMP_TYPE);
    setTermMonths(p.termMonths);
    setSlots(p.slots);
    setDescription(p.description ?? "");
    setNewOpen(true);
  };

  const submitCreate = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setCreating(true);
    try {
      if (editingId) {
        await updateProvisionalPosition(token, {
          positionId: editingId,
          title: title.trim(),
          empType,
          termMonths,
          slots,
          description: description.trim() || null,
          lineId: lineId as string,
          userId: auth.userId as string,
        });
        toast.success("Position updated");
      } else {
        await createProvisionalPosition(token, {
          title: title.trim(),
          empType,
          termMonths,
          slots,
          description: description.trim() || null,
          lineId: lineId as string,
          userId: auth.userId as string,
        });
        toast.success("Non-plantilla position created");
      }
      setNewOpen(false);
      setEditingId(null);
      resetCreate();
      queryClient.invalidateQueries({ queryKey: ["provisional-positions"] });
    } catch (e) {
      toast.error(
        editingId ? "Failed to update position" : "Failed to create position",
        { description: `${e}` },
      );
    } finally {
      setCreating(false);
    }
  };

  const openEditPersonnel = (u: Personnel) => {
    setEditPers(u);
    setEditPersStatus(u.status);
  };

  const submitEditPersonnel = async () => {
    if (!editPers) return;
    setSavingPers(true);
    try {
      await updateProvisionalPersonnel(token, {
        userId: editPers.id,
        status: editPersStatus,
        actorId: auth.userId as string,
        lineId: lineId as string,
      });
      toast.success(
        `${editPers.firstName} ${editPers.lastName} updated`,
      );
      setEditPers(null);
      queryClient.invalidateQueries({ queryKey: ["provisional-personnel"] });
    } catch (e) {
      toast.error("Failed to update personnel", { description: `${e}` });
    } finally {
      setSavingPers(false);
    }
  };

  const openHire = (p: ProvPosition) => {
    setHireFor(p);
    setHireUnitId("");
    setPickedApplicant(null);
    setHireMessage("");
    setApplicantText("");
  };

  const submitInvite = async () => {
    if (!hireFor || !hireUnitId || !pickedApplicant) {
      toast.error("Pick a unit and an applicant");
      return;
    }
    setInviting(true);
    try {
      await provisionalInvite(token, {
        applicationIds: [pickedApplicant.id],
        provisionalPositionId: hireFor.id,
        unitId: hireUnitId,
        userId: auth.userId as string,
        lineId: lineId as string,
        message: hireMessage.trim() || null,
      });
      toast.success(
        `Invitation sent to ${pickedApplicant.firstname} ${pickedApplicant.lastname}`,
      );
      setHireFor(null);
      queryClient.invalidateQueries({ queryKey: ["provisional-positions"] });
    } catch (e) {
      toast.error("Failed to send invite", { description: `${e}` });
    } finally {
      setInviting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadProvisionalPersonnelExcel(
        token,
        lineId as string,
        persQuery,
        persStatus === "all" ? undefined : persStatus,
        persTerm === "all" ? undefined : persTerm,
        tagList.length ? tagList : undefined,
      );
      toast.success("Personnel list downloaded");
    } catch (e) {
      toast.error("Failed to export", { description: `${e}` });
    } finally {
      setExporting(false);
    }
  };

  // Skill-tag picker callbacks (same contract as the Applications filter).
  const handleCheckTags = (tag: string) => {
    const index = tagDraft.findIndex((t) => t.tag === tag);
    return { res: index > -1, index };
  };
  const handleAddTags = (tag: string, cont: string) => {
    setTagDraft((prev) => {
      const i = prev.findIndex((t) => t.tag === tag);
      if (i > -1) return prev.filter((_, idx) => idx !== i);
      return [...prev, { tag, cont }];
    });
  };
  const openTagsModal = () => {
    setTagDraft(appliedTags);
    setTagsOpen(true);
  };
  const applyTags = () => {
    setAppliedTags(tagDraft);
    setTagsOpen(false);
  };
  const clearTags = () => {
    setAppliedTags([]);
    setTagDraft([]);
  };

  // ── Multi-select helpers ────────────────────────────────────────────────
  const isSelected = (id: string) => selected.includes(id);
  const toggleSelect = (id: string) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const allOnPageSelected =
    personnel.length > 0 && personnel.every((u) => selected.includes(u.id));
  const toggleSelectAll = () =>
    setSelected(allOnPageSelected ? [] : personnel.map((u) => u.id));
  const exitMultiSelect = () => {
    setOnMultiSelect(false);
    setSelected([]);
  };
  const rowTarget = (p: Personnel): ActionTarget => ({
    ids: [p.id],
    label: `${p.firstName} ${p.lastName}`,
    status: p.status,
    term: p.term,
    current: p.department?.name ?? null,
  });
  const bulkTarget = (): ActionTarget => ({
    ids: selected,
    label: `${selected.length} personnel`,
  });

  const openTransfer = (t: ActionTarget) => {
    setTransferFor(t);
    setTransferUnitId("");
  };

  const submitTransfer = async () => {
    if (!transferFor || !transferUnitId) {
      toast.error("Pick a unit");
      return;
    }
    setTransferring(true);
    try {
      const res = await provisionalTransfer(token, {
        userIds: transferFor.ids,
        unitId: transferUnitId,
        actorId: auth.userId as string,
        lineId: lineId as string,
      });
      toast.success(
        `${res?.count ?? transferFor.ids.length} transferred${res?.unit ? ` to ${res.unit}` : ""}`,
      );
      setTransferFor(null);
      exitMultiSelect();
      queryClient.invalidateQueries({ queryKey: ["provisional-personnel"] });
    } catch (e) {
      toast.error("Failed to transfer", { description: `${e}` });
    } finally {
      setTransferring(false);
    }
  };

  const openRemove = (t: ActionTarget) => {
    setRemoveFor(t);
    setRemoveMessage("");
  };

  const submitRemove = async () => {
    if (!removeFor) return;
    setRemoving(true);
    try {
      const res = await provisionalRemove(token, {
        userIds: removeFor.ids,
        actorId: auth.userId as string,
        lineId: lineId as string,
        message: removeMessage.trim() || null,
      });
      toast.success(
        `${res?.count ?? removeFor.ids.length} engagement(s) ended`,
        { description: res?.emailed ? `${res.emailed} email(s) sent.` : undefined },
      );
      setRemoveFor(null);
      exitMultiSelect();
      queryClient.invalidateQueries({ queryKey: ["provisional-personnel"] });
    } catch (e) {
      toast.error("Failed to remove", { description: `${e}` });
    } finally {
      setRemoving(false);
    }
  };

  const openRenew = (t: ActionTarget) => {
    setRenewFor(t);
    setRenewMonths(3);
  };

  const submitRenew = async () => {
    if (!renewFor) return;
    setRenewing(true);
    try {
      const res = await provisionalRenew(token, {
        userIds: renewFor.ids,
        months: renewMonths,
        actorId: auth.userId as string,
        lineId: lineId as string,
      });
      toast.success(
        `${res?.count ?? renewFor.ids.length} contract(s) renewed${res?.term ? ` until ${new Date(res.term).toLocaleDateString()}` : ""}`,
        { description: res?.emailed ? `${res.emailed} email(s) sent.` : undefined },
      );
      setRenewFor(null);
      exitMultiSelect();
      queryClient.invalidateQueries({ queryKey: ["provisional-personnel"] });
    } catch (e) {
      toast.error("Failed to renew", { description: `${e}` });
    } finally {
      setRenewing(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex-none bg-white border-b px-4 py-3 flex items-center gap-2">
        <div className="p-1.5 bg-indigo-600 rounded-md">
          <Clock4 className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-gray-900">Non-Plantilla</h1>
          <p className="text-[11px] text-gray-500 leading-none mt-0.5">
            Job order / contract of service & other non-plantilla staff
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-3">
        <Tabs defaultValue="positions" className="w-full h-full flex flex-col">
          <TabsList className="bg-white border shadow-sm p-1 w-full sm:w-auto justify-start h-8 flex-none">
            <TabsTrigger value="positions" className="text-xs gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Positions
            </TabsTrigger>
            <TabsTrigger value="personnel" className="text-xs gap-1.5">
              <UserCog className="w-3.5 h-3.5" />
              Personnel
            </TabsTrigger>
          </TabsList>

          {/* ── Positions ─────────────────────────────────────────────── */}
          <TabsContent
            value="positions"
            className="flex-1 mt-3 min-h-0 data-[state=active]:flex data-[state=active]:flex-col"
          >
            <div className="flex items-center gap-2 mb-2 flex-none">
              <InputGroup className="bg-white flex-1 min-w-[200px] max-w-md">
                <InputGroupAddon>
                  <Search className="h-3 w-3 text-gray-400" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Search title or employment type..."
                  value={posText}
                  onChange={(e) => setPosText(e.target.value)}
                  className="h-7 text-[11px]"
                />
              </InputGroup>
              <Button
                size="sm"
                className="h-7 text-[10px] gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                onClick={openCreate}
              >
                <Plus className="h-3.5 w-3.5" /> New position
              </Button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto space-y-2">
              {pos.isFetching && positions.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : positions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs font-medium text-gray-700">
                    No non-plantilla positions yet
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Create one (e.g. Job Order, Contract of Service) to start
                    hiring temporary staff.
                  </p>
                </div>
              ) : (
                positions.map((p) => (
                  <div
                    key={p.id}
                    className="border rounded-lg bg-white p-3 flex items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {p.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 bg-indigo-50 text-indigo-700 border-indigo-200"
                        >
                          {p.empType}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 bg-gray-50 text-gray-600"
                        >
                          {p.termMonths} mo
                        </Badge>
                        {p.salaryGrade && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 bg-emerald-50 text-emerald-700 border-emerald-200"
                          >
                            SG {p.salaryGrade.grade} · ₱
                            {p.salaryGrade.amount.toLocaleString("en-PH")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        p.open === 0
                          ? "text-[10px] px-2 bg-amber-50 text-amber-700 border-amber-200"
                          : "text-[10px] px-2 bg-emerald-50 text-emerald-700 border-emerald-200"
                      }
                    >
                      <Users className="h-2.5 w-2.5 mr-1" />
                      {p.open} open / {p.slots}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] gap-1 px-2 bg-white"
                      onClick={() => openEditPosition(p)}
                      title="Edit position"
                    >
                      <Pencil className="h-3 w-3 text-gray-600" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
                      disabled={p.open === 0}
                      onClick={() => openHire(p)}
                    >
                      <Send className="h-3 w-3" /> Select applicant
                    </Button>
                  </div>
                ))
              )}
              {pos.hasNextPage && (
                <div ref={posRef} className="py-2 text-center">
                  {pos.isFetchingNextPage && (
                    <Loader2 className="h-3 w-3 animate-spin inline text-gray-400" />
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Personnel ─────────────────────────────────────────────── */}
          <TabsContent
            value="personnel"
            className="flex-1 mt-3 min-h-0 data-[state=active]:flex data-[state=active]:flex-col"
          >
            <div className="mb-2 flex-none flex flex-wrap items-center gap-2">
              <InputGroup className="bg-white flex-1 min-w-[180px] max-w-xs">
                <InputGroupAddon>
                  <Search className="h-3 w-3 text-gray-400" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Search name or username..."
                  value={persText}
                  onChange={(e) => setPersText(e.target.value)}
                  className="h-7 text-[11px]"
                />
              </InputGroup>
              <Button
                size="sm"
                variant={appliedTags.length ? "default" : "outline"}
                className="h-7 text-[10px] gap-1.5 bg-white data-[active=true]:bg-amber-600"
                data-active={appliedTags.length > 0}
                onClick={openTagsModal}
              >
                <Filter className="h-3.5 w-3.5 text-amber-500" />
                Skill tags
                {appliedTags.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-3.5 px-1 text-[9px] leading-none ml-0.5"
                  >
                    {appliedTags.length}
                  </Badge>
                )}
              </Button>
              <Select value={persStatus} onValueChange={setPersStatus}>
                <SelectTrigger className="h-7 text-[11px] w-44 bg-white">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All types
                  </SelectItem>
                  {EMP_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={persTerm} onValueChange={setPersTerm}>
                <SelectTrigger className="h-7 text-[11px] w-40 bg-white">
                  <SelectValue placeholder="All terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All terms
                  </SelectItem>
                  <SelectItem value="active" className="text-xs">
                    Active
                  </SelectItem>
                  <SelectItem value="expiring" className="text-xs">
                    Expiring ≤ 30 days
                  </SelectItem>
                  <SelectItem value="expired" className="text-xs">
                    Expired
                  </SelectItem>
                  <SelectItem value="none" className="text-xs">
                    No end date
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] gap-1.5 bg-white"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                )}
                Export Excel
              </Button>
              <Button
                size="sm"
                variant={onMultiSelect ? "default" : "outline"}
                className="h-7 text-[10px] gap-1.5 bg-white data-[active=true]:bg-indigo-600 data-[active=true]:text-white"
                data-active={onMultiSelect}
                onClick={() =>
                  onMultiSelect ? exitMultiSelect() : setOnMultiSelect(true)
                }
              >
                {onMultiSelect ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
                )}
                {onMultiSelect ? "Cancel" : "Select"}
              </Button>
            </div>

            {/* Applied skill-tag chips */}
            {appliedTags.length > 0 && (
              <div className="mb-2 flex-none flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-gray-500 inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" /> Skills:
                </span>
                {appliedTags.map((t) => (
                  <Badge
                    key={t.tag}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200"
                  >
                    {t.tag}
                  </Badge>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearTags}
                  className="h-5 px-1.5 text-[10px] gap-1"
                >
                  <ListRestart className="h-2.5 w-2.5" />
                  Clear
                </Button>
              </div>
            )}

            {/* Bulk action bar */}
            {onMultiSelect && (
              <div className="mb-2 flex-none flex items-center gap-2 flex-wrap rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-700"
                >
                  <Checkbox
                    checked={allOnPageSelected}
                    onCheckedChange={toggleSelectAll}
                    className="border-indigo-300"
                  />
                  Select all
                </button>
                <span className="text-[11px] text-gray-600">
                  {selected.length} selected
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={selected.length === 0}
                    className="h-7 text-[10px] gap-1 px-2 bg-white text-emerald-700 hover:bg-emerald-50"
                    onClick={() => openRenew(bulkTarget())}
                  >
                    <CalendarPlus className="h-3 w-3" />
                    Renew
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={selected.length === 0}
                    className="h-7 text-[10px] gap-1 px-2 bg-white"
                    onClick={() => openTransfer(bulkTarget())}
                  >
                    <ArrowLeftRight className="h-3 w-3 text-blue-600" />
                    Transfer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={selected.length === 0}
                    className="h-7 text-[10px] gap-1 px-2 bg-white text-red-600 hover:bg-red-50"
                    onClick={() => openRemove(bulkTarget())}
                  >
                    <UserMinus className="h-3 w-3" />
                    Remove
                  </Button>
                </div>
              </div>
            )}

            <div className="flex-1 min-h-0 overflow-auto space-y-2">
              {pers.isFetching && personnel.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : personnel.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs font-medium text-gray-700">
                    No non-plantilla personnel yet
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Select an applicant from the Positions tab to hire.
                  </p>
                </div>
              ) : (
                personnel.map((u) => {
                  const ended = u.term && new Date(u.term) < new Date();
                  const skills = (u.submittedApplications?.ApplicationSkillTags ??
                    [])
                    .map((s) => s.tags)
                    .filter((t): t is string => !!t);
                  return (
                    <div
                      key={u.id}
                      className={
                        "border rounded-lg bg-white p-3 flex items-center gap-3 " +
                        (onMultiSelect ? "cursor-pointer " : "") +
                        (onMultiSelect && isSelected(u.id)
                          ? "ring-1 ring-indigo-400 bg-indigo-50/40"
                          : "")
                      }
                      onClick={
                        onMultiSelect ? () => toggleSelect(u.id) : undefined
                      }
                    >
                      {onMultiSelect && (
                        <Checkbox
                          checked={isSelected(u.id)}
                          onCheckedChange={() => toggleSelect(u.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="border-gray-300 flex-none"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {u.department?.name ?? "Unassigned unit"}
                          {u.username ? ` · @${u.username}` : ""}
                        </p>
                        {skills.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {skills.slice(0, 6).map((s, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-[9px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200"
                              >
                                {s}
                              </Badge>
                            ))}
                            {skills.length > 6 && (
                              <span className="text-[9px] text-gray-400">
                                +{skills.length - 6}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 bg-indigo-50 text-indigo-700 border-indigo-200"
                      >
                        {u.status}
                      </Badge>
                      <span
                        className={
                          "text-[10px] w-24 text-right " +
                          (ended ? "text-red-500 font-medium" : "text-gray-500")
                        }
                      >
                        {u.term
                          ? `${ended ? "Ended" : "Ends"} ${new Date(u.term).toLocaleDateString()}`
                          : "No end date"}
                      </span>
                      {!onMultiSelect && (
                        <div className="flex items-center gap-1 flex-none">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] gap-1 px-2 bg-white"
                            onClick={() => nav(`../employee/${u.id}`)}
                            title="View profile & platform record"
                          >
                            <UserCircle className="h-3 w-3 text-indigo-600" />
                            Profile
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] gap-1 px-2 bg-white"
                            onClick={() => openEditPersonnel(u)}
                            title="Edit employment type"
                          >
                            <Pencil className="h-3 w-3 text-gray-600" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] gap-1 px-2 bg-white text-emerald-700 hover:bg-emerald-50"
                            onClick={() => openRenew(rowTarget(u))}
                            title="Renew contract term"
                          >
                            <CalendarPlus className="h-3 w-3" />
                            Renew
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] gap-1 px-2 bg-white"
                            onClick={() => openTransfer(rowTarget(u))}
                            title="Transfer to another unit"
                          >
                            <ArrowLeftRight className="h-3 w-3 text-blue-600" />
                            Transfer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] gap-1 px-2 bg-white text-red-600 hover:bg-red-50"
                            onClick={() => openRemove(rowTarget(u))}
                            title="End engagement"
                          >
                            <UserMinus className="h-3 w-3" />
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              {pers.hasNextPage && (
                <div ref={persRef} className="py-2 text-center">
                  {pers.isFetchingNextPage && (
                    <Loader2 className="h-3 w-3 animate-spin inline text-gray-400" />
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── New / edit position modal ───────────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-1.5 text-xs">
            {editingId ? (
              <Pencil className="h-3 w-3 text-indigo-500" />
            ) : (
              <Plus className="h-3 w-3 text-indigo-500" />
            )}
            {editingId ? "Edit non-plantilla position" : "New non-plantilla position"}
          </div>
        }
        onOpen={newOpen}
        className="max-w-lg"
        setOnOpen={() => {
          setNewOpen(false);
          setEditingId(null);
        }}
        onFunction={submitCreate}
        loading={creating}
        yesTitle={editingId ? "Save changes" : "Create position"}
        cancelTitle="Cancel"
        footer={true}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700">
              Position title *
            </label>
            <InputGroup className="bg-white">
              <InputGroupInput
                placeholder="e.g. Administrative Aide (Job Order)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-xs"
              />
            </InputGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-700">
                Term (months) *
              </label>
              <Select
                value={String(termMonths)}
                onValueChange={(v) => setTermMonths(Number(v))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERM_OPTIONS.map((m) => (
                    <SelectItem key={m} value={String(m)} className="text-xs">
                      {m} months
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-700">
                Slots *
              </label>
              <InputGroup className="bg-white">
                <InputGroupInput
                  type="number"
                  min={1}
                  value={slots}
                  onChange={(e) => setSlots(Math.max(1, Number(e.target.value)))}
                  className="h-8 text-xs"
                />
              </InputGroup>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700">
              Description
            </label>
            <Textarea
              placeholder="Optional notes about this engagement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[60px]"
            />
          </div>

          <p className="text-[10px] text-gray-500">
            On hire, the contract end date is computed automatically as today +{" "}
            {termMonths} months.
          </p>
        </div>
      </Modal>

      {/* ── Hire (select applicant + unit) modal ────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-1.5 text-xs">
            <UserCheck className="h-3 w-3 text-blue-500" />
            Select applicant — {hireFor?.title}
          </div>
        }
        onOpen={!!hireFor}
        className="max-w-xl max-h-[90vh] overflow-auto"
        setOnOpen={() => setHireFor(null)}
        onFunction={submitInvite}
        loading={inviting}
        yesTitle="Send invitation"
        cancelTitle="Cancel"
        footer={true}
      >
        <div className="space-y-3">
          {hireFor && (
            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
              <Badge
                variant="outline"
                className="px-2 bg-indigo-50 text-indigo-700 border-indigo-200"
              >
                {hireFor.empType}
              </Badge>
              <Badge variant="outline" className="px-2 bg-gray-50 text-gray-600">
                {hireFor.termMonths} months
              </Badge>
              <Badge
                variant="outline"
                className="px-2 bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                {hireFor.open} slot(s) open
              </Badge>
            </div>
          )}

          {/* Unit */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700">
              Assign to unit *
            </label>
            <Select value={hireUnitId} onValueChange={setHireUnitId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                {(units.data?.list ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    {u.name ?? u.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Applicant picker */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700">
              Applicant *
            </label>
            <InputGroup className="bg-white">
              <InputGroupAddon>
                <Search className="h-3 w-3 text-gray-400" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search applicants..."
                value={applicantText}
                onChange={(e) => setApplicantText(e.target.value)}
                className="h-7 text-[11px]"
              />
            </InputGroup>
            <div className="border rounded-md max-h-44 overflow-auto divide-y">
              {applicants.isFetching ? (
                <div className="flex items-center justify-center py-6 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (applicants.data?.list ?? []).length === 0 ? (
                <p className="text-[11px] text-gray-400 py-6 text-center">
                  No eligible applicants found.
                </p>
              ) : (
                (applicants.data?.list ?? []).map((a) => {
                  const active = pickedApplicant?.id === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setPickedApplicant(a)}
                      className={
                        "w-full text-left px-3 py-2 text-xs flex items-center justify-between " +
                        (active ? "bg-blue-50" : "hover:bg-gray-50")
                      }
                    >
                      <span className="text-gray-800">
                        {a.firstname} {a.lastname}
                      </span>
                      {active && <UserCheck className="h-3.5 w-3.5 text-blue-600" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700">
              Message (optional)
            </label>
            <Textarea
              placeholder="Add a note to the invitation email..."
              value={hireMessage}
              onChange={(e) => setHireMessage(e.target.value)}
              className="text-xs min-h-[50px]"
            />
          </div>
        </div>
      </Modal>

      {/* ── Skill-tag filter modal (multi-select) ───────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-1.5 text-xs">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Filter by skill tags
          </div>
        }
        onOpen={tagsOpen}
        className="max-w-2xl max-h-[90vh] overflow-auto"
        setOnOpen={() => setTagsOpen(false)}
        onFunction={applyTags}
        yesTitle={`Apply${tagDraft.length ? ` (${tagDraft.length})` : ""}`}
        cancelTitle="Cancel"
        footer={true}
      >
        <div className="space-y-2">
          {tagDraft.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {tagDraft.map((t) => (
                <Badge
                  key={t.tag}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200"
                >
                  {t.tag}
                </Badge>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTagDraft([])}
                className="h-5 px-1.5 text-[10px] gap-1"
              >
                <ListRestart className="h-2.5 w-2.5" /> Reset
              </Button>
            </div>
          )}
          <div className="mt-1 h-[58vh] rounded-lg border overflow-hidden">
            <FormTags
              handleAddTags={handleAddTags}
              handleCheckTags={handleCheckTags}
            />
          </div>
        </div>
      </Modal>

      {/* ── Transfer modal ──────────────────────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowLeftRight className="h-3 w-3 text-blue-500" />
            Transfer to another unit
          </div>
        }
        onOpen={!!transferFor}
        className="max-w-md"
        setOnOpen={() => setTransferFor(null)}
        onFunction={submitTransfer}
        loading={transferring}
        yesTitle="Transfer"
        cancelTitle="Cancel"
        footer={true}
      >
        <div className="space-y-3">
          {transferFor && (
            <p className="text-[11px] text-gray-600">
              Move{" "}
              <span className="font-semibold text-gray-900">
                {transferFor.label}
              </span>
              {transferFor.current ? (
                <>
                  {" "}
                  from{" "}
                  <span className="font-medium">{transferFor.current}</span>
                </>
              ) : null}{" "}
              to a new unit. {transferFor.ids.length > 1 ? "They" : "They"}'ll be
              notified.
            </p>
          )}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700">
              New unit *
            </label>
            <Select value={transferUnitId} onValueChange={setTransferUnitId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                {(units.data?.list ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    {u.name ?? u.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Modal>

      {/* ── Remove (end engagement) confirm ─────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-1.5 text-xs">
            <UserMinus className="h-3 w-3 text-red-500" />
            End engagement
          </div>
        }
        onOpen={!!removeFor}
        className="max-w-md"
        setOnOpen={() => setRemoveFor(null)}
        onFunction={submitRemove}
        loading={removing}
        yesTitle="End engagement"
        cancelTitle="Cancel"
        footer={true}
      >
        <div className="space-y-3">
          {removeFor && (
            <p className="text-[11px] text-gray-600">
              End{" "}
              <span className="font-semibold text-gray-900">
                {removeFor.label}
              </span>
              {removeFor.ids.length > 1 ? "'s engagements" : "'s engagement"}?
              Account login will be{" "}
              <span className="font-medium text-red-600">disabled</span>,{" "}
              {removeFor.ids.length > 1 ? "they" : "they"}'ll be removed from
              their unit, and a{" "}
              <span className="font-medium">termination email</span> + in-app
              notification will be sent. Records are kept for audit.
            </p>
          )}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700">
              Note to include in the email (optional)
            </label>
            <Textarea
              placeholder="e.g. Please return your ID and complete clearance by Friday."
              value={removeMessage}
              onChange={(e) => setRemoveMessage(e.target.value)}
              className="text-xs min-h-[56px]"
            />
          </div>
          <div className="rounded-md bg-amber-50 border border-amber-100 p-2">
            <p className="text-[10px] text-amber-700">
              This can be reversed by HR if needed (re-enable the account).
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Renew contract modal ────────────────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-1.5 text-xs">
            <CalendarPlus className="h-3 w-3 text-emerald-600" />
            Renew contract
          </div>
        }
        onOpen={!!renewFor}
        className="max-w-md"
        setOnOpen={() => setRenewFor(null)}
        onFunction={submitRenew}
        loading={renewing}
        yesTitle="Renew"
        cancelTitle="Cancel"
        footer={true}
      >
        <div className="space-y-3">
          {renewFor && (
            <p className="text-[11px] text-gray-600">
              Extend{" "}
              <span className="font-semibold text-gray-900">
                {renewFor.label}
              </span>
              {renewFor.ids.length > 1 ? " contracts." : "'s contract."}{" "}
              {renewFor.ids.length === 1 &&
                (renewFor.term ? (
                  <>
                    Current end:{" "}
                    <span className="font-medium">
                      {new Date(renewFor.term).toLocaleDateString()}
                    </span>
                    .
                  </>
                ) : (
                  "No current end date."
                ))}
            </p>
          )}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700">
              Extend by *
            </label>
            <Select
              value={String(renewMonths)}
              onValueChange={(v) => setRenewMonths(Number(v))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TERM_OPTIONS.map((m) => (
                  <SelectItem key={m} value={String(m)} className="text-xs">
                    {m} months
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[10px] text-gray-500">
            The new end date is computed from the current end date (if still in
            the future) or from today, plus {renewMonths} months. The employee is
            notified by email + in-app.
          </p>
        </div>
      </Modal>

      {/* ── Edit personnel modal ────────────────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-1.5 text-xs">
            <Pencil className="h-3 w-3 text-indigo-500" />
            Edit employment details
          </div>
        }
        onOpen={!!editPers}
        className="max-w-md"
        setOnOpen={() => setEditPers(null)}
        onFunction={submitEditPersonnel}
        loading={savingPers}
        yesTitle="Save changes"
        cancelTitle="Cancel"
        footer={true}
      >
        {editPers && (
          <div className="space-y-3">
            <p className="text-[11px] text-gray-600">
              Update{" "}
              <span className="font-semibold text-gray-900">
                {editPers.firstName} {editPers.lastName}
              </span>
              's employment type. They'll be notified.
            </p>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-700">
                Employment type *
              </label>
              <Select value={editPersStatus} onValueChange={setEditPersStatus}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EMP_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Provisional;
