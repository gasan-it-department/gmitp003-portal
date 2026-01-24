import { useState } from "react";
import { useAuth } from "@/provider/ProtectedRoute";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import axios from "@/db/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { getLinetUnits } from "@/db/statement";
//
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Modal from "@/components/custom/Modal";
import UnitItem from "@/layout/human_resources/item/UnitItem";
import SWWItem from "@/layout/item/SWWItem";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
//
import { FolderPlus, Building2, Users, Hash, Calendar } from "lucide-react";

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

  const { lineId } = useParams();
  const auth = useAuth();
  const queryClient = useQueryClient();

  const { data, isFetching, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery<ListProps>({
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
      getNextPageParam: (lastPage) => lastPage.lastCursor,
    });

  const form = useForm<AddUnitProps>({
    resolver: zodResolver(AddUnitSchema),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
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
    } catch (error) {
      toast.error("Something went wrong!", {
        description: "Failed to add unit. Please try again.",
        closeButton: false,
      });
      console.log("Error: ", error);
    }
  };

  const allDepartments = data?.pages.flatMap((page) => page.list) || [];
  const totalDepartments = allDepartments.length;
  const isLoading =
    isFetching && !isFetchingNextPage && allDepartments.length === 0;

  return (
    <Card className="w-full h-full flex flex-col border-none shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Departments & Units
              </CardTitle>
              <CardDescription>
                Manage organizational departments and units
              </CardDescription>
            </div>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setOnOpen(1)}>
            <FolderPlus className="h-4 w-4" />
            Add New Unit
          </Button>
        </div>

        {!isLoading && totalDepartments > 0 && (
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>
                Total Units: <strong>{totalDepartments}</strong>
              </span>
            </div>
            {hasNextPage && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  Scroll to load more
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="h-full overflow-auto">
          {isLoading ? (
            // Loading skeleton
            <div className="px-6 py-4 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : allDepartments.length > 0 ? (
            <div className="divide-y divide-gray-100">
              <div className="sticky top-0 z-10 bg-white border-b">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50">
                  <div className="col-span-1 font-semibold text-sm text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    No.
                  </div>
                  <div className="col-span-5 font-semibold text-sm text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Unit / Department
                  </div>
                  <div className="col-span-4 font-semibold text-sm text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Personnel / Members
                  </div>
                  <div className="col-span-2 font-semibold text-sm text-gray-700 uppercase tracking-wider text-center">
                    Actions
                  </div>
                </div>
              </div>

              {allDepartments.map((item, i) => (
                <UnitItem key={item.id} item={item} no={i + 1} />
              ))}

              {/* Infinite scroll loading */}
              {isFetchingNextPage && (
                <div className="px-6 py-6 bg-gray-50 border-t">
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm text-gray-600">
                      Loading more units...
                    </span>
                  </div>
                </div>
              )}

              {/* End of list */}
              {!hasNextPage && totalDepartments > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing{" "}
                      <span className="font-semibold">{totalDepartments}</span>{" "}
                      unit{totalDepartments !== 1 ? "s" : ""}
                    </div>
                    <Badge variant="outline" className="font-normal">
                      {totalDepartments} total
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Empty state
            <div className="py-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No departments found
                </h3>
                <p className="text-gray-500 mb-6">
                  Start by adding your first organizational unit or department
                </p>
                <Button onClick={() => setOnOpen(1)} className="gap-2">
                  <FolderPlus className="h-4 w-4" />
                  Add First Unit
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Add Unit Modal */}
      <Modal
        title="Add New Unit"
        onFunction={handleSubmit(onSubmit)}
        children={
          <Card className="border-none shadow-none">
            <CardContent className="p-6">
              <Form {...form}>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Unit Information
                        </h3>
                        <p className="text-sm text-gray-500">
                          Enter details for the new organizational unit
                        </p>
                      </div>
                    </div>

                    <FormField
                      control={control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Unit Title *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Human Resources Department"
                              {...field}
                              className="h-10"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Enter the official name of the department or unit
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <FormField
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the unit's purpose, responsibilities, or functions..."
                            {...field}
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Optional: Provide additional context about this unit
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-600">
                            i
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Information
                        </p>
                        <p className="text-xs text-gray-600">
                          Units are organizational divisions that can contain
                          multiple positions and personnel. Each unit must have
                          a unique name within this line.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Form>
            </CardContent>
          </Card>
        }
        onOpen={onOpen === 1}
        className="max-w-lg"
        setOnOpen={() => {
          setOnOpen(0);
          reset();
        }}
        loading={isSubmitting}
        footer={true}
      />

      {/* Other Modal */}
      <Modal
        title={selected?.title ?? "Closing..."}
        children={undefined}
        onOpen={selected?.id ? true : false}
        className="max-w-md"
        setOnOpen={() => {
          setSelected(null);
        }}
      />

      {/* Initial loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-96 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Loading Departments
                </h3>
                <p className="text-gray-500">
                  Fetching organizational units...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default Department;
