import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "@/db/axios";
import { useAuth } from "@/provider/ProtectedRoute";
import { useState } from "react";
import { useParams } from "react-router";

//components and layout
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
import { toast } from "sonner";
import OrderCompletionItem from "@/layout/supplies/items/OrderCompletionItem";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Save,
  Package,
  RefreshCw,
  CheckCircle,
} from "lucide-react";

//db and statement
import { getorderData, getOrderItems } from "@/db/statement";

//props and interface
import type {
  OrderCompletionSelected,
  SupplyBatchOrder,
  SupplyOrder,
} from "@/interface/data";
import { supplyOrderStatus } from "@/utils/helper";

interface Props {
  lastCursor: string | null;
  hasMore: boolean;
  list: SupplyOrder[];
  order: SupplyBatchOrder;
}

const OrderCompletion = () => {
  const { orderId, listId, lineId, containerId } = useParams();
  const [selected, setSelected] = useState<OrderCompletionSelected[]>([]);

  const auth = useAuth();
  const queryClient = useQueryClient();
  const [onOpen, setOnOpen] = useState(0);

  const {
    data: orderData,
    isLoading: isLoadingOrder,
    error: orderError,
  } = useQuery<{ order: SupplyBatchOrder }>({
    queryKey: ["orderData", orderId],
    queryFn: () => getorderData(auth.token as string, orderId as string),
    enabled: !!orderId && !!auth.token,
  });

  const {
    data,
    isLoading: isLoadingItems,
    isFetching,
    isFetchingNextPage,
    error: itemsError,
    refetch,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery<Props>({
    queryFn: ({ pageParam }) =>
      getOrderItems(
        auth.token as string,
        "",
        pageParam as string | null,
        "20",
        orderId as string,
      ),
    queryKey: ["order-items", orderId],
    enabled: !!orderId && !!auth.token,
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const allItems = data?.pages.flatMap((page) => page.list) || [];
  const selectedCount = selected.length;
  const totalItems = allItems.length;

  const handeSave = async () => {
    const response = await axios.patch(
      "/finalize-order",
      {
        userId: auth.userId,
        inventoryBoxId: containerId,
        orderId: orderId,
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
      throw new Error(response.data.message);
    }
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: handeSave,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["orderData", orderId],
        refetchType: "active",
      });
      setOnOpen(0);
      toast.success("Order completed successfully");
    },
    onError: (err) => {
      toast.error("Error", {
        description: err.message,
      });
    },
  });

  // Loading state
  if (isLoadingOrder || isLoadingItems) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
        <div className="p-3 space-y-3">
          <div className="border rounded-lg bg-white p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-2.5 w-24" />
              </div>
              <Skeleton className="h-7 w-24" />
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="p-2 border-b">
              <div className="flex gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-16" />
                ))}
              </div>
            </div>
            <div className="p-2 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (orderError || itemsError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="border rounded-lg p-6 text-center bg-white max-w-md mx-auto">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Failed to load order
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {orderError?.message || itemsError?.message || "An error occurred"}
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

  // No data state
  if (!data || !orderData) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="border rounded-lg p-6 text-center bg-white max-w-md mx-auto">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            No order data found
          </h3>
          <p className="text-sm text-gray-500">
            The order doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-3 space-y-3">
        {/* Header - Compact */}
        <div className="border rounded-lg bg-white">
          <div className="p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1.5">
                <div className="flex items-center flex-wrap gap-2">
                  <div className="p-1 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md">
                    <Package className="h-3.5 w-3.5 text-white" />
                  </div>
                  <h1 className="text-base font-bold text-gray-900">
                    Order Completion
                  </h1>
                  {orderData.order?.status && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0.5"
                    >
                      {supplyOrderStatus[orderData.order.status]}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Ref:</span>
                    <code className="text-[10px] font-mono bg-gray-100 px-1 rounded">
                      {orderData.order?.refNumber || "N/A"}
                    </code>
                  </div>
                  {orderData.order.timestamp && (
                    <div className="flex items-center gap-1">
                      <span>
                        {new Date(
                          orderData.order.timestamp,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span>Items:</span>
                    <span className="font-medium">{totalItems}</span>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <Button
                size="sm"
                onClick={() => setOnOpen(1)}
                disabled={orderData.order.status === 2 || isPending}
                className="gap-1.5 h-8 text-xs"
              >
                <Save className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Save Order</span>
                <span className="xs:hidden">Save</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Table Container - Compact */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="overflow-auto">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-8 p-2 text-xs">#</TableHead>
                    <TableHead className="p-2 text-xs min-w-[120px]">
                      Item
                    </TableHead>
                    <TableHead className="p-2 text-xs min-w-[100px]">
                      Order Ref.
                    </TableHead>
                    <TableHead className="p-2 text-xs min-w-[180px]">
                      Description
                    </TableHead>
                    <TableHead className="p-2 text-xs text-right w-20">
                      Ordered
                    </TableHead>
                    <TableHead className="p-2 text-xs text-right w-20">
                      Received
                    </TableHead>
                    <TableHead className="p-2 text-xs min-w-[100px]">
                      Condition
                    </TableHead>
                    <TableHead className="p-2 text-xs text-right w-20">
                      Price
                    </TableHead>
                    <TableHead className="p-2 text-xs min-w-[120px]">
                      Remark
                    </TableHead>
                    <TableHead className="p-2 text-xs min-w-[100px]">
                      Date Completed
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allItems.length > 0 ? (
                    allItems.map((item, i) => (
                      <OrderCompletionItem
                        listId={listId}
                        auth={auth}
                        key={item.id}
                        item={item}
                        index={i}
                        selected={selected}
                        setSelected={setSelected}
                        lineId={lineId}
                        orderId={orderId}
                        disabled={orderData.order.status === 2}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Package className="h-8 w-8 text-gray-300" />
                          <p className="text-sm text-gray-500">
                            No items found in this order
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {isFetchingNextPage && (
                    <TableRow>
                      <TableCell colSpan={10} className="p-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span className="text-xs text-gray-500">
                            Loading more items...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Load more trigger */}
          {hasNextPage && !isFetchingNextPage && (
            <div className="p-2 border-t text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                className="text-xs h-7"
              >
                Load More Items
              </Button>
            </div>
          )}

          {/* Footer Stats */}
          {allItems.length > 0 && (
            <div className="border-t p-2 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div>
                  <span>
                    {allItems.length} item{allItems.length !== 1 ? "s" : ""}
                  </span>
                  {selectedCount > 0 && (
                    <span className="ml-2 font-medium text-blue-600">
                      • {selectedCount} selected
                    </span>
                  )}
                </div>
                {isFetching && (
                  <div className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Updating...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      <Modal
        title="Complete Order"
        children={
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Are you sure you want to mark this order as fulfilled?
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <p className="text-xs text-blue-700">
                  This will finalize the order and update inventory levels.
                </p>
              </div>
            </div>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md w-[90vw]"
        setOnOpen={() => {
          if (isPending) return;
          setOnOpen(0);
        }}
        footer={true}
        loading={isPending}
        yesTitle="Confirm & Complete"
        onFunction={() => mutateAsync()}
      />
    </div>
  );
};

export default OrderCompletion;
