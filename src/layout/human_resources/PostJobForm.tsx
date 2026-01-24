import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { positionData } from "@/db/statement";
import axios from "@/db/axios";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router";
//
import { updatePostedJobStatus } from "@/db/statements/jobPost";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import Modal from "@/components/custom/Modal";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import AddRequirementForm from "./AddRequirementForm";
import { toast } from "sonner";
import PostJobRequirementList from "./PostJobRequirementList";
import { Checkbox } from "@/components/ui/checkbox";
import SalaryGradeSelect from "./SalaryGradeSelect";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
//icons
import {
  Plus,
  FileText,
  EyeOff,
  Users,
  Settings,
  BookOpen,
} from "lucide-react";
//interface/props/
import type { JobPostProps, PostJobApplicationProps } from "@/interface/data";
import { PostJobApplicationSchema } from "@/interface/zod";
import { Input } from "@/components/ui/input";

const PostJobForm = () => {
  const [onOpen, setOnOpen] = useState(0);
  const { positionPostId, lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const { data, isFetching } = useQuery<JobPostProps>({
    queryKey: ["positionData", positionPostId],
    queryFn: () => positionData(auth.token as string, positionPostId as string),
    enabled: !!positionPostId || !!auth.token,
  });

  const form = useForm<PostJobApplicationProps>({
    resolver: zodResolver(PostJobApplicationSchema),
    defaultValues: {
      positions: {
        desc: data && data.desc ? data.desc : "N/A",
        requirements: [],
        salaruGrade: data?.salaryGradeId as string | undefined,
        showApplicationCount: false,
        hideSG: false,
      },
    },
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
  } = form;

  const handleUpdateStatus = useMutation({
    mutationFn: (status: number) =>
      updatePostedJobStatus(
        auth.token as string,
        data?.id as string,
        auth.userId as string,
        lineId as string,
        status,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["positionData", positionPostId],
        refetchType: "active",
      });
    },
    onError: (err) => {
      toast.error("TRANSACTION FAILED", {
        description: `${err}`,
      });
    },
  });

  const onSubmit = async (formData: PostJobApplicationProps) => {
    if (!positionPostId) {
      return toast.warning("INVALID REQUIRED ID");
    }
    try {
      const response = await axios.patch(
        "/application/post/update",
        {
          id: positionPostId,
          userId: auth.userId,
          lineId: lineId,
          status: 1,
          hideSG: formData.positions.hideSG,
          showApplicationCount: formData.positions.showApplicationCount,
          salaryGrade: formData.positions.salaruGrade,
          desc: formData.positions.desc,
          deadline: formData.positions.deadline
            ? new Date(formData.positions.deadline).toISOString()
            : undefined,
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
      if (response.status !== 200) {
        throw new Error(response.data.message);
      }
      nav(-1);
      setOnOpen(0);
    } catch (error) {
      if (isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to submit";

        toast.error("Failed to submit", {
          description: errorMessage,
        });
      } else if (error instanceof Error) {
        toast.error("Failed to submit", {
          description: error.message,
        });
      } else {
        toast.error("Failed to submit", {
          description: "An unexpected error occurred",
        });
      }
    }
  };

  if (isFetching) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-600">Loading position data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="font-semibold text-gray-800 text-lg mb-2">
            Data not found!
          </p>
          <p className="text-gray-600">
            The position may have been deleted or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="w-full h-full">
      <div className="p-6 space-y-6">
        {/* Header Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <Badge variant="secondary" className="mb-2">
                  Position Details
                </Badge>
                <h1 className="text-2xl font-bold text-gray-900">
                  {data.position.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  Configure and publish this job position
                </p>
              </div>
              <Button
                onClick={() => {
                  if (handleUpdateStatus.isPending) return;
                  handleUpdateStatus.mutateAsync(data.status === 1 ? 3 : 1);
                }}
                size="sm"
              >
                {handleUpdateStatus.isPending ? (
                  <Spinner />
                ) : data.status === 1 ? (
                  "Pause"
                ) : data.status === 3 ? (
                  "Deploy"
                ) : (
                  ""
                )}
              </Button>
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || data.status === 1}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Publishing...
                  </>
                ) : (
                  "Publish Position"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Adjusted Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Main Form (3/4 width) */}
          <div className="xl:col-span-3 space-y-6">
            {/* Job Description Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Position Description
                </CardTitle>
                <CardDescription>
                  Provide a comprehensive description of the position,
                  responsibilities, and requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...form}>
                  <FormField
                    control={control}
                    name="positions.desc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter detailed job description, responsibilities, and requirements..."
                            className="min-h-[140px] bg-white resize-vertical"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>
              </CardContent>
            </Card>

            {/* Requirements Card - Now much larger */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Application Requirements
                    </CardTitle>
                    <CardDescription>
                      Define what documents and information applicants need to
                      provide
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setOnOpen(1)}
                    disabled={data.status === 1}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Requirement
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="min-h-[200px]">
                  <PostJobRequirementList
                    disabled={data.status === 1}
                    postJobId={positionPostId as string}
                    token={auth.token as string}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Settings (1/4 width) */}
          <div className="space-y-6">
            {/* Compensation & Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...form}>
                  <FormField
                    control={control}
                    name="positions.salaruGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary Grade</FormLabel>
                        <FormControl>
                          <SalaryGradeSelect
                            lineId={lineId as string}
                            token={auth.token as string}
                            onChange={field.onChange}
                            value={field.value as string}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="positions.deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadline</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4 pt-2">
                    <FormField
                      control={control}
                      name="positions.hideSG"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="flex items-center gap-2 text-sm">
                              <EyeOff className="w-4 h-4" />
                              Hide Salary Grade
                            </FormLabel>
                            <FormDescription className="text-xs">
                              Salary grade will not be visible to applicants
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="positions.showApplicationCount"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="flex items-center gap-2 text-sm">
                              <Users className="w-4 h-4" />
                              Show Application Count
                            </FormLabel>
                            <FormDescription className="text-xs">
                              Display number of applicants to viewers
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Position Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      data.status === 1 ? "bg-green-500" : "bg-amber-500"
                    }`}
                  />
                  <div>
                    <span className="text-sm font-medium block">
                      {data.status === 1 ? "Published" : "Draft"}
                    </span>
                    <p className="text-xs text-gray-600 mt-1">
                      {data.status === 1
                        ? "This position is live and accepting applications"
                        : "This position is in draft mode"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ScrollBar orientation="vertical" />

      <Modal
        title={
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
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
    </ScrollArea>
  );
};

export default PostJobForm;
