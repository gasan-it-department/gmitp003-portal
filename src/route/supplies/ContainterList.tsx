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
import {
  PageShell,
  Toolbar,
  PageBody,
  Panel,
  PanelBody,
  EmptyState,
  ListFooter,
} from "@/components/custom/page";

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
    <PageShell>
      <Toolbar
        icon={Package}
        title="Inventory Containers"
        subtitle="Boxes of supplies, each holding its own lists"
      >
        <div className="flex-1 min-w-[180px]">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              placeholder="Search containers..."
              onChange={(e) => setText(e.target.value)}
              className="h-8 pl-7 text-xs"
            />
          </div>
        </div>

        {isFetching && !isFetchingNextPage ? (
          <Loader2 className="h-3 w-3 animate-spin text-gray-400 shrink-0" />
        ) : null}

        <Button
          size="sm"
          onClick={() => setOnOpen(1)}
          className="h-8 text-xs gap-1.5 shrink-0"
        >
          <PackagePlus className="h-3 w-3" />
          New container
        </Button>
      </Toolbar>

      <PageBody>
        <Panel>
          <PanelBody className="p-3">
            {error ? (
              <EmptyState
                icon={AlertCircle}
                title="Could not load containers"
                hint="The list could not be fetched. Check the connection and try again."
              />
            ) : isFetching && !data ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="border rounded-md p-2.5 space-y-1.5">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-2.5 w-16" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                ))}
              </div>
            ) : allContainers.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {allContainers.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handeViewContainer(item.id)}
                      className="group text-left border rounded-md p-2.5 bg-white hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-gray-900 truncate group-hover:text-blue-700">
                            {item.name}
                          </div>
                          {/* The code is how a container is referred to out
                              loud, so it gets monospace and stays put. */}
                          <div className="mt-0.5 font-mono text-[10px] text-gray-500">
                            {item.code ?? "—"}
                          </div>
                        </div>
                        <Package className="h-3.5 w-3.5 text-gray-300 shrink-0 group-hover:text-blue-500" />
                      </div>
                      <div className="mt-2 pt-1.5 border-t text-[10px] text-gray-500">
                        Created {formatDate(item.createdAt)}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Infinite scroll sentinel */}
                <div ref={ref} className="h-8 flex items-center justify-center">
                  {isFetchingNextPage ? (
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading more...
                    </span>
                  ) : null}
                </div>
              </>
            ) : (
              <EmptyState
                icon={Package}
                title={query ? "No containers match that" : "No containers yet"}
                hint={
                  query
                    ? `Nothing is called "${query}". Try a shorter search.`
                    : "A container is a box of supplies — create one to start adding lists and stock."
                }
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => setOnOpen(1)}
                  >
                    <PackagePlus className="h-3 w-3" />
                    {query ? "Create a container" : "Create the first one"}
                  </Button>
                }
              />
            )}
          </PanelBody>

          {totalContainers > 0 ? (
            <ListFooter total={totalContainers} noun="container">
              {!hasNextPage ? (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                  All loaded
                </Badge>
              ) : null}
            </ListFooter>
          ) : null}
        </Panel>
      </PageBody>

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
    </PageShell>
  );
};

export default ContainterList;
