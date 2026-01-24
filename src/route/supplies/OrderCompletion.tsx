import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "@/db/axios";
import { useAuth } from "@/provider/ProtectedRoute";
import { useState, useEffect } from "react";
import { useParams } from "react-router";
import hotkeys from "hotkeys-js";

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
import { AlertCircle, CopyCheck, Save, Package, RefreshCw } from "lucide-react";

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
  const [onMultilSelect, setOnMultiSelect] = useState(false);

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
        orderId as string
      ),
    queryKey: ["order-items", orderId],
    enabled: !!orderId && !!auth.token,
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

  // Setup hotkey
  useEffect(() => {
    hotkeys("ctrl+s", (event) => {
      event.preventDefault();
      setOnMultiSelect((prev) => {
        if (!prev) {
          setSelected([]);
        }
        return !prev;
      });
    });

    return () => {
      hotkeys.unbind("ctrl+s");
    };
  }, []);

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
      }
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

  // Loading state
  if (isLoadingOrder || isLoadingItems) {
    return (
      <Card className="h-full border-0 shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-md" />
              <Skeleton className="h-10 w-10 rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border">
            <div className="p-4 border-b">
              <div className="flex gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-24" />
                ))}
              </div>
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (orderError || itemsError) {
    return (
      <Card className="h-full border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Failed to load order
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            {orderError?.message || itemsError?.message || "An error occurred"}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!data || !orderData) {
    return (
      <Card className="h-full border-0">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">
            No order data found
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            The order you're looking for doesn't exist or has been removed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <Card className="border-b rounded-b-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Order Completion
                </h1>
                {orderData.order?.status && (
                  <Badge variant="outline" className="text-xs">
                    {supplyOrderStatus[orderData.order.status]}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Ref:</span>{" "}
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {orderData.order?.refNumber || "N/A"}
                  </code>
                </div>
                {orderData.order.timestamp && (
                  <div>
                    <span className="font-medium">Date:</span>{" "}
                    {new Date(orderData.order.timestamp).toLocaleDateString()}
                  </div>
                )}
                <div>
                  <span className="font-medium">Items:</span> {totalItems}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onMultilSelect && selectedCount > 0 && (
                <Badge variant="secondary" className="mr-2">
                  {selectedCount} selected
                </Badge>
              )}
              <Button
                size="sm"
                variant={onMultilSelect ? "default" : "outline"}
                onClick={() => setOnMultiSelect(!onMultilSelect)}
                className="gap-2"
              >
                <CopyCheck className="h-4 w-4" />
                {onMultilSelect ? "Cancel Selection" : "Select Multiple"}
                <kbd className="ml-2 text-xs bg-background px-1.5 py-0.5 rounded border">
                  Ctrl+S
                </kbd>
              </Button>
              <Button
                size="sm"
                onClick={() => setOnOpen(1)}
                disabled={
                  (onMultilSelect && selectedCount === 0) ||
                  orderData.order.status === 2
                }
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Order
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Container */}
      <Card className="flex-1 rounded-t-none border-t-0 overflow-hidden">
        <CardContent className="p-0 h-full">
          <div className="h-full overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
                <TableRow>
                  {onMultilSelect && (
                    <TableHead className="w-12 p-3">
                      <span className="sr-only">Select</span>
                    </TableHead>
                  )}
                  <TableHead className="w-12 p-3">#</TableHead>
                  <TableHead className="p-3 min-w-48">Item</TableHead>
                  <TableHead className="p-3 min-w-32">Order Ref.</TableHead>
                  <TableHead className="p-3 min-w-48">Description</TableHead>
                  <TableHead className="p-3 min-w-32 text-right">
                    Ordered Qty
                  </TableHead>
                  <TableHead className="p-3 min-w-32 text-right">
                    Received Qty
                  </TableHead>
                  <TableHead className="p-3 min-w-32">Condition</TableHead>
                  {/* <TableHead className="p-3 min-w-40">Brand/Product</TableHead> */}
                  <TableHead className="p-3 min-w-32 text-right">
                    Price
                  </TableHead>
                  <TableHead className="p-3 min-w-48">Remark</TableHead>
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
                      onMultiSelect={onMultilSelect}
                      lineId={lineId}
                      orderId={orderId}
                      disabled={orderData.order.status === 2}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={onMultilSelect ? 12 : 11}
                      className="h-32"
                    >
                      <div className="flex flex-col items-center justify-center text-center py-8">
                        <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground font-medium">
                          No items found in this order
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          This order doesn't contain any items yet.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Loading more rows */}
                {isFetchingNextPage && (
                  <TableRow>
                    <TableCell
                      colSpan={onMultilSelect ? 12 : 11}
                      className="p-4"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          Loading more items...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Load more trigger */}
            {hasNextPage && !isFetchingNextPage && (
              <div className="p-4 text-center border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextPage()}
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
        <Card className="rounded-t-none border-t-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground">
                Showing {allItems.length} item{allItems.length !== 1 ? "s" : ""}
                {selectedCount > 0 && (
                  <span className="ml-3 text-foreground">
                    • {selectedCount} selected
                  </span>
                )}
              </div>
              {isFetching && (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span className="text-muted-foreground">Updating...</span>
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
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to mark this order as fulfilled?
            </p>

            {selectedCount > 0 && (
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm font-medium mb-2">
                  The following {selectedCount} item
                  {selectedCount !== 1 ? "s" : ""} will be processed:
                </p>
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {selected.map((item) => (
                    <li
                      key={item.id}
                      className="text-sm flex items-center justify-between"
                    >
                      <span className="truncate">
                        {item.brandName || item.refNumber}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Qty: {item.quantity}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedCount === 0 && onMultilSelect && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <p className="text-sm text-amber-800">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  No items selected. All items will be processed.
                </p>
              </div>
            )}
          </div>
        }
        onOpen={onOpen === 1}
        className="min-w-md"
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
