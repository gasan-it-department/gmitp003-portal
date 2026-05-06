import { useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useInView } from "react-intersection-observer";
//
import axios from "@/db/axios";
import { zodResolver } from "@hookform/resolvers/zod";

//
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  FormField,
  Form,
  FormControl,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
//interface and props

import type {
  NewOrderProps,
  ProtectedRouteProps,
  SupplyBatchOrder,
} from "@/interface/data";
import { NewOrderSchema } from "@/interface/zod";
import { getSupplyOrders } from "@/db/statement";
import {
  Plus,
  Search,
  FileText,
  Calendar,
  Package,
  RefreshCw,
  AlertTriangle,
  X,
} from "lucide-react";
import Modal from "@/components/custom/Modal";
import { formatDate, formatPureDate } from "@/utils/date";
import { supplyOrderStatusTextColor, supplyOrderStatus } from "@/utils/helper";

interface Props {
  list: SupplyBatchOrder[];
  lastCursor: string | null;
  hasMore: boolean;
}

interface OrderListProps {
  listId?: string;
  lineId?: string;
  auth: ProtectedRouteProps | undefined;
  containerId: string | undefined;
}

const OrderList = ({ auth, listId, lineId, containerId }: OrderListProps) => {
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const [onOpen, setOnOpen] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [debouncedQuery] = useDebounce(searchText, 500);
  const { ref, inView } = useInView();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<NewOrderProps>({
    resolver: zodResolver(NewOrderSchema),
    defaultValues: {
      title: "",
    },
  });
  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    reset,
  } = form;

  const onSubmit = async (data: NewOrderProps) => {
    try {
      const response = await axios.post(
        "/new-order",
        {
          title: data.title,
          id: listId,
          lineId,
        },
        {
          headers: {
            Authorization: `Bearer ${auth?.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        },
      );

      if (response.status !== 200) {
        throw new Error(response.data.message);
      }
      await queryClient.invalidateQueries({
        queryKey: ["orders", containerId, listId],
        refetchType: "active",
      });
      reset();
      setOnOpen(0);
      toast.success("Order created successfully");
      nav(`order/${response.data.data.id}`);
    } catch (error: any) {
      toast.error("Failed to create order", {
        description: error.message || "Please try again",
      });
    }
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    isFetching,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery<Props>({
    queryFn: ({ pageParam }) =>
      getSupplyOrders(
        auth?.token as string,
        debouncedQuery,
        pageParam as string | null,
        "20",
        listId as string,
      ),
    queryKey: ["orders", listId],
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allOrders = data?.pages.flatMap((page) => page.list) || [];
  const totalOrders = allOrders.length;
  const isEmpty = !isLoading && totalOrders === 0 && debouncedQuery !== "";
  const showEmptyState =
    !isLoading && totalOrders === 0 && debouncedQuery === "";

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const clearSearch = () => {
    setSearchText("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const getStatusBadge = (status: number) => {
    const statusColor = supplyOrderStatusTextColor[status] || "#6b7280";
    const statusText = supplyOrderStatus[status] || "Unknown";

    return (
      <Badge
        style={{ backgroundColor: statusColor }}
        className="text-white border-0 text-[10px] px-2 py-0.5 whitespace-nowrap"
      >
        {statusText}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full space-y-3 p-3 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="border rounded-lg p-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <Skeleton className="h-7 w-20" />
          </div>
        </div>
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="p-2 border-b">
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="p-2 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="border rounded-lg p-6 text-center bg-white max-w-md mx-auto">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Failed to load orders
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {error.message || "An error occurred"}
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-3 p-3 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header - Compact */}
      <div className="border rounded-lg bg-white">
        <div className="p-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-gray-800">Supply Orders</h2>
              <p className="text-xs text-gray-500">Manage purchase requests</p>
            </div>
            <Button
              onClick={() => setOnOpen(1)}
              size="sm"
              className="gap-1 h-8 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              New Order
            </Button>
          </div>
        </div>
      </div>

      {/* Search Section - Compact */}
      <div className="border rounded-lg bg-white sticky top-0 z-20">
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              ref={searchInputRef}
              placeholder="Search by reference, subject, or status..."
              value={searchText}
              onChange={handleSearchChange}
              className="pl-8 pr-7 h-8 text-xs"
            />
            {searchText && (
              <button
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {debouncedQuery && (
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-gray-500">
                {isEmpty
                  ? "No orders found"
                  : `Found ${totalOrders} order${totalOrders !== 1 ? "s" : ""}`}
              </span>
              {isFetching && (
                <div className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span className="text-gray-500">Searching...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Orders Table - Compact with horizontal scroll */}
      <div className="flex-1 overflow-auto">
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="overflow-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-12 p-2 text-xs font-semibold">
                      #
                    </TableHead>
                    <TableHead className="p-2 text-xs font-semibold min-w-[100px]">
                      Ref. No
                    </TableHead>
                    <TableHead className="p-2 text-xs font-semibold min-w-[160px]">
                      Subject
                    </TableHead>
                    <TableHead className="p-2 text-xs font-semibold text-center w-20">
                      Items
                    </TableHead>
                    <TableHead className="p-2 text-xs font-semibold min-w-[100px]">
                      Date Ordered
                    </TableHead>
                    <TableHead className="p-2 text-xs font-semibold min-w-[100px]">
                      Date Completed
                    </TableHead>
                    <TableHead className="p-2 text-xs font-semibold min-w-[80px]">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showEmptyState ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="h-10 w-10 text-gray-300 mb-2" />
                          <p className="text-sm font-medium text-gray-700">
                            No orders yet
                          </p>
                          <p className="text-xs text-gray-500">
                            Create your first order to get started
                          </p>
                          <Button
                            onClick={() => setOnOpen(1)}
                            variant="outline"
                            size="sm"
                            className="mt-3"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            New Order
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isEmpty ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Search className="h-10 w-10 text-gray-300 mb-2" />
                          <p className="text-sm font-medium text-gray-700">
                            No orders found
                          </p>
                          <p className="text-xs text-gray-500">
                            Try a different search term
                          </p>
                          <Button
                            onClick={clearSearch}
                            variant="outline"
                            size="sm"
                            className="mt-3"
                          >
                            Clear Search
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {allOrders.map((order, i) => (
                        <TableRow
                          key={order.id}
                          onClick={() => nav(`order/${order.id}`)}
                          className="group cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="p-2 text-xs font-medium">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs">
                              {i + 1}
                            </div>
                          </TableCell>
                          <TableCell className="p-2">
                            <code className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                              {order.refNumber || "N/A"}
                            </code>
                          </TableCell>
                          <TableCell className="p-2">
                            <p className="text-xs font-medium text-gray-800 truncate max-w-[200px]">
                              {order.title || "Untitled Order"}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">
                              ID: {order.id.slice(0, 6)}...
                            </p>
                          </TableCell>
                          <TableCell className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Package className="h-3 w-3 text-gray-400" />
                              <span className="text-xs font-medium">
                                {order._count?.order || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="p-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-600 whitespace-nowrap">
                                {formatDate(order.timestamp)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="p-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-600 whitespace-nowrap">
                                {formatPureDate(order.approvedAt)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="p-2">
                            {getStatusBadge(order.status)}
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Infinite Scroll Loader */}
                      {isFetchingNextPage && (
                        <TableRow>
                          <TableCell colSpan={7} className="p-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              <span className="text-xs text-gray-500">
                                Loading more orders...
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Infinite Scroll Trigger */}
                      {hasNextPage && !isFetchingNextPage && (
                        <TableRow ref={ref}>
                          <TableCell colSpan={7} className="p-2">
                            <div className="h-2" />
                          </TableCell>
                        </TableRow>
                      )}

                      {/* End of Results */}
                      {!hasNextPage && totalOrders > 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="p-2 border-t">
                            <div className="text-center">
                              <p className="text-xs text-gray-400">
                                Showing all {totalOrders} order
                                {totalOrders !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* New Order Modal - Compact */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Plus className="h-3.5 w-3.5" />
            <span className="text-sm font-semibold">Create New Order</span>
          </div>
        }
        children={
          <div className="space-y-3 p-1">
            <Form {...form}>
              <FormField
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">
                      Order Subject (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Office Supplies"
                        {...field}
                        autoFocus
                        className="h-8 text-sm"
                      />
                    </FormControl>
                    <p className="text-[10px] text-gray-500 mt-1">
                      A descriptive title helps identify this order
                    </p>
                    {errors.title && (
                      <FormMessage className="text-[10px]">
                        {errors.title.message}
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />
            </Form>

            <div className="bg-gray-50 rounded-md p-2">
              <p className="text-[10px] font-medium text-gray-700 mb-1">
                Order Information
              </p>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <span className="text-gray-500">List:</span>
                <span className="font-mono">{listId?.slice(0, 8)}...</span>
                <span className="text-gray-500">Line:</span>
                <span className="font-mono">{lineId?.slice(0, 8)}...</span>
              </div>
            </div>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md w-[90vw]"
        setOnOpen={() => setOnOpen(0)}
        footer={true}
        onFunction={handleSubmit(onSubmit)}
        loading={isSubmitting}
        yesTitle="Create Order"
      />
    </div>
  );
};

export default OrderList;
