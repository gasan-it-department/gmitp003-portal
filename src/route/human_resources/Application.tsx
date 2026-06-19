import { useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useAuth } from "@/provider/ProtectedRoute";
import {
  lineApplications,
  provisionalInvite,
  provisionalPositionsList,
  getLinetUnits,
} from "@/db/statement";
import { deleteSelctedApplication } from "@/db/statements/application";

import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import Modal from "@/components/custom/Modal";
import ConfirmDelete from "@/layout/ConfirmDelete";
import PositionSelect from "@/layout/human_resources/PositionSelect";
import FormTags from "@/layout/FormTags";
import ApplicationItem from "@/layout/human_resources/item/ApplicationItem";
import ContactApplicant from "@/layout/human_resources/ContactApplicant";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  FolderPlus,
  Search,
  Filter,
  SquareCheckBig,
  Square,
  CalendarArrowDown,
  CalendarArrowUp,
  Clock4,
  ListRestart,
  EllipsisVertical,
  PhoneForwarded,
  Users,
  FileText,
  Briefcase,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";

import type { SubmittedApplicationProps } from "@/interface/data";
import { RefineApplicationSchema } from "@/interface/zod";

interface ListProps {
  list: SubmittedApplicationProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

interface FilterValues {
  dateFrom: string;
  dateTo: string;
  positionId: string;
  tags: { tag: string; cont: string }[];
}

const Application = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const [text, setText] = useState("");
  const [onOpen, setOnOpen] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [onMultiSelect, setOnMultiSelect] = useState(false);
  const [query] = useDebounce(text, 600);

  const form = useForm<FilterValues>({
    resolver: zodResolver(RefineApplicationSchema),
    defaultValues: {
      dateFrom: "",
      dateTo: "",
      positionId: "",
      tags: [],
    },
  });
  const { handleSubmit, control, setValue, watch } = form;

  const tags = useFieldArray({ control, name: "tags" });
  const dateFrom = watch("dateFrom");
  const dateTo = watch("dateTo");
  const position = watch("positionId");
  const allTags = watch("tags");

  // Filters live in queryKey so cache stays consistent without manual refetches.
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>({
    dateFrom: "",
    dateTo: "",
    positionId: "",
    tags: [],
  });

