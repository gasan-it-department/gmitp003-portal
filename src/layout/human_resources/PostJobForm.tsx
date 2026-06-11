import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { useAuth } from "@/provider/ProtectedRoute";
import { positionData } from "@/db/statement";
import axios from "@/db/axios";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/custom/Modal";

import AddRequirementForm from "./AddRequirementForm";
import PostJobRequirementList from "./PostJobRequirementList";
import SalaryGradeSelect from "./SalaryGradeSelect";

import {
  Plus,
  FileText,
  EyeOff,
  Users,
  Settings,
  BookOpen,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Briefcase,
  Pause,
  Play,
  Send,
  Save,
  CalendarClock,
} from "lucide-react";

import type { JobPostProps, PostJobApplicationProps } from "@/interface/data";
import { PostJobApplicationSchema } from "@/interface/zod";

// Status: 0 = Draft, 1 = Published, 3 = Paused
const STATUS_META: Record<
  number,
  { label: string; dotClass: string; chipClass: string; desc: string }
> = {
  0: {
    label: "Draft",
    dotClass: "bg-amber-500",
    chipClass: "bg-amber-50 text-amber-700 border-amber-200",
    desc: "Not visible to applicants yet.",
  },
  1: {
    label: "Published",
    dotClass: "bg-emerald-500",
    chipClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    desc: "Live and accepting applications.",
  },
  3: {
    label: "Paused",
    dotClass: "bg-orange-500",
    chipClass: "bg-orange-50 text-orange-700 border-orange-200",
    desc: "Hidden from applicants but kept for later.",
  },
};

