import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { linePositions } from "@/db/statement";
import { AddExistingPosition } from "@/interface/zod";
import type {
  Position,
  AddExistingPositionProps,
} from "@/interface/data";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

import SelectPosItem from "./item/SelectPosItem";
import SalaryGradeSelect from "./SalaryGradeSelect";

import {
  Search,
  X,
  Save,
  ListPlus,
  ListX,
  Briefcase,
  Hash,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface Props {
  token: string;
  lineId: string;
  officeId: string;
  setOnOpen: React.Dispatch<React.SetStateAction<number>>;
  userid: string;
}

interface ListProps {
  list: Position[];
  lastCursor: string | null;
  hasMore: boolean;
}

const STEP_LABELS = [
  "Select Position",
  "Configure Details",
  "Review & Confirm",
];

const surfaceErr = (err: unknown, fallback: string) =>
  isAxiosError(err)
    ? err.response?.data?.message ?? err.message
    : err instanceof Error
      ? err.message
      : fallback;

const SelectUnitPosition = ({
  token,
  lineId,
  setOnOpen,
  officeId,
  userid,
}: Props) => {
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<Position | undefined>(undefined);
  const [query] = useDebounce(text, 400);

  const queryClient = useQueryClient();

  const {
    data,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
    error,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["line-position", lineId, query],
    queryFn: ({ pageParam }) =>
      linePositions(token, lineId, pageParam as string | null, "20", query),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!token && !!lineId,
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

  const form = useForm<AddExistingPositionProps>({
    resolver: zodResolver(AddExistingPosition),
    defaultValues: {
      itemNumber: "",
      slot: [],
      plantilla: false,
      designation: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    setValue,
    trigger,
    watch,
  } = form;

  const designation = watch("designation");
  const itemNumber = watch("itemNumber");
  const plantilla = watch("plantilla");

  const slots = useFieldArray({ control, name: "slot" });

  const handleAddSlot = () =>
    slots.append({ salaryGrade: "", occupied: false });
  const handleRemoveSlot = (i: number) => slots.remove(i);
  const handleResetSlots = () => setValue("slot", []);

  const next = async () => {
    if (step === STEP_LABELS.length - 1) return;
    if (step === 1) {
      const ok = await trigger();
      if (!ok) {
        toast.error("Please fix the errors above before continuing.");
        return;
      }
      if (slots.fields.length === 0) {
        toast.error("Add at least one slot before continuing.");
        return;
      }
    }
    setStep((s) => s + 1);
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submitMut = useMutation({
    mutationFn: async (vals: AddExistingPositionProps) => {
      if (!selected) throw new Error("No position selected.");
      const res = await axios.post(
        "/position/unit/position",
        {
          lineId,
          unitId: officeId,
          slot: vals.slot.map((s) => ({
            status: s.occupied,
            salaryGrade: s.salaryGrade,
          })),
          plantilla: vals.plantilla,
          title: selected.name,
          userId: userid,
          id: selected.id,
          itemNumber: vals.itemNumber || "N/A",
          designation: vals.designation || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Position added to this unit");
      await queryClient.invalidateQueries({
        queryKey: ["postions", officeId],
        refetchType: "active",
      });
      setOnOpen(0);
    },
    onError: (err) =>
      toast.error(surfaceErr(err, "Failed to add position to unit")),
  });

  const items = data?.pages.flatMap((p) => p.list) ?? [];

  return (
    <div className="w-full max-h-[85vh] flex flex-col">

      {/* Stepper header */}
      <div className="px-3 py-2 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          {STEP_LABELS.map((label, i) => {
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div
                key={label}
                className="flex items-center gap-1.5 flex-1 min-w-0"
              >
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : isDone
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </div>
                <span
                  className={`text-[10px] truncate ${
                    isActive
                      ? "font-semibold text-gray-900"
                      : isDone
                        ? "text-emerald-700"
                        : "text-gray-500"
                  }`}
                >
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`flex-1 h-px ${
                      isDone ? "bg-emerald-300" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-auto p-3 space-y-3">

        {/* ── Step 0: select position ─────────────────────────────── */}
        {step === 0 && (
          <>
            <InputGroup className="bg-white">
              <InputGroupAddon>
                <Search className="h-3 w-3 text-gray-400" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search position or designation..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="h-8 text-xs"
              />
            </InputGroup>

            <div className="border rounded-lg bg-white overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="text-[10px] font-semibold text-gray-700 w-10">
                      No
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-gray-700">
                      Position
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isError ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-6">
                        <div className="flex flex-col items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <p className="text-[10px] font-medium text-red-600">
                            Failed to load positions
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {(error as any)?.message ?? "Try again later."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isFetching && items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-6">
                        <div className="flex items-center justify-center gap-1.5 text-gray-400">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span className="text-[10px]">
                            Loading positions...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-gray-300" />
                          </div>
                          <p className="text-xs font-medium text-gray-700">
                            No positions found
                          </p>
                          <p className="text-[10px] text-gray-500 max-w-[240px]">
                            {query
                              ? `No matches for "${query}".`
                              : "There are no existing positions yet."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((it, i) => (
                      <SelectPosItem
                        key={it.id}
                        item={it}
                        no={i}
                        onChange={() => {}}
                        query={query}
                        onClick={() => {
                          setSelected(it);
                          setStep(1);
                        }}
                      />
                    ))
                  )}

                  {hasNextPage && (
                    <TableRow ref={ref}>
                      <TableCell colSpan={2} className="text-center py-2">
                        {isFetchingNextPage ? (
                          <div className="flex items-center justify-center gap-1.5 text-gray-400">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-[10px]">
                              Loading more...
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400">
                            Scroll to load more
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOnOpen(0)}
                className="h-7 text-[10px]"
              >
                Close
              </Button>
            </div>
          </>
        )}

        {/* ── Step 1: configure ───────────────────────────────────── */}
        {step === 1 && selected && (
          <>
            <div className="border rounded-md bg-blue-50/50 border-blue-100 p-2.5 flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded">
                <Briefcase className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-blue-600">
                  Selected Position
                </p>
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {selected.name}
                </p>
              </div>
            </div>

            <Form {...form}>
              <div className="space-y-2.5">
                <FormField
                  control={control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                        <Briefcase className="h-2.5 w-2.5" />
                        Designation (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., J.O - Data Encoder"
                          className="h-8 text-xs"
                        />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        For positions with a specific designation label.
                      </FormDescription>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <div className="border rounded-md bg-gray-50 p-2.5 space-y-2">
                  <FormField
                    control={control}
                    name="plantilla"
                    render={({ field }) => (
                      <FormItem className="flex items-start gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                          />
                        </FormControl>
                        <div className="leading-tight">
                          <FormLabel className="text-[11px] font-medium cursor-pointer">
                            Plantilla position
                          </FormLabel>
                          <p className="text-[10px] text-gray-500">
                            Marks this as a regular plantilla item
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {plantilla && (
                    <FormField
                      control={control}
                      name="itemNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                            <Hash className="h-2.5 w-2.5" />
                            Item Number / ID
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., ITEM-2024-001"
                              className="h-8 text-xs"
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="border rounded-md bg-white overflow-hidden">
                  <div className="px-2.5 py-1.5 border-b bg-gray-50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-blue-500" />
                      <h4 className="text-[10px] font-semibold text-gray-700">
                        Slots
                      </h4>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {slots.fields.length} slot
                      {slots.fields.length === 1 ? "" : "s"}
                    </Badge>
                  </div>

                  <div className="p-2 space-y-2">
                    {slots.fields.length === 0 ? (
                      <div className="flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-100 rounded">
                        <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-700">
                          Add at least one slot before continuing.
                        </p>
                      </div>
                    ) : (
                      slots.fields.map((_, i) => (
                        <div
                          key={i}
                          className="border rounded bg-gray-50/40 p-2 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              Slot #{i + 1}
                            </Badge>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[10px] gap-1 text-red-600 hover:bg-red-50"
                              onClick={() => handleRemoveSlot(i)}
                            >
                              <X className="h-3 w-3" />
                              Remove
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <FormField
                              control={control}
                              name={`slot.${i}.occupied`}
                              render={({ field }) => (
                                <FormItem className="flex items-start gap-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      className="mt-0.5"
                                    />
                                  </FormControl>
                                  <div className="leading-tight">
                                    <FormLabel className="text-[11px] font-medium cursor-pointer">
                                      Occupied
                                    </FormLabel>
                                    <p className="text-[10px] text-gray-500">
                                      Slot is currently filled
                                    </p>
                                  </div>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={control}
                              name={`slot.${i}.salaryGrade`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                                    Salary Grade
                                  </FormLabel>
                                  <FormControl>
                                    <SalaryGradeSelect
                                      lineId={lineId}
                                      token={token}
                                      onChange={field.onChange}
                                      value={field.value}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-[10px]" />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))
                    )}

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddSlot}
                        className="h-7 text-[10px] gap-1.5"
                      >
                        <ListPlus className="h-3 w-3" />
                        Add Slot
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={slots.fields.length === 0}
                        onClick={handleResetSlots}
                        className="h-7 text-[10px] gap-1.5 text-red-600 hover:bg-red-50"
                      >
                        <ListX className="h-3 w-3" />
                        Clear All
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Form>
          </>
        )}

        {step === 1 && !selected && (
          <div className="border rounded-md bg-amber-50 border-amber-200 p-3 text-center">
            <AlertCircle className="h-6 w-6 text-amber-500 mx-auto mb-1" />
            <p className="text-xs font-semibold text-amber-800">
              No position selected
            </p>
            <p className="text-[10px] text-amber-700 mt-0.5">
              Go back and pick a position to continue.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={back}
              className="h-7 text-[10px] gap-1.5 mt-2"
            >
              <ChevronLeft className="h-3 w-3" />
              Back
            </Button>
          </div>
        )}

        {/* ── Step 2: review ──────────────────────────────────────── */}
        {step === 2 && selected && (
          <>
            <div className="border rounded-md bg-emerald-50/60 border-emerald-200 p-2.5 flex items-start gap-2">
              <div className="p-1.5 bg-emerald-100 rounded">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-800">
                  Review &amp; Confirm
                </p>
                <p className="text-[10px] text-emerald-700 mt-0.5">
                  Double-check before saving — these settings tie the
                  position to this unit.
                </p>
              </div>
            </div>

            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50">
                <h4 className="text-xs font-semibold text-gray-800">
                  Summary
                </h4>
              </div>
              <div className="p-3 space-y-2 text-[11px]">
                <SummaryRow label="Position" value={selected.name} />
                <SummaryRow
                  label="Designation"
                  value={designation || "Not specified"}
                />
                <SummaryRow
                  label="Item Number"
                  value={
                    <span className="font-mono">
                      {itemNumber || "Not specified"}
                    </span>
                  }
                />
                <SummaryRow
                  label="Plantilla"
                  value={
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${
                        plantilla
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {plantilla ? "YES" : "NO"}
                    </Badge>
                  }
                />
                <SummaryRow
                  label="Slots"
                  value={
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {slots.fields.length} configured
                    </Badge>
                  }
                />

                {slots.fields.length > 0 && (
                  <div className="pt-2 border-t mt-2 space-y-1.5">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                      Slot Details
                    </p>
                    {slots.fields.map((slot, i) => (
                      <div
                        key={i}
                        className="bg-gray-50 rounded px-2 py-1.5 flex items-center justify-between"
                      >
                        <span className="text-[11px] font-medium text-gray-800">
                          Slot #{i + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-500">
                            SG: {slot.salaryGrade || "—"}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${
                              slot.occupied
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {slot.occupied ? "Occupied" : "Vacant"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Step nav */}
      <div className="px-3 py-2 border-t bg-white flex items-center justify-between gap-2 flex-shrink-0">
        <div className="text-[10px] text-gray-500">
          Step {step + 1} of {STEP_LABELS.length}
        </div>
        <div className="flex items-center gap-1.5">
          {step > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={back}
              disabled={submitMut.isPending || isSubmitting}
              className="h-7 text-[10px] gap-1.5"
            >
              <ChevronLeft className="h-3 w-3" />
              Back
            </Button>
          )}
          {step < STEP_LABELS.length - 1 && (
            <Button
              size="sm"
              onClick={next}
              disabled={step === 0 && !selected}
              className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
            >
              Continue
              <ChevronRight className="h-3 w-3" />
            </Button>
          )}
          {step === STEP_LABELS.length - 1 && (
            <Button
              size="sm"
              onClick={handleSubmit((v) => submitMut.mutateAsync(v))}
              disabled={submitMut.isPending || isSubmitting}
              className="h-7 text-[10px] gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              {submitMut.isPending || isSubmitting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3" />
                  Save Position
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-[10px] text-gray-500 uppercase tracking-wide">
      {label}
    </span>
    <span className="text-gray-800 text-right truncate max-w-[60%]">
      {value ?? "—"}
    </span>
  </div>
);

export default SelectUnitPosition;