  const {
    data,
    isFetchingNextPage,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isError,
    error,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["applications", lineId, query, appliedFilters],
    queryFn: ({ pageParam }) =>
      lineApplications(
        auth.token as string,
        lineId as string,
        pageParam as string | null,
        "20",
        query,
        appliedFilters.tags.map((t) => t.tag),
        appliedFilters.dateFrom || undefined,
        appliedFilters.dateTo || undefined,
        appliedFilters.positionId || undefined,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!auth.token && !!lineId,
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

  const handleCheckSelected = (id: string) => selected.includes(id);
  const handleAddSelected = (id: string) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  const handleCheckTags = (tag: string) => {
    const index = tags.fields.findIndex((t) => t.tag === tag);
    return { res: index !== -1, index };
  };
  const handleAddTags = (tag: string, cont: string) => {
    const { res, index } = handleCheckTags(tag);
    if (res) tags.remove(index);
    else tags.append({ cont, tag });
  };

  const handleReset = () => {
    setValue("dateFrom", "");
    setValue("dateTo", "");
    setValue("positionId", "");
    setValue("tags", []);
    setAppliedFilters({
      dateFrom: "",
      dateTo: "",
      positionId: "",
      tags: [],
    });
  };

  const applyFilters = (data: FilterValues) => {
    setAppliedFilters({
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
      positionId: data.positionId,
      tags: data.tags,
    });
    setOnOpen(0);
  };

  const deleteMut = useMutation({
    mutationFn: () =>
      deleteSelctedApplication(
        auth.token as string,
        selected,
        auth.userId as string,
        lineId as string,
      ),
    onSuccess: () => {
      setSelected([]);
      setOnMultiSelect(false);
      setOnOpen(0);
      queryClient.invalidateQueries({ queryKey: ["applications", lineId] });
    },
    onError: (err: any) => {
      // Errors here would be useful to show.
      console.error("Error deleting applications:", err);
    },
  });

  // ── Assign selected applicants to a non-plantilla position ───────────────
  const [assignPositionId, setAssignPositionId] = useState("");
  const [assignUnitId, setAssignUnitId] = useState("");
  const [assignMessage, setAssignMessage] = useState("");
  const [assigning, setAssigning] = useState(false);

  const provPositions = useQuery<{
    list: {
      id: string;
      title: string;
      empType: string;
      termMonths: number;
      slots: number;
      open: number;
    }[];
  }>({
    queryKey: ["np-positions-for-assign", lineId],
    queryFn: () =>
      provisionalPositionsList(
        auth.token as string,
        lineId as string,
        null,
        "100",
        "",
      ),
    enabled: !!auth.token && !!lineId && onOpen === 5,
    refetchOnWindowFocus: false,
  });

  const assignUnits = useQuery<{
    list: { id: string; name?: string | null }[];
  }>({
    queryKey: ["units-for-assign", lineId],
    queryFn: () =>
      getLinetUnits(auth.token as string, lineId as string, null, "100", ""),
    enabled: !!auth.token && !!lineId && onOpen === 5,
    refetchOnWindowFocus: false,
  });

  const submitAssign = async () => {
    if (!assignPositionId || !assignUnitId) {
      toast.error("Pick a position and a unit");
      return;
    }
    setAssigning(true);
    try {
      const res = await provisionalInvite(auth.token as string, {
        applicationIds: selected,
        provisionalPositionId: assignPositionId,
        unitId: assignUnitId,
        userId: auth.userId as string,
        lineId: lineId as string,
        message: assignMessage.trim() || null,
      });
      toast.success(
        `${res?.invited ?? selected.length} applicant(s) invited to ${res?.position ?? "the position"}`,
        {
          description: res?.skipped
            ? `${res.skipped} skipped (already registered or invited).`
            : undefined,
        },
      );
      setOnOpen(0);
      setAssignPositionId("");
      setAssignUnitId("");
      setAssignMessage("");
      setSelected([]);
      setOnMultiSelect(false);
      queryClient.invalidateQueries({ queryKey: ["applications", lineId] });
    } catch (e) {
      toast.error("Failed to assign", { description: `${e}` });
    } finally {
      setAssigning(false);
    }
  };

  const items = data?.pages.flatMap((p) => p.list) ?? [];
  const hasActiveFilters =
    !!(appliedFilters.dateFrom ||
      appliedFilters.dateTo ||
      appliedFilters.positionId ||
      appliedFilters.tags.length);

  const statusColor = (s: number) => {
    if (s === 0) return "bg-amber-50 text-amber-700 border-amber-200";
    if (s === 1) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">

      {/* Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
              <FileText className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-gray-900 truncate">
                Applications
              </h1>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                {items.length} loaded
                {isFetching && items.length > 0 && " · refreshing..."}
                {selected.length > 0 && ` · ${selected.length} selected`}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {items.length} record{items.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-3 py-2 flex items-center gap-1.5 flex-wrap flex-shrink-0">
        <InputGroup className="bg-white flex-1 min-w-[180px] max-w-sm">
          <InputGroupAddon>
            <Search className="h-3 w-3 text-gray-400" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by name..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-7 text-[11px]"
          />
        </InputGroup>

        <Button
          size="sm"
          variant={onMultiSelect ? "default" : "outline"}
          onClick={() => {
            setOnMultiSelect((v) => !v);
            if (onMultiSelect) setSelected([]);
          }}
          className="h-7 text-[10px] gap-1.5"
        >
          {onMultiSelect ? (
            <SquareCheckBig className="h-3 w-3" />
          ) : (
            <Square className="h-3 w-3" />
          )}
          {onMultiSelect ? "Cancel" : "Select"}
        </Button>

        <Button
          size="sm"
          variant={hasActiveFilters ? "default" : "outline"}
          onClick={() => setOnOpen(1)}
          className="h-7 text-[10px] gap-1.5"
        >
          <Filter className="h-3 w-3" />
          Filter
          {hasActiveFilters && (
            <Badge
              variant="secondary"
              className="h-3.5 px-1 text-[9px] leading-none ml-0.5"
            >
              on
            </Badge>
          )}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0">
              <EllipsisVertical className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="end">
            <div className="space-y-0.5">
              <Button
                className="w-full justify-start h-7 text-[10px] gap-1.5"
                size="sm"
                variant="ghost"
                disabled={selected.length === 0}
                onClick={() => setOnOpen(2)}
              >
                <PhoneForwarded className="h-3 w-3" />
                Contact ({selected.length})
              </Button>
              <Button
                className="w-full justify-start h-7 text-[10px] gap-1.5 text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50"
                size="sm"
                variant="ghost"
                disabled={selected.length === 0}
                onClick={() => setOnOpen(5)}
              >
                <Clock4 className="h-3 w-3" />
                Assign to Non-Plantilla ({selected.length})
              </Button>
              <Button
                className="w-full justify-start h-7 text-[10px] gap-1.5"
                size="sm"
                variant="ghost"
                onClick={() => nav("post")}
              >
                <FolderPlus className="h-3 w-3" />
                New Posting
              </Button>
              <Button
                className="w-full justify-start h-7 text-[10px] gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                size="sm"
                variant="ghost"
                disabled={selected.length === 0}
                onClick={() => setOnOpen(3)}
              >
                <Trash2 className="h-3 w-3" />
                Delete selected
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="bg-white border-b px-3 py-1.5 flex items-center gap-1.5 flex-wrap flex-shrink-0">
          <span className="text-[10px] text-gray-500">Filters:</span>
          {(appliedFilters.dateFrom || appliedFilters.dateTo) && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
            >
              <CalendarArrowDown className="h-2.5 w-2.5 mr-0.5" />
              {appliedFilters.dateFrom || "…"} → {appliedFilters.dateTo || "…"}
            </Badge>
          )}
          {appliedFilters.positionId && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200"
            >
              <Briefcase className="h-2.5 w-2.5 mr-0.5" />
              Position
            </Badge>
          )}
          {appliedFilters.tags.map((t) => (
            <Badge
              key={t.tag}
              variant="outline"
              className="text-[10px] px-1.5 py-0"
            >
              {t.tag}
            </Badge>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="h-5 px-1.5 text-[10px] gap-1"
          >
            <ListRestart className="h-2.5 w-2.5" />
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              <TableRow>
                {onMultiSelect && (
                  <TableHead className="w-10 text-[10px] font-semibold text-gray-700">
                    <div className="flex items-center gap-1">
                      <SquareCheckBig className="h-3 w-3" />
                      {selected.length || ""}
                    </div>
                  </TableHead>
                )}
                <TableHead className="w-10 text-[10px] font-semibold text-gray-700">
                  No
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[160px]">
                  Position
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[160px]">
                  Applicant
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[110px]">
                  Date Filed
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 text-center w-24">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isError ? (
                <TableRow>
                  <TableCell
                    colSpan={onMultiSelect ? 6 : 5}
                    className="text-center py-8"
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-[10px] font-medium text-red-600">
                        Failed to load applications
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {(error as any)?.message ?? "Try again later."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isFetching && items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={onMultiSelect ? 6 : 5}
                    className="text-center py-8"
                  >
                    <div className="flex items-center justify-center gap-1.5 text-gray-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-[10px]">Loading applications...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={onMultiSelect ? 6 : 5}
                    className="text-center py-10"
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-300" />
                      </div>
                      <p className="text-xs font-medium text-gray-700">
                        No applications found
                      </p>
                      <p className="text-[10px] text-gray-500 max-w-[260px]">
                        {query || hasActiveFilters
                          ? "Try clearing search or filters."
                          : "Post a job to start collecting applications."}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] gap-1.5 mt-1"
                        onClick={() => nav("post")}
                      >
                        <FolderPlus className="h-3 w-3" />
                        New Posting
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, i) => (
                  <ApplicationItem
                    key={item.id}
                    item={item}
                    no={i + 1}
                    query={query}
                    onMultiSelect={onMultiSelect}
                    handleCheckSelected={handleCheckSelected}
                    handleAddSelected={handleAddSelected}
                    token={auth.token as string}
                    userId={auth.userId as string}
                    lineId={lineId as string}
                    statusColor={statusColor}
                  />
                ))
              )}

              {hasNextPage && (
                <TableRow ref={ref}>
                  <TableCell
                    colSpan={onMultiSelect ? 6 : 5}
                    className="text-center py-2"
                  >
                    {isFetchingNextPage ? (
                      <div className="flex items-center justify-center gap-1.5 text-gray-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-[10px]">Loading more...</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400">
                        Scroll to load more
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )}
              {!hasNextPage && items.length > 0 && (
                <TableRow>
                  <TableCell
                    colSpan={onMultiSelect ? 6 : 5}
                    className="text-center py-2 border-t"
                  >
                    <span className="text-[10px] text-gray-400">
                      Showing all {items.length} record
                      {items.length !== 1 ? "s" : ""}
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Filter modal */}
      <Modal
        title={
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="h-3 w-3 text-blue-500" />
            Filter Applications
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-2xl max-h-[90vh] overflow-auto"
        setOnOpen={() => setOnOpen(0)}
        footer={true}
        yesTitle="Apply Filters"
        cancelTitle="Cancel"
        onFunction={handleSubmit(applyFilters)}
        loading={isFetching}
      >
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="h-7 text-[10px] gap-1.5"
            >
              <ListRestart className="h-3 w-3" />
              Reset
            </Button>
          </div>

          <Form {...form}>
            <div className="space-y-3">
              <div>
                <FormLabel className="text-[10px] font-semibold text-gray-700">
                  Date Range
                </FormLabel>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <FormField
                    control={control}
                    name="dateFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <InputGroup>
                            <InputGroupAddon>
                              <CalendarArrowDown className="h-3 w-3" />
                            </InputGroupAddon>
                            <InputGroupInput
                              type="date"
                              className="h-8 text-xs"
                              {...field}
                            />
                          </InputGroup>
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="dateTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <InputGroup>
                            <InputGroupAddon>
                              <CalendarArrowUp className="h-3 w-3" />
                            </InputGroupAddon>
                            <InputGroupInput
                              type="date"
                              className="h-8 text-xs"
                              {...field}
                            />
                          </InputGroup>
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={control}
                name="positionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-semibold text-gray-700">
                      Position
                    </FormLabel>
                    <FormControl>
                      <PositionSelect
                        onChange={field.onChange}
                        value={field.value as string}
                        id={lineId as string}
                        token={auth.token as string}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel className="text-[10px] font-semibold text-gray-700">
                  Skill Tags
                </FormLabel>
                <div className="mt-1">
                  <FormTags
                    handleAddTags={handleAddTags}
                    handleCheckTags={handleCheckTags}
                  />
                </div>
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {allTags.map((t) => (
                      <Badge
                        key={t.tag}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {t.tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Contact modal */}
      <Modal
        footer={1}
        title={
          <div className="flex items-center gap-1.5 text-xs">
            <PhoneForwarded className="h-3 w-3 text-blue-500" />
            Contact Applicants ({selected.length})
          </div>
        }
        onOpen={onOpen === 2}
        className="max-w-2xl max-h-[90vh] overflow-auto"
        setOnOpen={() => setOnOpen(0)}
      >
        <ContactApplicant
          token={auth.token as string}
          setOnOpen={setOnOpen}
          applicationId={""}
          ids={selected}
          many={0}
        />
      </Modal>

      {/* Delete confirm */}
      <Modal
        title={undefined}
        onOpen={onOpen === 3}
        className=""
        setOnOpen={() => {
          if (deleteMut.isPending) return;
          setOnOpen(0);
        }}
        footer={1}
      >
        <ConfirmDelete
          title={`Delete ${selected.length} application${selected.length === 1 ? "" : "s"}`}
          confirmation="confirm"
          setOnOpen={() => {
            if (!deleteMut.isPending) setOnOpen(0);
          }}
          onFunction={() => {
            if (!deleteMut.isPending) deleteMut.mutateAsync();
          }}
          isLoading={deleteMut.isPending}
        />
      </Modal>

      {/* Assign to Non-Plantilla */}
      <Modal
        title={
          <div className="flex items-center gap-1.5 text-xs">
            <Clock4 className="h-3 w-3 text-indigo-500" />
            Assign {selected.length} applicant{selected.length === 1 ? "" : "s"}{" "}
            to a Non-Plantilla position
          </div>
        }
        onOpen={onOpen === 5}
        className="max-w-md max-h-[90vh] overflow-auto"
        setOnOpen={() => setOnOpen(0)}
        onFunction={submitAssign}
        loading={assigning}
        yesTitle="Send invitations"
        cancelTitle="Cancel"
        footer={true}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-gray-600">
            Each selected applicant gets a registration link for the chosen
            position + unit. Already-registered or already-invited applicants are
            skipped.
          </p>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700">
              Non-Plantilla position *
            </label>
            <Select value={assignPositionId} onValueChange={setAssignPositionId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue
                  placeholder={
                    provPositions.isFetching
                      ? "Loading positions..."
                      : "Select a position"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {(provPositions.data?.list ?? []).map((p) => (
                  <SelectItem
                    key={p.id}
                    value={p.id}
                    className="text-xs"
                    disabled={p.open <= 0}
                  >
                    {p.title} · {p.empType} ({p.open}/{p.slots} open)
                  </SelectItem>
                ))}
                {!provPositions.isFetching &&
                  (provPositions.data?.list ?? []).length === 0 && (
                    <div className="px-2 py-3 text-[11px] text-gray-400 text-center">
                      No non-plantilla positions. Create one in the Non-Plantilla
                      module first.
                    </div>
                  )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700">
              Assign to unit *
            </label>
            <Select value={assignUnitId} onValueChange={setAssignUnitId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                {(assignUnits.data?.list ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    {u.name ?? u.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700">
              Message (optional)
            </label>
            <Textarea
              placeholder="Add a note to the invitation email..."
              value={assignMessage}
              onChange={(e) => setAssignMessage(e.target.value)}
              className="text-xs min-h-[50px]"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Application;
