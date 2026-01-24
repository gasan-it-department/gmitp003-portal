import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useState, useEffect } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import hotkeys from "hotkeys-js";

// Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import OrderITem from "@/layout/supplies/items/OrderITem";
import Modal from "@/components/custom/Modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import OrderProgress from "@/layout/supplies/OrderProgress";
import AddSupplyOrder from "@/layout/supplies/AddSupplyOrder";

// Icons
import {
  BadgeCheck,
  EllipsisVertical,
  Inbox,
  Info,
  ListPlus,
  PlusCircle,
  Send,
  Trash2,
  AlertTriangle,
  ShoppingCart,
  FileText,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

// API & Types
import {
  getorderData,
  getOrderItems,
  deleteOrder,
  saveOrder,
} from "@/db/statement";
import type { SupplyBatchOrder, SupplyOrder } from "@/interface/data";
import { supplyOrderStatus, supplyOrderStatusTextColor } from "@/utils/helper";

interface Props {
  lastCursor: string | null;
  hasMore: boolean;
  list: SupplyOrder[];
  order: SupplyBatchOrder;
}

const NewSupplyOrder = () => {
  const { orderId, containerId, listId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const [onOpen, setOnOpen] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch order data
  const {
    data: orderData,
    isLoading: isLoadingOrder,
    error: orderError,
  } = useQuery<{ order: SupplyBatchOrder }>({
    queryKey: ["orderData", orderId],
    queryFn: () => getorderData(auth.token as string, orderId as string),
    enabled: !!orderId && !!auth.token,
  });

  // Fetch order items
  const {
    data,
    isLoading: isLoadingItems,
    isFetching,
    isFetchingNextPage,
    refetch,
    error: itemsError,
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

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: () =>
      deleteOrder(
        auth.token as string,
        orderId as string,
        auth.userId as string,
        containerId as string
      ),
    onError: (err) => {
      toast.error("Failed to delete order", {
        description: err.message,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["orders", containerId, listId],
      });
      toast.success("Order deleted successfully");
      nav(-1);
    },
  });

  // Save/submit order mutation
  const handleSaveOrder = useMutation({
    mutationFn: () =>
      saveOrder(
        auth.token as string,
        orderData?.order.id as string,
        auth.userId as string,
        containerId as string,
        1
      ),
    onError: (err) => {
      toast.error("Failed to submit order", {
        description: err.message,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["orderData", orderId],
      });
      toast.success("Order submitted successfully");
      setOnOpen(0);
    },
  });

  // Hotkeys setup
  useEffect(() => {
    hotkeys("ctrl+a", (event) => {
      event.preventDefault();
      if (orderData?.order.status === 1) {
        toast.warning("Cannot add items", {
          description: "This order has already been submitted for review.",
        });
        return;
      }
      setOnOpen(onOpen === 1 ? 0 : 1);
    });

    hotkeys("ctrl+s", (event) => {
      event.preventDefault();
      if (orderData?.order.status === 1) {
        toast.warning("Order already submitted", {
          description: "This order is already in review.",
        });
        return;
      }
      setOnOpen(onOpen === 3 ? 0 : 3);
    });

    hotkeys("ctrl+c", (event) => {
      event.preventDefault();
      setOnOpen(onOpen === 2 ? 0 : 2);
    });

    return () => {
      hotkeys.unbind("ctrl+a");
      hotkeys.unbind("ctrl+s");
      hotkeys.unbind("ctrl+c");
    };
  }, [onOpen, orderData]);

  // Close dropdown when modal opens
  useEffect(() => {
    if (onOpen !== 0) {
      setDropdownOpen(false);
    }
  }, [onOpen]);

  const allItems = data?.pages.flatMap((page) => page.list) || [];
  const totalItems = allItems.length;
  const isSubmitted = orderData?.order.status === 1;
  const isEditable = !isSubmitted;

  // Loading state
  if (isLoadingOrder || isLoadingItems) {
    return (
      <div className="h-full space-y-4 p-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <div className="flex gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-24" />
                ))}
              </div>
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
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
      <Card className="h-full border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
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
  if (!orderData || !data) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">
            No order found
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            The order you're looking for doesn't exist or has been removed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusText = supplyOrderStatus[orderData.order.status] || "Unknown";
  const statusColor =
    supplyOrderStatusTextColor[orderData.order.status] || "#6b7280";

  // Handler for dropdown menu items that open modals
  const handleDropdownAction = (modalNumber: number) => {
    setDropdownOpen(false);
    setOnOpen(modalNumber);
  };

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Header Card */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight truncate">
                  {orderData.order.title || "Untitled Order"}
                </h1>
                <Badge
                  style={{ backgroundColor: statusColor }}
                  className="text-white border-0"
                >
                  {statusText}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {orderData.order.refNumber || "N/A"}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>
                    {totalItems} item{totalItems !== 1 ? "s" : ""}
                  </span>
                </div>
                {orderData.order.timestamp && (
                  <div className="flex items-center gap-2">
                    <span>Created:</span>
                    <span className="font-medium">
                      {new Date(orderData.order.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {isEditable && (
                <Button
                  disabled={orderData.order.status === 2}
                  onClick={() => {
                    if (orderData.order.status === 2) return;
                    setOnOpen(1);
                  }}
                  className="gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Items
                  <kbd className="ml-2 text-xs bg-background px-1.5 py-0.5 rounded border">
                    Ctrl+A
                  </kbd>
                </Button>
              )}

              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <EllipsisVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Order Actions
                  </div>

                  {isEditable ? (
                    <DropdownMenuItem
                      disabled={orderData.order.status === 2}
                      onClick={() => handleDropdownAction(3)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit for Review
                      <kbd className="ml-auto text-xs">Ctrl+S</kbd>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem disabled>
                      <BadgeCheck className="h-4 w-4 mr-2" />
                      Already Submitted
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    disabled={orderData.order.status < 1}
                    onClick={() => {
                      setDropdownOpen(false);
                      nav(`completion`);
                    }}
                  >
                    <Inbox className="h-4 w-4 mr-2" />
                    View Fulfillment
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => handleDropdownAction(5)}>
                    <Info className="h-4 w-4 mr-2" />
                    View Progress
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => handleDropdownAction(2)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Order
                    <kbd className="ml-auto text-xs">Ctrl+C</kbd>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table Card */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <div className="h-full overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
                <TableRow>
                  <TableHead className="w-12 p-4">#</TableHead>
                  <TableHead className="p-4 min-w-48">Item</TableHead>
                  <TableHead className="p-4 min-w-64">Description</TableHead>
                  <TableHead className="p-4 min-w-32 text-right">
                    Quantity
                  </TableHead>
                  <TableHead className="p-4 min-w-32">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allItems.length > 0 ? (
                  allItems.map((item, i) => (
                    <OrderITem
                      key={item.id}
                      status={orderData.order.status}
                      index={i}
                      item={item}
                      handleRefetch={async () => {
                        refetch();
                      }}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64">
                      <div className="flex flex-col items-center justify-center text-center py-8">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground font-medium">
                          No items in this order yet
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {isEditable
                            ? "Add items to get started"
                            : "This order doesn't contain any items"}
                        </p>
                        {isEditable && (
                          <Button
                            onClick={() => setOnOpen(1)}
                            variant="outline"
                            size="sm"
                            className="mt-4"
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add Items
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {isFetchingNextPage && (
                  <TableRow>
                    <TableCell colSpan={6} className="p-4">
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

            {/* Footer Stats */}
            {allItems.length > 0 && (
              <div className="border-t p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Showing {allItems.length} item
                    {allItems.length !== 1 ? "s" : ""}
                  </span>
                  {isFetching && (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span className="text-muted-foreground">Updating...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <ListPlus className="h-5 w-5" />
            Add Items to Order
          </div>
        }
        children={<AddSupplyOrder />}
        onOpen={onOpen === 1}
        className="min-w-[80%] h-[95vh]"
        setOnOpen={() => setOnOpen(0)}
        cancelTitle="Close"
      />

      <Modal
        title={
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Order
          </div>
        }
        children={
          <div className="space-y-4">
            <p className="text-sm font-medium">
              Are you sure you want to delete this order?
            </p>
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Warning: This action cannot be undone
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc pl-5">
                <li>All items in this order will be permanently deleted</li>
                <li>Order history will be removed</li>
                <li>This action cannot be reversed</li>
              </ul>
            </div>
          </div>
        }
        loading={deleteOrderMutation.isPending}
        onOpen={onOpen === 2}
        className="max-w-md"
        setOnOpen={() => setOnOpen(0)}
        footer={true}
        onFunction={() => deleteOrderMutation.mutateAsync()}
        yesTitle="Delete Order"
      />

      <Modal
        title={
          <div className="flex items-center gap-3">
            <Send className="h-5 w-5 text-primary" />
            Submit for Review
          </div>
        }
        children={
          <div className="space-y-4">
            <p className="text-sm">
              Are you ready to submit this purchase request for review?
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-800">
                ⚠️ Important: After submission
              </p>
              <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc pl-5">
                <li>You cannot add or remove items</li>
                <li>Item quantities cannot be changed</li>
                <li>Order details become read-only</li>
              </ul>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Order Summary</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Items:</span>
                <span className="font-medium">{totalItems}</span>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className="w-fit">
                  Will be: {supplyOrderStatus[1]}
                </Badge>
              </div>
            </div>
          </div>
        }
        loading={handleSaveOrder.isPending}
        onOpen={onOpen === 3}
        className="max-w-md"
        setOnOpen={() => setOnOpen(0)}
        footer={true}
        onFunction={() => handleSaveOrder.mutateAsync()}
        yesTitle="Submit for Review"
      />

      <Modal
        title={
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5" />
            Order Progress
          </div>
        }
        children={
          <div className="w-full">
            <OrderProgress status={orderData.order.status} />
          </div>
        }
        onOpen={onOpen === 5}
        className="min-w-[60%] max-h-[80vh] overflow-auto"
        setOnOpen={() => setOnOpen(0)}
        cancelTitle="Close"
      />
    </div>
  );
};

export default NewSupplyOrder;
