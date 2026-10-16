import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/provider/ProtectedRoute";
import {
  proposeStepIncrements,
  stepIncrementsDue,
  type StepCandidate,
  type StepDueResponse,
} from "@/db/statements/stepIncrement";

import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import {
  AlertCircle,
  CalendarClock,
  ChevronRight,
  ChevronsUp,
  Hourglass,
  Loader2,
  Search,
  Users,
} from "lucide-react";

/** A date, or an em dash — never "Invalid Date". */
const day = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

/**
 * One phrase for where a person stands.
 *
 * The blockers arrive as a list because several can apply at once; this
 * shows the one that decides what happens next, which is the order below.
 */
export const standing = (c: StepCandidate): { label: string; cls: string } => {
  if (c.blockers.includes("already-proposed"))
    return {
      label: "Awaiting decision",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    };
  if (c.blockers.includes("at-ceiling"))
    return {
      label: "At Step 8",
      cls: "bg-gray-100 text-gray-500 border-gray-200",
    };
  if (c.blockers.includes("no-service-date"))
    return {
      label: "Needs a date",
      cls: "bg-rose-50 text-rose-700 border-rose-200",
    };
  if (c.blockers.includes("lwop-exceeded"))
    return {
      label: "Check leave",
      cls: "bg-orange-50 text-orange-700 border-orange-200",
    };
  if (c.blockers.includes("not-yet-due"))
    return {
      label: "Not yet due",
      cls: "bg-gray-50 text-gray-500 border-gray-200",
    };
  return { label: "Due", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const StepIncrement = () => {
  const auth = useAuth();
  const { lineId } = useParams();
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const [text, setText] = useState("");
  const [asOf, setAsOf] = useState(todayISO());

  const { data, status, error, isFetching } = useQuery<StepDueResponse>({
    queryKey: ["step-increments-due", lineId, asOf],
    queryFn: () =>
      stepIncrementsDue(auth.token as string, lineId as string, asOf),
    enabled: !!lineId,
    refetchOnWindowFocus: false,
  });

  const propose = useMutation({
    mutationFn: () =>
      proposeStepIncrements(
        auth.token as string,
        lineId as string,
        undefined,
        asOf,
      ),
    onSuccess: async (r) => {
      await queryClient.invalidateQueries({
        queryKey: ["step-increments-due", lineId],
        refetchType: "active",
      });
      if (r.proposed === 0) {
        toast.info("Nothing to propose — nobody is due and clear.");
      } else {
        toast.success(
          `${r.proposed} proposal${r.proposed === 1 ? "" : "s"} raised. ` +
            "They still need a decision.",
        );
      }
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(
        e?.response?.data?.message ?? "Could not raise the proposals.",
      );
    },
  });

  const all = useMemo(
    () => [...(data?.due ?? []), ...(data?.others ?? [])],
    [data],
  );

  const rows = useMemo(() => {
    const q = text.trim().toLowerCase();
    return q ? all.filter((c) => c.name.toLowerCase().includes(q)) : all;
  }, [all, text]);

  const counts = useMemo(() => {
    const has = (c: StepCandidate, b: string) => c.blockers.includes(b);
    return {
      due: all.filter((c) => c.blockers.length === 0).length,
      awaiting: all.filter((c) => has(c, "already-proposed")).length,
      noDate: all.filter((c) => has(c, "no-service-date")).length,
      ceiling: all.filter((c) => has(c, "at-ceiling")).length,
    };
  }, [all]);

  if (status === "error") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3">
        <div className="border rounded-lg bg-white p-6 text-center max-w-sm w-full">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Failed to load step increments
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            {error instanceof Error ? error.message : "Please try again."}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const isLoading = status === "pending";

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <div className="p-3 flex-1 flex flex-col min-h-0 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="border rounded-lg bg-white overflow-hidden mb-3">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <ChevronsUp className="h-3 w-3 text-blue-500" />
              <div>
                <h3 className="text-xs font-semibold text-gray-800">
                  Step Increments
                </h3>
                <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                  One step for every {data?.rules.yearsPerStep ?? 3} years of
                  satisfactory service, up to Step 8
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-gray-500">As of</label>
              <Input
                type="date"
                value={asOf}
                onChange={(e) => setAsOf(e.target.value || todayISO())}
                className="h-7 w-[9.5rem] text-xs"
              />
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={counts.due === 0 || propose.isPending}
                onClick={() => propose.mutate()}
              >
                {propose.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>Propose {counts.due > 0 ? counts.due : ""}</>
                )}
              </Button>
            </div>
          </div>

          {/* What this screen does, and what it leaves to a person. */}
          <div className="px-3 py-2 border-b bg-blue-50/40">
            <p className="text-[10px] text-gray-600 leading-relaxed">
              This works out the arithmetic — who has reached three years,
              counted from when — and proposes. It cannot tell satisfactory
              service from unsatisfactory, so{" "}
              <span className="font-medium text-gray-800">
                approving is HR&apos;s decision
              </span>{" "}
              and requires certifying the service. An approval moves the
              person&apos;s step and issues a Notice of Step Increment.
            </p>
          </div>

          {/* Counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0">
            {[
              { label: "Due now", value: counts.due, tone: "text-emerald-600" },
              {
                label: "Awaiting decision",
                value: counts.awaiting,
                tone: "text-amber-600",
              },
              {
                label: "Needs a date",
                value: counts.noDate,
                tone: "text-rose-600",
              },
              {
                label: "At Step 8",
                value: counts.ceiling,
                tone: "text-gray-400",
              },
            ].map((s) => (
              <div key={s.label} className="px-3 py-2">
                <p className={`text-base font-bold leading-none ${s.tone}`}>
                  {isLoading ? "—" : s.value}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-t">
            <InputGroup className="bg-white">
              <InputGroupAddon>
                <Search className="h-3 w-3 text-gray-400" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by name..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="h-8 text-xs"
              />
            </InputGroup>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg bg-white overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-gray-100 sticky top-0 z-10">
                <TableRow className="hover:bg-gray-100 border-b">
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 min-w-[180px]">
                    Employee
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-20 text-center">
                    Step
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-32">
                    Counted from
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-32">
                    Three years on
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-36">
                    Standing
                  </TableHead>
                  <TableHead className="px-3 py-2 w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-3 py-2">
                        <Skeleton className="h-3 w-40" />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Skeleton className="h-4 w-8 mx-auto" />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Skeleton className="h-3 w-20" />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Skeleton className="h-3 w-20" />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="px-3 py-2" />
                    </TableRow>
                  ))
                ) : rows.length > 0 ? (
                  <>
                    {rows.map((c) => {
                      const s = standing(c);
                      return (
                        <TableRow
                          key={c.userId}
                          onClick={() =>
                            nav(
                              `/${lineId}/human-resources/step-increments/${c.userId}`,
                            )
                          }
                          className="hover:bg-gray-50 cursor-pointer border-b group"
                        >
                          <TableCell className="px-3 py-2">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {c.name || "Unnamed"}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {c.grade !== null
                                ? `Salary Grade ${c.grade}`
                                : "No salary grade"}
                            </p>
                          </TableCell>
                          <TableCell className="px-3 py-2 text-center">
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 font-mono"
                            >
                              {c.currentStep}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <span className="text-[11px] text-gray-600">
                              {day(c.reckonedFrom)}
                            </span>
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <span className="text-[11px] text-gray-600">
                              {day(c.dueOn)}
                            </span>
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 font-normal ${s.cls}`}
                            >
                              {s.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right">
                            <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-gray-500" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-3 text-center border-t"
                      >
                        <p className="text-[10px] text-gray-400">
                          {rows.length} employee{rows.length !== 1 ? "s" : ""}
                          {isFetching ? " · refreshing" : ""}
                        </p>
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {text ? (
                            <Users className="h-5 w-5 text-gray-300" />
                          ) : (
                            <Hourglass className="h-5 w-5 text-gray-300" />
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-500">
                          {text
                            ? `Nobody matches "${text}"`
                            : "No employees to show"}
                        </p>
                        <p className="text-[10px] text-gray-400 max-w-xs">
                          {text
                            ? "Try a different name"
                            : "Employees appear here once they are on the payroll."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Where the money comes from, so nobody expects a raise yet. */}
        <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
          <CalendarClock className="h-3 w-3" />
          A step only changes pay once the salary schedule for that grade and
          step has been loaded under Salary Grades.
        </p>
      </div>
    </div>
  );
};

export default StepIncrement;
