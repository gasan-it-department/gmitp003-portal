import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useAuth } from "@/provider/ProtectedRoute";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useForm } from "react-hook-form";
import axios from "@/db/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { getLinetUnits } from "@/db/statement";
//

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Modal from "@/components/custom/Modal";
import UnitItem from "@/layout/human_resources/item/UnitItem";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  Hash,
  Info,
  PlusCircle,
  AlertCircle,
  Briefcase,
} from "lucide-react";

//
import type {
  Department as DepartmentProps,
  AddUnitProps,
} from "@/interface/data";
import { AddUnitSchema } from "@/interface/zod";
interface ListProps {
  list: DepartmentProps[];
  lastCursor: string | null;
  hasMore: boolean;
}

const Department = () => {
  const [selected, setSelected] = useState<{
    id: string;
    title: string;
    option: number;
  } | null>(null);
  const [onOpen, setOnOpen] = useState(0);

  // Add useInView hook for infinite scroll
  const { ref, inView } = useInView();

  const { lineId } = useParams();
  const auth = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isFetching,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    error,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["departments", lineId],
    queryFn: ({ pageParam }) =>
      getLinetUnits(
        auth.token as string,
        lineId as string,
        pageParam as string | null,
        "20",
        "",
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  // Infinite scroll trigger effect
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const form = useForm<AddUnitProps>({
    resolver: zodResolver(AddUnitSchema),
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
    control,
  } = form;

  const onSubmit = async (data: AddUnitProps) => {
    if (!auth.userId) return toast.error("User not authenticated");
    if (!lineId) return toast.error("Line ID is missing");
    try {
      const response = await axios.post(
        "/add-unit",
        {
          lineId,
          title: data.name,
          description: data.description,
          userId: auth.userId,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        },
      );

      if (response.status !== 200) {
      }
      await queryClient.invalidateQueries({
        queryKey: ["departments", lineId],
        refetchType: "active",
      });
      reset();
      setOnOpen(0);
      toast.success("Unit added successfully", {
        description: `${data.name} has been created`,
      });
    } catch (error) {
      toast.error("Failed to add unit", {
        description: "Please check your connection and try again",
      });
      console.log("Error: ", error);
    }
  };

  const allDepartments = data?.pages.flatMap((page) => page.list) || [];
  const totalDepartments = allDepartments.length;
  const isLoading =
    isFetching && !isFetchingNextPage && allDepartments.length === 0;

  // Show error state if there's an error
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-auto shadow-lg border-red-100">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Unable to Load Departments
              </h3>
              <p className="text-gray-500 mb-4">
                There was a problem fetching the department list
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50">
      <div className="h-full px-4 py-4">
        {/* Header Section - Compact */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Departments & Units
                </h1>
                <p className="text-xs text-gray-500">
                  Manage organizational structure
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm"
              onClick={() => setOnOpen(1)}
            >
              <PlusCircle className="h-4 w-4" />
              Add Unit
            </Button>
          </div>
        </div>

        {/* Main Content Card - Compact */}
        <div className="  overflow-hidden bg-white">
          <div className="p-0">
            <div className="h-[calc(100vh-180px)] overflow-auto">
              {isLoading ? (
                // Loading skeleton - Compact
                <div className="p-3 space-y-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-md bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-md" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                      </div>
                      <Skeleton className="h-7 w-20" />
                    </div>
                  ))}
                </div>
              ) : allDepartments.length > 0 ? (
                <div>
                  {/* Table Header - Compact */}
                  <div className="sticky top-0 z-10 bg-gray-50 border-b px-4 py-2">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-1 flex items-center gap-1 text-xs font-medium text-gray-500">
                        <Hash className="h-3 w-3" />#
                      </div>
                      <div className="col-span-5 flex items-center gap-1 text-xs font-medium text-gray-500">
                        <Building2 className="h-3 w-3" />
                        Unit
                      </div>
                      <div className="col-span-4 flex items-center gap-1 text-xs font-medium text-gray-500">
                        <Users className="h-3 w-3" />
                        Personnel
                      </div>
                    </div>
                  </div>

                  {/* List Items */}
                  <div className="divide-y divide-gray-100">
                    {allDepartments.map((item, i) => (
                      <UnitItem key={item.id} item={item} no={i + 1} />
                    ))}
                  </div>

                  {/* Infinite scroll trigger */}
                  <div ref={ref} className="h-1" />

                  {/* Loading more indicator */}
                  {isFetchingNextPage && (
                    <div className="py-4 bg-gray-50 border-t">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="text-xs text-gray-600">
                          Loading more...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* End of list footer */}
                  {!hasNextPage && totalDepartments > 0 && (
                    <div className="px-4 py-3 bg-gray-50 border-t">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          Showing all {totalDepartments} unit
                          {totalDepartments !== 1 ? "s" : ""}
                        </div>
                        <Badge variant="outline" className="text-xs bg-white">
                          End
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Empty state - Compact
                <div className="py-12 text-center">
                  <div className="max-w-xs mx-auto">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-md font-semibold text-gray-900 mb-1">
                      No Departments Yet
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">
                      Create your first organizational unit
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setOnOpen(1)}
                      className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700"
                    >
                      <PlusCircle className="h-3 w-3" />
                      Create Unit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Unit Modal - Compact */}
      <Modal
        title="Create New Unit"
        onFunction={handleSubmit(onSubmit)}
        children={
          <div className="p-5">
            <Form {...form}>
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center gap-2 pb-3 border-b">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md">
                    <Briefcase className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Unit Configuration
                    </h3>
                    <p className="text-xs text-gray-500">
                      Define unit information
                    </p>
                  </div>
                </div>

                {/* Unit Name Field */}
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700">
                        Unit Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Human Resources"
                          {...field}
                          className="h-9 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Clear, descriptive name for this unit
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="my-1" />

                {/* Description Field */}
                <FormField
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the unit's purpose and responsibilities..."
                          {...field}
                          className="min-h-[100px] text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Optional: Provide context about this unit's role
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Info Alert */}
                <div className="rounded-md bg-blue-50 p-3 border border-blue-100">
                  <div className="flex gap-2">
                    <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-blue-900 mb-0.5">
                        About Organizational Units
                      </p>
                      <p className="text-xs text-blue-700">
                        Units represent departments, teams, or divisions within
                        your organization.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Form>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md max-h-[90vh] overflow-auto"
        setOnOpen={() => {
          setOnOpen(0);
          reset();
        }}
        loading={isSubmitting}
        footer={true}
      />

      {/* Other Modal */}
      <Modal
        title={selected?.title ?? "Unit Details"}
        children={undefined}
        onOpen={selected?.id ? true : false}
        className="max-w-md"
        setOnOpen={() => {
          setSelected(null);
        }}
      />
    </div>
  );
};

export default Department;