const toDateInput = (v?: string | Date | null) => {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const PostJobForm = () => {
  const [onOpen, setOnOpen] = useState(0);
  const { positionPostId, lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const { data, isFetching, isError, error, refetch } = useQuery<JobPostProps>({
    queryKey: ["positionData", positionPostId],
    queryFn: () => positionData(auth.token as string, positionPostId as string),
    enabled: !!positionPostId && !!auth.token,
    refetchOnWindowFocus: false,
  });

  const form = useForm<PostJobApplicationProps>({
    resolver: zodResolver(PostJobApplicationSchema),
    defaultValues: {
      positions: {
        desc: "",
        requirements: [],
        salaruGrade: "",
        deadline: "",
        showApplicationCount: false,
        hideSG: false,
      },
    },
  });
  const {
    handleSubmit,
    formState: { isSubmitting, isDirty },
    control,
    reset,
  } = form;

  // Hydrate the form once data loads (defaultValues evaluate once at
  // useForm() call, so we can't depend on async query result there).
  useEffect(() => {
    if (!data) return;
    reset({
      positions: {
        desc: data.desc && data.desc !== "N/A" ? data.desc : "",
        requirements: [],
        salaruGrade: data.salaryGradeId ?? "",
        deadline: toDateInput(data.deadline),
        showApplicationCount: data.showApplicationCount ?? false,
        hideSG: data.hideSG ?? false,
      },
    });
  }, [data, reset]);

  // ── Save (any-status) mutation ─────────────────────────────────────
  const saveMut = useMutation({
    mutationFn: async (vars: {
      values: PostJobApplicationProps;
      status?: number;
    }) => {
      const v = vars.values.positions;
      const body: any = {
        id: positionPostId,
        userId: auth.userId,
        lineId,
        hideSG: v.hideSG,
        showApplicationCount: v.showApplicationCount,
        salaryGrade: v.salaruGrade || null,
        desc: v.desc,
        // null clears the deadline server-side.
        deadline: v.deadline ? new Date(v.deadline).toISOString() : null,
      };
      if (vars.status !== undefined) body.status = vars.status;

      const res = await axios.patch("/application/post/update", body, {
        headers: {
          Authorization: `Bearer ${auth.token as string}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["positionData", positionPostId],
        refetchType: "active",
      });
      toast.success("Job post updated");
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? err.response?.data?.message ??
          err.response?.data?.error ??
          err.message
        : err instanceof Error
          ? err.message
          : "Failed to save";
      toast.error(msg);
    },
  });

  // ── Status-only toggle (pause / resume / publish) ──────────────────
  const statusMut = useMutation({
    mutationFn: async (status: number) => {
      const res = await axios.patch(
        "/application/post/update",
        {
          id: positionPostId,
          userId: auth.userId,
          lineId,
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token as string}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );
      return res.data;
    },
    onSuccess: async (_, status) => {
      await queryClient.invalidateQueries({
        queryKey: ["positionData", positionPostId],
        refetchType: "active",
      });
      const label = STATUS_META[status]?.label ?? "Updated";
      toast.success(`Status: ${label}`);
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? err.response?.data?.message ?? err.message
        : err instanceof Error
          ? err.message
          : "Failed to change status";
      toast.error(msg);
    },
  });

  // ── Loading ────────────────────────────────────────────────────────
  if (isFetching && !data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-1.5 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-xs">Loading position...</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3">
        <div className="border rounded-lg bg-white p-6 text-center max-w-sm w-full">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <h3 className="text-xs font-semibold text-gray-900 mb-1">
            Failed to Load
          </h3>
          <p className="text-[10px] text-gray-500 mb-3">
            {(error as any)?.message ?? "Try again later."}
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="h-7 text-[10px]"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3">
        <div className="border rounded-lg bg-white p-6 text-center max-w-sm w-full">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-800">
            Position not found
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            The job posting may have been deleted.
          </p>
          <Button
            onClick={() => nav(-1)}
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1.5 mt-3"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[data.status] ?? STATUS_META[0];
  const isDraft = data.status === 0;
  const isPublished = data.status === 1;
  const isPaused = data.status === 3;

  const onSubmit = (values: PostJobApplicationProps) => {
    // From draft → publish on submit. Otherwise just save changes,
    // preserve current status.
    saveMut.mutateAsync({
      values,
      status: isDraft ? 1 : undefined,
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">

      {/* Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => nav(-1)}
            >
              <ArrowLeft className="h-3 w-3" />
            </Button>
            <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
              <Briefcase className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-gray-900 truncate">
                {data.position?.name ?? "Untitled position"}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
                <span className="text-[10px] text-gray-500">{meta.desc}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${meta.chipClass}`}
            >
              {meta.label}
            </Badge>

            {isPublished && (
              <Button
                size="sm"
                variant="outline"
                disabled={statusMut.isPending}
                onClick={() => statusMut.mutateAsync(3)}
                className="h-7 text-[10px] gap-1.5"
              >
                {statusMut.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Pause className="h-3 w-3" />
                )}
                Pause
              </Button>
            )}

            {isPaused && (
              <Button
                size="sm"
                variant="outline"
                disabled={statusMut.isPending}
                onClick={() => statusMut.mutateAsync(1)}
                className="h-7 text-[10px] gap-1.5"
              >
                {statusMut.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                Resume
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || saveMut.isPending || (!isDraft && !isDirty)}
              className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
            >
              {saveMut.isPending || isSubmitting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isDraft ? (
                <Send className="h-3 w-3" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              {isDraft ? "Publish" : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* Body — 2-column on xl, stacked otherwise */}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 max-w-6xl mx-auto">

          {/* Left — main form */}
          <div className="xl:col-span-2 space-y-3">

            {/* Description */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
                <BookOpen className="h-3 w-3 text-blue-500" />
                <div>
                  <h3 className="text-xs font-semibold text-gray-800">
                    Position Description
                  </h3>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                    Overview, responsibilities, qualifications
                  </p>
                </div>
              </div>
              <div className="p-3">
                <Form {...form}>
                  <FormField
                    control={control}
                    name="positions.desc"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe the role, responsibilities, qualifications..."
                            className="min-h-[160px] text-xs resize-y"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </Form>
              </div>
            </div>

            {/* Requirements */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-blue-500" />
                  <div>
                    <h3 className="text-xs font-semibold text-gray-800">
                      Application Requirements
                    </h3>
                    <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                      Documents applicants must submit
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setOnOpen(1)}
                  disabled={isPublished}
                  className="h-7 text-[10px] gap-1.5"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
              <div className="p-3 min-h-[140px]">
                <PostJobRequirementList
                  disabled={isPublished}
                  postJobId={positionPostId as string}
                  token={auth.token as string}
                />
              </div>
            </div>
          </div>

          {/* Right — sidebar settings */}
          <div className="space-y-3">

            {/* Settings */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
                <Settings className="h-3 w-3 text-blue-500" />
                <h3 className="text-xs font-semibold text-gray-800">
                  Posting Settings
                </h3>
              </div>
              <div className="p-3 space-y-3">
                <Form {...form}>
                  <FormField
                    control={control}
                    name="positions.salaruGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold text-gray-700">
                          Salary Grade
                        </FormLabel>
                        <FormControl>
                          <SalaryGradeSelect
                            lineId={lineId as string}
                            token={auth.token as string}
                            onChange={field.onChange}
                            value={field.value as string}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="positions.deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                          <CalendarClock className="h-2.5 w-2.5" />
                          Application Deadline
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ?? ""}
                            className="h-8 text-xs"
                          />
                        </FormControl>
                        <FormDescription className="text-[10px]">
                          Leave blank for open-ended.
                        </FormDescription>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2 pt-1 border-t">
                    <FormField
                      control={control}
                      name="positions.hideSG"
                      render={({ field }) => (
                        <FormItem className="flex items-start gap-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="mt-0.5"
                            />
                          </FormControl>
                          <div className="min-w-0">
                            <FormLabel className="text-[11px] font-medium text-gray-800 flex items-center gap-1">
                              <EyeOff className="h-2.5 w-2.5" />
                              Hide Salary Grade
                            </FormLabel>
                            <FormDescription className="text-[10px]">
                              Don't show the salary grade to applicants.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="positions.showApplicationCount"
                      render={({ field }) => (
                        <FormItem className="flex items-start gap-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="mt-0.5"
                            />
                          </FormControl>
                          <div className="min-w-0">
                            <FormLabel className="text-[11px] font-medium text-gray-800 flex items-center gap-1">
                              <Users className="h-2.5 w-2.5" />
                              Show Application Count
                            </FormLabel>
                            <FormDescription className="text-[10px]">
                              Public-facing applicant tally.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              </div>
            </div>

            {/* Status card */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50">
                <h3 className="text-xs font-semibold text-gray-800">
                  Status
                </h3>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${meta.dotClass}`} />
                  <span className="text-xs font-semibold text-gray-900">
                    {meta.label}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 leading-snug">
                  {meta.desc}
                </p>
                {data._count?.application !== undefined && (
                  <div className="flex items-center justify-between text-[10px] pt-2 border-t">
                    <span className="text-gray-500">Applications received</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {data._count.application}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add requirement modal */}
      <Modal
        title={
          <div className="flex items-center gap-1.5 text-xs">
            <Plus className="h-3 w-3 text-blue-500" />
            Add Requirement
          </div>
        }
        children={
          <AddRequirementForm
            postId={data.id}
            token={auth.token as string}
            setOnOpen={setOnOpen}
          />
        }
        onOpen={onOpen === 1}
        className="max-w-2xl"
        setOnOpen={() => setOnOpen(0)}
        footer={1}
      />
    </div>
  );
};

export default PostJobForm;
