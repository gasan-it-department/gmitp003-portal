import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";

import { useAuth } from "@/provider/ProtectedRoute";
import {
  provisionalDesignations,
  provisionalPersonnel,
  getLinetUnits,
} from "@/db/statement";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import AddPosition from "@/layout/human_resources/AddPosition";

import {
  Briefcase,
  Clock4,
  Loader2,
  Plus,
  Search,
  Send,
  UserCog,
  Users,
} from "lucide-react";

interface Page<T> {
  list: T[];
  hasMore: boolean;
  lastCursor: string | null;
}
interface SlotLite {
  id: string;
  occupied: boolean;
  userId: string | null;
}
interface Designation {
  id: string;
  designation?: string | null;
  unit?: { id: string; name?: string | null } | null;
  position?: { id: string; name?: string | null } | null;
  slot?: SlotLite[];
}
interface Personnel {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  status: string;
  term?: string | null;
  department?: { name?: string | null } | null;
  Position?: { name?: string | null } | null;
}

const Provisional = () => {
  const { lineId } = useParams();
  const nav = useNavigate();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const token = auth.token as string;

  const [desigText, setDesigText] = useState("");
  const [desigQuery] = useDebounce(desigText, 600);
  const [persText, setPersText] = useState("");
  const [persQuery] = useDebounce(persText, 600);

  const [newOpen, setNewOpen] = useState(false);
  const [unitId, setUnitId] = useState("");

  // ── Designations (non-plantilla UnitPositions) ──────────────────────────
  const desig = useInfiniteQuery<Page<Designation>>({
    queryKey: ["provisional-designations", lineId, desigQuery],
    queryFn: ({ pageParam }) =>
      provisionalDesignations(
        token,
        lineId as string,
        pageParam as string | null,
        "20",
        desigQuery,
      ),
    initialPageParam: null,
    getNextPageParam: (last) => (last.hasMore ? last.lastCursor : undefined),
    enabled: !!token && !!lineId,
    refetchOnWindowFocus: false,
  });
  const designations = desig.data?.pages.flatMap((p) => p.list) ?? [];
  const { ref: desigRef } = useInView({
    threshold: 0.5,
    onChange: (v) => {
      if (v && desig.hasNextPage && !desig.isFetchingNextPage)
        desig.fetchNextPage();
    },
  });

  // ── Personnel (provisional employees) ───────────────────────────────────
  const pers = useInfiniteQuery<Page<Personnel>>({
    queryKey: ["provisional-personnel", lineId, persQuery],
    queryFn: ({ pageParam }) =>
      provisionalPersonnel(
        token,
        lineId as string,
        pageParam as string | null,
        "20",
        persQuery,
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
      if (v && pers.hasNextPage && !pers.isFetchingNextPage)
        pers.fetchNextPage();
    },
  });

  // Units for the "New designation" department picker.
  const units = useQuery<Page<{ id: string; name?: string | null }>>({
    queryKey: ["units-for-provisional", lineId],
    queryFn: () => getLinetUnits(token, lineId as string, null, "100", ""),
    enabled: !!token && !!lineId && newOpen,
    refetchOnWindowFocus: false,
  });

  const goInvite = (d: Designation) => {
    nav(
      `/${lineId}/human-resources/units/${d.unit?.id}/position/${d.id}/select-applicant?provisional=1`,
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex-none bg-white border-b px-4 py-3 flex items-center gap-2">
        <div className="p-1.5 bg-indigo-600 rounded-md">
          <Clock4 className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-gray-900">Provisional</h1>
          <p className="text-[11px] text-gray-500 leading-none mt-0.5">
            Temporary / contract designations & personnel
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-3">
        <Tabs defaultValue="designations" className="w-full h-full flex flex-col">
          <TabsList className="bg-white border shadow-sm p-1 w-full sm:w-auto justify-start h-8 flex-none">
            <TabsTrigger value="designations" className="text-xs gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Designations
            </TabsTrigger>
            <TabsTrigger value="personnel" className="text-xs gap-1.5">
              <UserCog className="w-3.5 h-3.5" />
              Personnel
            </TabsTrigger>
          </TabsList>

          {/* ── Designations ──────────────────────────────────────────── */}
          <TabsContent
            value="designations"
            className="flex-1 mt-3 min-h-0 data-[state=active]:flex data-[state=active]:flex-col"
          >
            <div className="flex items-center gap-2 mb-2 flex-none">
              <InputGroup className="bg-white flex-1 min-w-[200px] max-w-md">
                <InputGroupAddon>
                  <Search className="h-3 w-3 text-gray-400" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Search designation or position..."
                  value={desigText}
                  onChange={(e) => setDesigText(e.target.value)}
                  className="h-7 text-[11px]"
                />
              </InputGroup>
              <Button
                size="sm"
                className="h-7 text-[10px] gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setNewOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> New designation
              </Button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto space-y-2">
              {desig.isFetching && designations.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : designations.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs font-medium text-gray-700">
                    No provisional designations yet
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Create one to start hiring temporary / contract staff.
                  </p>
                </div>
              ) : (
                designations.map((d) => {
                  const slots = d.slot ?? [];
                  const open = slots.filter((s) => !s.occupied).length;
                  return (
                    <div
                      key={d.id}
                      className="border rounded-lg bg-white p-3 flex items-center gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {d.designation && d.designation !== "N/A"
                            ? d.designation
                            : (d.position?.name ?? "Untitled")}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {d.position?.name ?? "—"}
                          {d.unit?.name ? ` · ${d.unit.name}` : ""}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          open === 0
                            ? "text-[10px] px-2 bg-amber-50 text-amber-700 border-amber-200"
                            : "text-[10px] px-2 bg-emerald-50 text-emerald-700 border-emerald-200"
                        }
                      >
                        <Users className="h-2.5 w-2.5 mr-1" />
                        {open} open / {slots.length}
                      </Badge>
                      <Button
                        size="sm"
                        className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
                        disabled={open === 0}
                        onClick={() => goInvite(d)}
                      >
                        <Send className="h-3 w-3" /> Hire from applicant
                      </Button>
                    </div>
                  );
                })
              )}
              {desig.hasNextPage && (
                <div ref={desigRef} className="py-2 text-center">
                  {desig.isFetchingNextPage && (
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
            <div className="mb-2 flex-none">
              <InputGroup className="bg-white max-w-md">
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
            </div>

            <div className="flex-1 min-h-0 overflow-auto space-y-2">
              {pers.isFetching && personnel.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : personnel.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs font-medium text-gray-700">
                    No provisional personnel yet
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Hire from an applicant on the Designations tab.
                  </p>
                </div>
              ) : (
                personnel.map((u) => (
                  <div
                    key={u.id}
                    className="border rounded-lg bg-white p-3 flex items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {u.Position?.name ?? "—"}
                        {u.department?.name ? ` · ${u.department.name}` : ""}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 bg-indigo-50 text-indigo-700 border-indigo-200"
                    >
                      {u.status}
                    </Badge>
                    <span className="text-[10px] text-gray-500 w-28 text-right">
                      {u.term
                        ? `Ends ${new Date(u.term).toLocaleDateString()}`
                        : "No end date"}
                    </span>
                  </div>
                ))
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

      {/* ── New designation modal ───────────────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-1.5 text-xs">
            <Plus className="h-3 w-3 text-indigo-500" />
            New provisional designation
          </div>
        }
        onOpen={newOpen}
        className="max-w-2xl max-h-[90vh] overflow-auto"
        setOnOpen={() => setNewOpen(false)}
        footer={1}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700">
              Department / Unit *
            </label>
            <Select value={unitId} onValueChange={setUnitId}>
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
            <p className="text-[10px] text-gray-500">
              Leave "Plantilla Position" unchecked below — a non-plantilla
              designation is what makes this a provisional role.
            </p>
          </div>

          {unitId ? (
            <AddPosition
              existed={false}
              unitId={unitId}
              lineId={lineId as string}
              token={token}
              userId={auth.userId as string}
            />
          ) : (
            <p className="text-[11px] text-gray-400 py-4 text-center">
              Pick a unit to configure the designation.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Provisional;
