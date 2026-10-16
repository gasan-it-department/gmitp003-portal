import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/provider/ProtectedRoute";
import {
  decideStepIncrement,
  proposeStepIncrements,
  setServiceRecord,
  stepIncrementList,
  stepIncrementsDue,
  type StepCandidate,
  type StepDueResponse,
  type StepIncrementRecord,
} from "@/db/statements/stepIncrement";

import { standing } from "./StepIncrement";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronsUp,
  FileSignature,
  History,
  Loader2,
  Save,
  X,
} from "lucide-react";

const day = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

/** An ISO timestamp as the yyyy-mm-dd a date input wants. */
const forInput = (iso: string | null | undefined) =>
  iso ? new Date(iso).toISOString().slice(0, 10) : "";

const errText = (err: unknown, fallback: string) => {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message ?? fallback;
};

const StepIncrementDetail = () => {
  const { lineId, employeeId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();

  /*
    The list endpoint answers for the whole municipality and is already
    cached by the list screen, so arriving here by a row click costs
    nothing. It is also the single place the rules live, so the two
    screens cannot drift apart in what they claim.
  */
  const { data, status, error } = useQuery<StepDueResponse>({
    queryKey: ["step-increments-due", lineId, "detail"],
    queryFn: () => stepIncrementsDue(auth.token as string, lineId as string),
    enabled: !!lineId,
    refetchOnWindowFocus: false,
  });

  const { data: history } = useQuery<{ list: StepIncrementRecord[] }>({
    queryKey: ["step-increments-history", lineId, employeeId],
    queryFn: () =>
      stepIncrementList(auth.token as string, lineId as string, employeeId),
    enabled: !!lineId && !!employeeId,
    refetchOnWindowFocus: false,
  });

  const person: StepCandidate | undefined = useMemo(
    () =>
      [...(data?.due ?? []), ...(data?.others ?? [])].find(
        (c) => c.userId === employeeId,
      ),
    [data, employeeId],
  );

  const pending = history?.list.find((r) => r.status === "proposed");

  // ── the service record form ──────────────────────────────────────────
  const [appointed, setAppointed] = useState("");
  const [position, setPosition] = useState("");
  const [stepSince, setStepSince] = useState("");
  const [step, setStep] = useState("");

  // Re-sync whenever the person's record arrives or changes under us.
  useEffect(() => {
    if (!person) return;
    setAppointed(forInput(person.originalAppointmentDate));
    setPosition(forInput(person.presentPositionDate));
    setStepSince(forInput(person.stepEffectiveDate));
    setStep(String(person.currentStep));
  }, [person]);

  const dirty =
    !!person &&
    (appointed !== forInput(person.originalAppointmentDate) ||
      position !== forInput(person.presentPositionDate) ||
      stepSince !== forInput(person.stepEffectiveDate) ||
      step !== String(person.currentStep));

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["step-increments-due", lineId],
        refetchType: "active",
      }),
      queryClient.invalidateQueries({
        queryKey: ["step-increments-history", lineId, employeeId],
        refetchType: "active",
      }),
    ]);
  };

  const save = useMutation({
    mutationFn: () =>
      setServiceRecord(auth.token as string, {
        lineId: lineId as string,
        userId: employeeId as string,
        originalAppointmentDate: appointed,
        presentPositionDate: position,
        stepEffectiveDate: stepSince,
        step,
      }),
    onSuccess: async () => {
      await refresh();
      toast.success("Service record saved.");
    },
    onError: (err) =>
      toast.error(errText(err, "Could not save the service record.")),
  });

  const propose = useMutation({
    mutationFn: () =>
      proposeStepIncrements(auth.token as string, lineId as string, [
        employeeId as string,
      ]),
    onSuccess: async (r) => {
      await refresh();
      if (r.proposed === 0) {
        toast.info(r.skipped[0]?.why ?? "Not due — nothing proposed.");
      } else {
        toast.success("Proposed. It still needs a decision.");
      }
    },
    onError: (err) => toast.error(errText(err, "Could not propose.")),
  });

  // ── the decision ─────────────────────────────────────────────────────
  const [certified, setCertified] = useState(false);
  const [nosi, setNosi] = useState("");
  const [note, setNote] = useState("");

  const decide = useMutation({
    mutationFn: (action: "approve" | "reject") =>
      decideStepIncrement(auth.token as string, {
        lineId: lineId as string,
        id: pending?.id as string,
        action,
        certifiedSatisfactory: certified,
        nosiNumber: nosi.trim() || undefined,
        note: note.trim() || undefined,
      }),
    onSuccess: async (_r, action) => {
      await refresh();
      setCertified(false);
      setNosi("");
      setNote("");
      toast.success(
        action === "approve"
          ? "Approved. The step has moved and the three years start again."
          : "Rejected.",
      );
    },
    onError: (err) => toast.error(errText(err, "Could not record the decision.")),
  });

  if (status === "error") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3">
        <div className="border rounded-lg bg-white p-6 text-center max-w-sm w-full">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Failed to load this record
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            {error instanceof Error ? error.message : "Please try again."}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => nav(`/${lineId}/human-resources/step-increments`)}
          >
            Back to the list
          </Button>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="w-full h-full p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3">
        <div className="border rounded-lg bg-white p-6 text-center max-w-sm w-full">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Employee not found
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            They may have been archived, or belong to another municipality.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => nav(`/${lineId}/human-resources/step-increments`)}
          >
            Back to the list
          </Button>
        </div>
      </div>
    );
  }

  const isDue = person.blockers.length === 0;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex-none border-b bg-white">
        <div className="px-4 py-3 max-w-4xl mx-auto w-full">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[11px] gap-1 text-gray-500 hover:text-gray-800 mb-2 -ml-1"
            onClick={() => nav(`/${lineId}/human-resources/step-increments`)}
          >
            <ArrowLeft className="h-3 w-3" />
            Step Increments
          </Button>

          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                <ChevronsUp className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {person.name || "Unnamed"}
                </h1>
                <p className="text-[11px] text-gray-500">
                  {person.grade !== null
                    ? `Salary Grade ${person.grade}`
                    : "No salary grade"}{" "}
                  · Step {person.currentStep}
                </p>
              </div>
            </div>
            {/* The same phrase the list shows, from the same function, so
                the two screens cannot contradict each other. */}
            <Badge
              variant="outline"
              className={`text-[10px] px-2 py-0.5 font-normal ${
                standing(person).cls
              }`}
            >
              {standing(person).label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-3 max-w-4xl mx-auto w-full space-y-3">
        {/* ── Where it stands, in words ─────────────────────────────── */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3 text-blue-500" />
            <h3 className="text-xs font-semibold text-gray-800">
              The reckoning
            </h3>
          </div>
          <div className="px-3 py-2.5 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-[10px] text-gray-500">Counted from</p>
                <p className="text-xs font-medium text-gray-900">
                  {day(person.reckonedFrom)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Three years on</p>
                <p className="text-xs font-medium text-gray-900">
                  {day(person.dueOn)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Current step</p>
                <p className="text-xs font-medium text-gray-900">
                  {person.currentStep} of 8
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Leave without pay</p>
                <p className="text-xs font-medium text-gray-900">
                  {person.lwopDays} day{person.lwopDays === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {person.notes.length > 0 ? (
              <ul className="space-y-1 pt-1">
                {person.notes.map((n, i) => (
                  <li
                    key={i}
                    className="text-[11px] text-gray-600 flex items-start gap-1.5"
                  >
                    <span className="text-gray-300 mt-0.5">•</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-1.5">
                Three years of service have passed and nothing stands in the
                way. The increment still has to be proposed and approved.
              </p>
            )}
          </div>
        </div>

        {/* ── The decision, when there is one to make ───────────────── */}
        {pending ? (
          <div className="border rounded-lg bg-white overflow-hidden ring-1 ring-amber-200">
            <div className="px-3 py-2 border-b bg-amber-50 flex items-center gap-1.5">
              <FileSignature className="h-3 w-3 text-amber-600" />
              <h3 className="text-xs font-semibold text-gray-800">
                Awaiting a decision
              </h3>
            </div>
            <div className="px-3 py-2.5 space-y-3">
              <p className="text-xs text-gray-700">
                Step{" "}
                <span className="font-semibold">{pending.fromStep}</span> to{" "}
                <span className="font-semibold">{pending.toStep}</span>,
                effective{" "}
                <span className="font-semibold">
                  {day(pending.effectiveDate)}
                </span>{" "}
                — for service from {day(pending.serviceFrom)} to{" "}
                {day(pending.serviceTo)}.
              </p>

              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox
                  checked={certified}
                  onCheckedChange={(v) => setCertified(v === true)}
                  className="mt-0.5"
                />
                <span className="text-[11px] text-gray-700 leading-relaxed">
                  I certify that the employee&apos;s performance over these
                  three years was{" "}
                  <span className="font-medium">at least satisfactory</span>.
                  <span className="block text-gray-500">
                    This system holds no performance ratings and cannot
                    establish it, so the certification is the only record that
                    anybody checked.
                  </span>
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500">
                    NOSI number (optional)
                  </label>
                  <Input
                    value={nosi}
                    onChange={(e) => setNosi(e.target.value)}
                    placeholder="e.g. NOSI-2026-001"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">
                    Note (optional)
                  </label>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Anything worth recording"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={!certified || decide.isPending}
                  onClick={() => decide.mutate("approve")}
                  title={
                    certified
                      ? undefined
                      : "Certify the service first — approval requires it"
                  }
                >
                  {decide.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 text-rose-600 hover:text-rose-700"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate("reject")}
                >
                  <X className="h-3 w-3" />
                  Reject
                </Button>
                <p className="text-[10px] text-gray-400 ml-auto">
                  Approving moves the step and restarts the three years.
                </p>
              </div>
            </div>
          </div>
        ) : (
          isDue && (
            <div className="border rounded-lg bg-white px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-[11px] text-gray-600">
                Due for step {person.currentStep + 1}. Raise a proposal so it
                can be decided and a Notice of Step Increment issued.
              </p>
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={propose.isPending}
                onClick={() => propose.mutate()}
              >
                {propose.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Propose"
                )}
              </Button>
            </div>
          )
        )}

        {/* ── The service record ────────────────────────────────────── */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3 text-blue-500" />
            <div>
              <h3 className="text-xs font-semibold text-gray-800">
                Service record
              </h3>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                What the arithmetic counts from. Correcting it is data entry,
                not a step increment.
              </p>
            </div>
          </div>
          <div className="px-3 py-2.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-500">
                  Original appointment
                </label>
                <Input
                  type="date"
                  value={appointed}
                  onChange={(e) => setAppointed(e.target.value)}
                  className="h-8 text-xs"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">
                  For the record. Not what the three years count from.
                </p>
              </div>
              <div>
                <label className="text-[10px] text-gray-500">
                  Present position since
                </label>
                <Input
                  type="date"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="h-8 text-xs"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">
                  The three years run from this, unless a later date below
                  supersedes it.
                </p>
              </div>
              <div>
                <label className="text-[10px] text-gray-500">
                  Current step since
                </label>
                <Input
                  type="date"
                  value={stepSince}
                  onChange={(e) => setStepSince(e.target.value)}
                  className="h-8 text-xs"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">
                  When the step below took effect. Required for any step above
                  1.
                </p>
              </div>
              <div>
                <label className="text-[10px] text-gray-500">
                  Step already held
                </label>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={step}
                  onChange={(e) => setStep(e.target.value)}
                  className="h-8 text-xs"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">
                  For steps granted before this system existed.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                disabled={!dirty || save.isPending}
                onClick={() => save.mutate()}
              >
                {save.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                Save
              </Button>
              {dirty && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-gray-500"
                  onClick={() => {
                    setAppointed(forInput(person.originalAppointmentDate));
                    setPosition(forInput(person.presentPositionDate));
                    setStepSince(forInput(person.stepEffectiveDate));
                    setStep(String(person.currentStep));
                  }}
                >
                  Discard changes
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── What has happened before ──────────────────────────────── */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
            <History className="h-3 w-3 text-blue-500" />
            <h3 className="text-xs font-semibold text-gray-800">
              Step increment history
            </h3>
          </div>
          {history?.list.length ? (
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow className="hover:bg-gray-100 border-b">
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-24">
                    Step
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-32">
                    Effective
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-28">
                    Status
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2">
                    NOSI / decided by
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.list.map((r) => (
                  <TableRow key={r.id} className="border-b">
                    <TableCell className="px-3 py-2 text-xs text-gray-700">
                      {r.fromStep} → {r.toStep}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-[11px] text-gray-600">
                      {day(r.effectiveDate)}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 font-normal ${
                          r.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : r.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-[11px] text-gray-600">
                      {r.nosiNumber ? (
                        <span className="font-mono">{r.nosiNumber}</span>
                      ) : (
                        <span className="text-gray-300">no NOSI number</span>
                      )}
                      {r.decidedBy && (
                        <span className="text-gray-400">
                          {" "}
                          · {r.decidedBy.firstName} {r.decidedBy.lastName}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="px-3 py-6 text-center">
              <p className="text-xs text-gray-500">No step increments yet</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Anything proposed or decided here will be listed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepIncrementDetail;
