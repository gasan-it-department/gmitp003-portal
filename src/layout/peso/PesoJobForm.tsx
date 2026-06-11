import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
//
import { useAuth } from "@/provider/ProtectedRoute";
import {
  createPesoJob,
  updatePesoJob,
  pesoJobData,
} from "@/db/statements/peso";
import { PesoJobSchema } from "@/interface/zod";
import type { PesoJobFormProps, JobPostProps } from "@/interface/data";
//
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Modal from "@/components/custom/Modal";
import AddRequirementForm from "@/layout/human_resources/AddRequirementForm";
import PostJobRequirementList from "@/layout/human_resources/PostJobRequirementList";
//
import { Briefcase, Plus, FileText, Settings, ExternalLink } from "lucide-react";

const DEFAULTS: PesoJobFormProps = {
  jobTitle: "",
  employerName: "",
  location: "",
  employmentType: "",
  salaryText: "",
  desc: "",
  deadline: "",
  slot: 1,
  showApplicationCount: false,
  applyMode: "INTERNAL",
  applyUrl: "",
  contactInfo: "",
};

const PesoJobForm = () => {
  const { lineId, pesoJobId } = useParams();
  const isEdit = !!pesoJobId;
  const auth = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const [onOpen, setOnOpen] = useState(0);

  const { data, isFetching } = useQuery<JobPostProps>({
    queryKey: ["peso-job", pesoJobId],
    queryFn: () => pesoJobData(auth.token as string, pesoJobId as string),
    enabled: isEdit && !!auth.token,
  });

  const form = useForm<PesoJobFormProps>({
    resolver: zodResolver(PesoJobSchema),
    defaultValues: DEFAULTS,
  });
  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { isSubmitting },
  } = form;

  const applyMode = watch("applyMode");
  const published = data?.status === 1;
  const locked = published; // published posts are read-only until paused

  // Sync the form once the post loads (edit mode).
  useEffect(() => {
    if (data) {
      reset({
        jobTitle: data.jobTitle ?? "",
        employerName: data.employerName ?? "",
        location: data.location && data.location !== "N/A" ? data.location : "",
        employmentType: data.employmentType ?? "",
        salaryText: data.salaryText ?? "",
        desc: data.desc && data.desc !== "N/A" ? data.desc : "",
        deadline: data.deadline ? String(data.deadline).split("T")[0] : "",
        slot: data.slot ?? 1,
        showApplicationCount: data.showApplicationCount ?? false,
        applyMode: (data.applyMode as "INTERNAL" | "EXTERNAL") ?? "INTERNAL",
        applyUrl: data.applyUrl ?? "",
        contactInfo: data.contactInfo ?? "",
      });
    }
  }, [data, reset]);

  const statusMutation = useMutation({
    mutationFn: (status: number) =>
      updatePesoJob(auth.token as string, {
        id: pesoJobId as string,
        userId: auth.userId as string,
        lineId: lineId as string,
        status,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["peso-job", pesoJobId] });
    },
    onError: (err) => toast.error("Update failed", { description: `${err}` }),
  });

  const onSubmit = async (formData: PesoJobFormProps) => {
    try {
      const payload = {
        userId: auth.userId as string,
        lineId: lineId as string,
        ...formData,
        deadline: formData.deadline ? formData.deadline : null,
      };

      if (!isEdit) {
        const res = await createPesoJob(auth.token as string, payload);
        toast.success("Draft created", {
          description: "Add requirements (if any), then publish.",
        });
        nav(`/${lineId}/peso/post/${res.id}`, { replace: true });
      } else {
        await updatePesoJob(auth.token as string, {
          id: pesoJobId as string,
          ...payload,
        });
        toast.success("Changes saved");
        await queryClient.invalidateQueries({
          queryKey: ["peso-job", pesoJobId],
        });
      }
    } catch (error) {
      const msg = isAxiosError(error)
        ? error.response?.data?.message ?? error.message
        : error instanceof Error
          ? error.message
          : "Something went wrong";
      toast.error("Failed to submit", { description: msg });
    }
  };

  if (isEdit && isFetching) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <ScrollArea className="w-full h-full">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  <Badge variant="secondary">
                    {isEdit ? "Edit external job" : "New external job"}
                  </Badge>
                  {data && (
                    <Badge
                      className={
                        published
                          ? "bg-green-100 text-green-700"
                          : data.status === 3
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                      }
                    >
                      {published
                        ? "Published"
                        : data.status === 3
                          ? "Paused"
                          : "Draft"}
                    </Badge>
                  )}
                </div>
                <h1 className="text-xl font-bold text-gray-900">
                  {isEdit
                    ? data?.jobTitle || "External Job"
                    : "Post a private-sector / external job"}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Outside LGU HR jurisdiction — appears in the same public job
                  list as LGU posts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isEdit && (
                  <Button
                    variant="outline"
                    disabled={statusMutation.isPending}
                    onClick={() =>
                      statusMutation.mutate(data?.status === 1 ? 3 : 1)
                    }
                  >
                    {statusMutation.isPending ? (
                      <Spinner className="h-4 w-4" />
                    ) : data?.status === 1 ? (
                      "Pause"
                    ) : (
                      "Publish"
                    )}
                  </Button>
                )}
                <Button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting || locked}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? (
                    <Spinner className="h-4 w-4" />
                  ) : isEdit ? (
                    "Save changes"
                  ) : (
                    "Create draft"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main */}
            <div className="xl:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Job details</CardTitle>
                  <CardDescription>
                    Free-text fields for the external employer/role.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Warehouse Staff"
                            disabled={locked}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={control}
                      name="employerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employer / Company</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. ABC Corp."
                              disabled={locked}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Gasan, Marinduque"
                              disabled={locked}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="employmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employment type</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Full-time / Contract / …"
                              disabled={locked}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="salaryText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salary (text)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. ₱15,000 / month"
                              disabled={locked}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={control}
                    name="desc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Responsibilities, qualifications, etc."
                            className="min-h-[120px]"
                            disabled={locked}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Apply mode */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">How to apply</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={control}
                    name="applyMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                            disabled={locked}
                          >
                            <label className="flex items-start gap-3 border rounded-lg p-3 cursor-pointer">
                              <RadioGroupItem value="INTERNAL" id="internal" />
                              <div>
                                <p className="text-sm font-medium">
                                  In-app application
                                </p>
                                <p className="text-xs text-gray-500">
                                  Applicants apply through this system.
                                </p>
                              </div>
                            </label>
                            <label className="flex items-start gap-3 border rounded-lg p-3 cursor-pointer">
                              <RadioGroupItem value="EXTERNAL" id="external" />
                              <div>
                                <p className="text-sm font-medium">
                                  External link / contact
                                </p>
                                <p className="text-xs text-gray-500">
                                  Refer applicants to the employer.
                                </p>
                              </div>
                            </label>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {applyMode === "EXTERNAL" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={control}
                        name="applyUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <ExternalLink className="h-4 w-4" /> Apply URL
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://employer.com/apply"
                                disabled={locked}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="contactInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact info</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="email / phone"
                                disabled={locked}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Requirements — only for in-app applications, edit mode */}
              {isEdit && data?.applyMode === "INTERNAL" && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Requirements
                        </CardTitle>
                        <CardDescription>
                          Documents applicants must provide.
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => setOnOpen(1)}
                        disabled={locked}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" /> Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PostJobRequirementList
                      disabled={locked}
                      postJobId={pesoJobId as string}
                      token={auth.token as string}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Settings */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={control}
                    name="slot"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slots</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            disabled={locked}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadline</FormLabel>
                        <FormControl>
                          <Input type="date" disabled={locked} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="showApplicationCount"
                    render={({ field }) => (
                      <FormItem className="flex items-start gap-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={locked}
                          />
                        </FormControl>
                        <div className="leading-none">
                          <FormLabel className="text-sm">
                            Show application count
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Display number of applicants to viewers.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {!isEdit && (
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-4 text-xs text-gray-600">
                    Saving creates a <strong>draft</strong>. You can add
                    requirements (for in-app applications) and publish on the
                    next screen.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </Form>
      </div>

      {/* Add requirement modal */}
      {isEdit && data && (
        <Modal
          title={
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5" /> Add Requirement
            </div>
          }
          onOpen={onOpen === 1}
          className="max-w-2xl"
          setOnOpen={() => setOnOpen(0)}
          footer={1}
        >
          <AddRequirementForm
            postId={data.id}
            token={auth.token as string}
            setOnOpen={setOnOpen}
          />
        </Modal>
      )}
    </ScrollArea>
  );
};

export default PesoJobForm;
