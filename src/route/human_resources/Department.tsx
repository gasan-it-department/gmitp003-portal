import { useState } from "react";
import { useInView } from "react-intersection-observer";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { useAuth } from "@/provider/ProtectedRoute";
import { getLinetUnits } from "@/db/statement";
import axios from "@/db/axios";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import Modal from "@/components/custom/Modal";
import { Badge } from "@/components/ui/badge";

import UnitItem from "@/layout/human_resources/item/UnitItem";

import {
  Building2,
  Users,
  Hash,
  PlusCircle,
  AlertCircle,
  Search,
  Loader2,
  RefreshCw,
} from "lucide-react";

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
  const [onOpen, setOnOpen] = useState(0); // 0 closed · 1 add
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 400);
  const { lineId } = useParams();
  const auth = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
    error,
    refetch,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["departments", lineId, query],
    queryFn: ({ pageParam }) =>
      getLinetUnits(
        auth.token as string,
        lineId as string,
        pageParam as string | null,
        "20",
        query,
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

  const form = useForm<AddUnitProps>({
    resolver: zodResolver(AddUnitSchema),
    defaultValues: { name: "", description: "" },
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
    control,
  } = form;

  const createMut = useMutation({
    mutationFn: async (vals: AddUnitProps) => {
      const res = await axios.post(
        "/add-unit",
        {
          lineId,
          title: vals.name,
          description: vals.description,
          userId: auth.userId,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );
      return res.data;
    },
    onSuccess: async (_, vars) => {
      await queryClient.invalidateQueries({
        queryKey: ["departments", lineId],
        refetchType: "active",
      });
      reset();
      setOnOpen(0);
      toast.success("Unit created", {
        description: vars.name,
      });
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? err.response?.data?.message ?? err.message
        : err instanceof Error
          ? err.message
          : "Failed to add unit";
      toast.error(msg);
    },
  });

  const items = data?.pages.flatMap((p) => p.list) ?? [];
  const total = items.length;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">

      {/* Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
              <Building2 className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-gray-900 truncate">
                Departments &amp; Units
              </h1>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                Organizational structure for this line
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setOnOpen(1)}
            className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
          >
            <PlusCircle className="h-3 w-3" />
            Add Unit
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-3 py-2 flex items-center gap-1.5 flex-shrink-0">
        <InputGroup className="bg-white flex-1 max-w-xs">
          <InputGroupAddon>
            <Search className="h-3 w-3 text-gray-400" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by name or code..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-7 text-[11px]"
          />
        </InputGroup>
        <span className="text-[10px] text-gray-500 ml-auto">
          {total} unit{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <div className="border rounded-lg bg-white overflow-hidden">
          {/* Table header */}
          <div className="px-3 py-2 border-b bg-gray-50 grid grid-cols-12 gap-2">
            <div className="col-span-1 flex items-center gap-1 text-[10px] font-semibold text-gray-700">
              <Hash className="h-2.5 w-2.5" />#
            </div>
            <div className="col-span-7 flex items-center gap-1 text-[10px] font-semibold text-gray-700">
              <Building2 className="h-2.5 w-2.5" />
              Unit
            </div>
            <div className="col-span-3 flex items-center gap-1 text-[10px] font-semibold text-gray-700">
              <Users className="h-2.5 w-2.5" />
              Personnel
            </div>
            <div className="col-span-1 text-right text-[10px] font-semibold text-gray-700">
              {/* Actions */}
            </div>
          </div>

          {/* Body rows */}
          {isError ? (
            <div className="flex flex-col items-center gap-1.5 py-10 px-3 text-center">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-[10px] font-medium text-red-600">
                Failed to load departments
              </p>
              <p className="text-[10px] text-gray-500 max-w-[280px]">
                {(error as any)?.message ?? "Try again later."}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] gap-1.5 mt-1"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            </div>
          ) : isFetching && total === 0 ? (
            <div className="flex items-center justify-center gap-1.5 py-10 text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="text-[10px]">Loading units...</span>
            </div>
          ) : total === 0 ? (
            <div className="flex flex-col items-center gap-1.5 py-10 px-3 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-gray-300" />
              </div>
              <p className="text-xs font-medium text-gray-700">
                No units yet
              </p>
              <p className="text-[10px] text-gray-500 max-w-[260px]">
                {query
                  ? `No units match "${query}".`
                  : "Create your first organizational unit."}
              </p>
              {!query && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] gap-1.5 mt-1"
                  onClick={() => setOnOpen(1)}
                >
                  <PlusCircle className="h-3 w-3" />
                  Create Unit
                </Button>
              )}
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-100">
                {items.map((item, i) => (
                  <UnitItem key={item.id} item={item} no={i + 1} />
                ))}
              </ul>

              {hasNextPage && (
                <div
                  ref={ref}
                  className="px-3 py-2 border-t text-center"
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
                </div>
              )}

              {!hasNextPage && total > 0 && (
                <div className="px-3 py-2 border-t flex items-center justify-between bg-gray-50">
                  <span className="text-[10px] text-gray-500">
                    Showing all {total} unit{total !== 1 ? "s" : ""}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    End
                  </Badge>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Unit Modal */}
      <Modal
        title="Create New Unit"
        onOpen={onOpen === 1}
        className="max-w-md"
        setOnOpen={() => {
          if (createMut.isPending || isSubmitting) return;
          reset();
          setOnOpen(0);
        }}
        footer={true}
        yesTitle="Create Unit"
        onFunction={handleSubmit((v) => createMut.mutateAsync(v))}
        loading={createMut.isPending || isSubmitting}
      >
        <Form {...form}>
          <div className="space-y-3">
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Unit Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Human Resources"
                      {...field}
                      className="h-8 text-xs"
                    />
                  </FormControl>
                  <FormDescription className="text-[10px]">
                    Clear, descriptive name (max 120 chars).
                  </FormDescription>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the unit's purpose..."
                      {...field}
                      className="min-h-[80px] text-xs resize-y"
                    />
                  </FormControl>
                  <FormDescription className="text-[10px]">
                    Optional — context about this unit's role.
                  </FormDescription>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Department;
