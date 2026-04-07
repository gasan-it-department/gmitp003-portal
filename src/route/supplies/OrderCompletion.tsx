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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Save,
  Package,
  RefreshCw,
  ChevronRight,
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
      toast.success("Save");
    },
    onError: (err) => {
      toast.error("Error", {
        description: err.message,
      });
    },
  });

  console.log({ data });

  // Loading state
  if (isLoadingOrder || isLoadingItems) {
    return (
      <div className="h-full space-y-3 sm:space-y-4 p-2 sm:p-3 md:p-4">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5 sm:space-y-2">
                <Skeleton className="h-6 sm:h-8 w-40 sm:w-64" />
                <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
              </div>
              <Skeleton className="h-8 sm:h-10 w-24 sm:w-32" />
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="p-0">
            <div className="p-2 sm:p-4 border-b">
              <div className="flex flex-wrap gap-2 sm:gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 sm:h-6 w-16 sm:w-24" />
                ))}
              </div>
            </div>
            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 sm:h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (orderError || itemsError) {
    return (
      <Card className="h-full border-destructive/20 bg-destructive/5 m-2 sm:m-3">
        <CardContent className="flex flex-col items-center justify-center py-6 sm:py-12 px-3 sm:px-6">
          <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-destructive mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-destructive mb-1.5 sm:mb-2 text-center">
            Failed to load order
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground text-center mb-3 sm:mb-4">
            {orderError?.message || itemsError?.message || "An error occurred"}
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="gap-1.5 sm:gap-2"
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!data || !orderData) {
    return (
      <Card className="h-full m-2 sm:m-3">
        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-3 sm:px-6">
          <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/50 mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-muted-foreground mb-2 text-center">
            No order data found
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            The order you're looking for doesn't exist or has been removed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-3 sm:space-y-4 p-2 sm:p-3 md:p-4">
      {/* Header */}
      <Card className="border shadow-sm">
        <CardContent className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex flex-col xs:flex-row xs:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                    Order Completion
                  </h1>
                </div>
                {orderData.order?.status && (
                  <Badge variant="outline" className="text-xs sm:text-sm w-fit">
                    {supplyOrderStatus[orderData.order.status]}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-y-2 gap-x-3 sm:gap-x-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-medium hidden xs:inline">Ref:</span>
                  <code className="bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs truncate max-w-[120px] sm:max-w-[200px]">
                    {orderData.order?.refNumber || "N/A"}
                  </code>
                </div>
                {orderData.order.timestamp && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-medium hidden xs:inline">Date:</span>
                    <span className="whitespace-nowrap">
                      {new Date(orderData.order.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-medium">Items:</span>
                  <span>{totalItems}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2 lg:mt-0">
              <Button
                size="sm"
                onClick={() => setOnOpen(1)}
                disabled={orderData.order.status === 2 || isPending}
                className="gap-1.5 sm:gap-2 whitespace-nowrap"
              >
                <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Save Order</span>
                <span className="xs:hidden">Save</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Container */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <div className="relative w-full h-full">
            {/* Mobile scroll indicator */}
            <div className="absolute bottom-2 right-2 z-20 sm:hidden">
              <div className="bg-primary/10 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-primary flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                <span>Swipe to scroll</span>
              </div>
            </div>

            {/* Horizontal scroll container */}
            <div className="w-full h-full overflow-x-auto overflow-y-auto">
              <Table className="min-w-[1000px] lg:min-w-full">
                <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
                  <TableRow>
                    <TableHead className="w-10 sm:w-12 p-2 sm:p-3 text-xs sm:text-sm">
                      #
                    </TableHead>
                    <TableHead className="p-2 sm:p-3 min-w-[120px] sm:min-w-[150px] text-xs sm:text-sm">
                      Item
                    </TableHead>
                    <TableHead className="p-2 sm:p-3 min-w-[100px] sm:min-w-[120px] text-xs sm:text-sm">
                      Order Ref.
                    </TableHead>
                    <TableHead className="p-2 sm:p-3 min-w-[200px] sm:min-w-[250px] text-xs sm:text-sm">
                      Description
                    </TableHead>
                    <TableHead className="p-2 sm:p-3 min-w-[100px] sm:min-w-[120px] text-right text-xs sm:text-sm">
                      Ordered Qty
                    </TableHead>
                    <TableHead className="p-2 sm:p-3 min-w-[100px] sm:min-w-[120px] text-right text-xs sm:text-sm">
                      Received Qty
                    </TableHead>
                    <TableHead className="p-2 sm:p-3 min-w-[100px] sm:min-w-[120px] text-xs sm:text-sm">
                      Condition
                    </TableHead>
                    <TableHead className="p-2 sm:p-3 min-w-[100px] sm:min-w-[120px] text-right text-xs sm:text-sm">
                      Price
                    </TableHead>
                    <TableHead className="p-2 sm:p-3 min-w-[150px] sm:min-w-[200px] text-xs sm:text-sm">
                      Remark
                    </TableHead>
                    <TableHead className="p-2 sm:p-3 min-w-[150px] sm:min-w-[200px] text-xs sm:text-sm">
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
                      <TableCell colSpan={9} className="h-48 sm:h-64">
                        <div className="flex flex-col items-center justify-center text-center py-6 sm:py-8 px-3">
                          <Package className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/30 mb-2 sm:mb-3" />
                          <p className="text-sm sm:text-base text-muted-foreground font-medium">
                            No items found in this order
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            This order doesn't contain any items yet.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Loading more rows */}
                  {isFetchingNextPage && (
                    <TableRow>
                      <TableCell colSpan={9} className="p-3 sm:p-4">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            Loading more items...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Load more trigger */}
            {hasNextPage && !isFetchingNextPage && (
              <div className="p-3 sm:p-4 text-center border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  className="text-xs sm:text-sm"
                >
                  Load More Items
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer Stats */}
      {allItems.length > 0 && (
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-xs sm:text-sm">
              <div className="text-muted-foreground">
                <span>
                  Showing {allItems.length} item
                  {allItems.length !== 1 ? "s" : ""}
                </span>
                {selectedCount > 0 && (
                  <span className="ml-2 sm:ml-3 text-foreground font-medium">
                    • {selectedCount} selected
                  </span>
                )}
              </div>
              {isFetching && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span className="text-muted-foreground whitespace-nowrap">
                    Updating...
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Modal */}
      <Modal
        title="Complete Order"
        children={
          <div className="space-y-3 sm:space-y-4 px-1">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Are you sure you want to mark this order as fulfilled?
            </p>
          </div>
        }
        onOpen={onOpen === 1}
        className="w-[95%] sm:w-[90%] md:w-[60%] lg:w-[50%] max-w-md mx-auto"
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
