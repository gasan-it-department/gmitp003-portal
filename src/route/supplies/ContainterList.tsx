import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useUser } from "@/provider/UserProvider";
import { useNavigate, useParams } from "react-router";
import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { useInView } from "react-intersection-observer";
//statements
import { getContainer } from "@/db/statement";

//interface
import {
  type CreateNewInventory,
  type InventoryBoxProps,
} from "@/interface/data";
import { formatDate } from "@/utils/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PackagePlus,
  Search,
  Loader2,
  Package,
  AlertCircle,
} from "lucide-react";

//
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Modal from "@/components/custom/Modal";
import { toast } from "sonner";

import { CreateInventoryBoxSchema } from "@/interface/zod";

import axios from "@/db/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ContainterList = () => {
  const auth = useAuth();
  const nav = useNavigate();
  const user = useUser();
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);

  const [onOpen, setOnOpen] = useState(0);
  const { lineId } = useParams();

  const { ref, inView } = useInView({
    threshold: 0,
  });

  const {
    data,
    isFetchingNextPage,
    isFetching,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
  } = useInfiniteQuery<{
    list: InventoryBoxProps[];
    lastCursor: string | null;
    hasMore: boolean;
  }>({
    queryFn: ({ pageParam }) =>
      getContainer(
        auth.token as string,
        pageParam as string | null,
        "20",
        query,
        user.user?.departmentId as string,
        auth.userId as string,
      ),
    queryKey: ["container", lineId], // Added query to key
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handeViewContainer = (id: string) => {
    try {
      nav(`/${lineId}/supplies/container/${id}`);
    } catch (error) {
      console.log(error);
    }
  };

  const queryClient = useQueryClient();

  const form = useForm<CreateNewInventory>({
    resolver: zodResolver(CreateInventoryBoxSchema),
  });
  const {
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
    setValue,
  } = form;

  const onSubmit = async (data: CreateNewInventory) => {
    try {
      const response = await axios.post(
        "/create-inventory",
        {
          name: data.name,
          lineId: lineId,
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
        console.log(response.data.message);

        setError("name", { message: response.data.message });
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: ["container", lineId],
      });
    } catch (error) {
      toast.error("TRANSACTION FAILED");
      console.log(error);
    } finally {
      setValue("name", "");
      setOnOpen(0);
    }
  };

  useEffect(() => {
    refetch();
  }, [query]);

  // SAFE: Filter out any undefined/null items
  const allContainers =
    data?.pages.flatMap(
      (page) => page?.list?.filter((item) => item && item.id) || [],
    ) || [];

  const totalContainers = allContainers.length;

  return (
    <div className="w-full h-full flex flex-col bg-gray-50/30">
      {/* Header Section */}
      <div className="p-4 sm:p-6 border-b bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                Inventory Containers
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Manage and organize your inventory items
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-xs sm:text-sm self-start sm:self-center"
          >
            {totalContainers} containers
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search containers..."
                onChange={(e) => setText(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 w-full"
              />
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setOnOpen(1)}
            className="gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <PackagePlus className="h-4 w-4" />
            <span className="hidden xs:inline">Create Container</span>
            <span className="xs:hidden">Create</span>
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
              <CardTitle className="text-sm sm:text-base font-semibold">
                Container List
              </CardTitle>
              {isFetching && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Loading...</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-300px)] sm:h-[calc(100vh-280px)]">
              {error ? (
                <div className="p-4 sm:p-6">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs sm:text-sm">
                      Failed to load containers. Please try again.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : isFetching && !data ? (
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {[...Array(8)].map((_, i) => (
                      <Card key={i} className="border">
                        <CardContent className="p-3 sm:p-4">
                          <Skeleton className="h-5 w-32 mb-2" />
                          <Skeleton className="h-4 w-24 mb-3" />
                          <Skeleton className="h-3 w-20" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : allContainers.length > 0 ? (
                <div className="p-3 sm:p-4 md:p-6">
                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {allContainers.map((item) => (
                      <Card
                        key={item.id}
                        className="border hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => handeViewContainer(item.id)}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start justify-between mb-2 sm:mb-3">
                            <div className="flex-1 min-w-0 pr-2">
                              <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base group-hover:text-blue-600 transition-colors">
                                {item.name}
                              </h3>
                              <Badge
                                variant="secondary"
                                className="mt-1 text-xs font-normal"
                              >
                                {item.code}
                              </Badge>
                            </div>
                            <div className="ml-2 p-2 bg-gray-100 rounded-lg group-hover:bg-blue-50 transition-colors flex-shrink-0">
                              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 group-hover:text-blue-600" />
                            </div>
                          </div>

                          <div className="space-y-1 sm:space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                Created
                              </span>
                              <span className="text-xs text-gray-600">
                                {formatDate(item.createdAt)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Infinite scroll trigger */}
                  <div ref={ref} className="py-4 sm:py-6">
                    <div className="text-center">
                      {isFetchingNextPage ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-xs sm:text-sm text-gray-600">
                            Loading more containers...
                          </span>
                        </div>
                      ) : !hasNextPage && totalContainers > 0 ? (
                        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-50 rounded-full border">
                          <Package className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                          <span className="text-xs sm:text-sm text-gray-600">
                            All {totalContainers} containers loaded
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-center p-4">
                  <div className="p-3 sm:p-4 bg-gray-100 rounded-full mb-3 sm:mb-4">
                    <Package className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-1 sm:mb-2">
                    {query ? "No containers found" : "No containers found"}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 max-w-xs sm:max-w-sm mb-3 sm:mb-4">
                    {query
                      ? `No containers match "${query}". Try a different search term.`
                      : "Get started by creating your first inventory container."}
                  </p>
                  <Button
                    variant="outline"
                    className="gap-2 w-full sm:w-auto"
                    onClick={() => setOnOpen(1)}
                  >
                    <PackagePlus className="h-4 w-4" />
                    Create First Container
                  </Button>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Create Container Modal */}
      <Modal
        onFunction={handleSubmit(onSubmit)}
        loading={isSubmitting}
        footer={true}
        title="Create New Container"
        children={
          <div className="w-full space-y-4">
            <Form {...form}>
              <FormField
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Container Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Office Supplies, Medical Equipment, etc."
                        {...field}
                        className="bg-gray-50"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    {errors.name && (
                      <FormMessage>{errors.name.message}</FormMessage>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Give your container a descriptive name for easy
                      identification.
                    </p>
                  </FormItem>
                )}
              />
            </Form>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md mx-4 sm:mx-auto"
        setOnOpen={() => {
          if (isSubmitting) return;
          setOnOpen(0);
        }}
        yesTitle="Create Container"
      />
    </div>
  );
};

export default ContainterList;
