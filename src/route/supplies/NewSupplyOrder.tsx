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
import { Skeleton } from "@/components/ui/skeleton";
import OrderProgress from "@/layout/supplies/OrderProgress";
import AddSupplyOrder from "@/layout/supplies/AddSupplyOrder";
import ConfirmDelete from "@/layout/ConfirmDelete";
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
        orderId as string,
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
        containerId as string,
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
        1,
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
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
        <div className="p-3 space-y-3">
          <div className="border rounded-lg p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-2.5 w-24" />
              </div>
              <Skeleton className="h-7 w-24" />
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-20" />
              ))}
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
      </div>
    );
  }

  // Error state
  if (orderError || itemsError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="border rounded-lg p-6 text-center bg-white max-w-md mx-auto">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-red-500" />
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
  if (!orderData || !data) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="border rounded-lg p-6 text-center bg-white max-w-md mx-auto">
          <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            No order found
          </h3>
          <p className="text-sm text-gray-500">
            The order doesn't exist or has been removed.
          </p>
        </div>
      </div>
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
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-3 space-y-3">
        {/* Header Card - Compact */}
        <div className="border rounded-lg bg-white">
          <div className="p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1.5">
                <div className="flex items-center flex-wrap gap-2">
                  <div className="p-1 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md">
                    <ShoppingCart className="h-3.5 w-3.5 text-white" />
                  </div>
                  <h1 className="text-base font-bold text-gray-900 truncate max-w-[180px] sm:max-w-none">
                    {orderData.order.title || "Untitled Order"}
                  </h1>
                  <Badge
                    style={{ backgroundColor: statusColor }}
                    className="text-white border-0 text-[10px] px-2 py-0.5"
                  >
                    {statusText}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <code className="text-[10px] font-mono">
                      {orderData.order.refNumber || "N/A"}
                    </code>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShoppingCart className="h-3 w-3" />
                    <span>
                      {totalItems} item{totalItems !== 1 ? "s" : ""}
                    </span>
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
                    size="sm"
                    className="gap-1 h-8 text-xs"
                  >
                    <PlusCircle className="h-3 w-3" />
                    <span className="hidden xs:inline">Add Items</span>
                    <span className="xs:hidden">Add</span>
                    <kbd className="hidden lg:inline ml-2 text-[10px] px-1 py-0.5 rounded border">
                      Ctrl+A
                    </kbd>
                  </Button>
                )}

                <DropdownMenu
                  open={dropdownOpen}
                  onOpenChange={setDropdownOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <EllipsisVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {isEditable ? (
                      <DropdownMenuItem
                        disabled={orderData.order.status === 2}
                        onClick={() => handleDropdownAction(3)}
                      >
                        <Send className="h-3.5 w-3.5 mr-2" />
                        <span className="text-xs">Submit for Review</span>
                        <kbd className="hidden sm:inline ml-auto text-[10px]">
                          Ctrl+S
                        </kbd>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem disabled>
                        <BadgeCheck className="h-3.5 w-3.5 mr-2" />
                        <span className="text-xs">Already Submitted</span>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      disabled={orderData.order.status < 1}
                      onClick={() => {
                        setDropdownOpen(false);
                        nav(`completion`);
                      }}
                    >
                      <Inbox className="h-3.5 w-3.5 mr-2" />
                      <span className="text-xs">View Fulfillment</span>
                      <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => handleDropdownAction(5)}>
                      <Info className="h-3.5 w-3.5 mr-2" />
                      <span className="text-xs">View Progress</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => handleDropdownAction(2)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      <span className="text-xs">Delete Order</span>
                      <kbd className="hidden sm:inline ml-auto text-[10px]">
                        Ctrl+C
                      </kbd>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table - Compact */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="overflow-auto">
            <div className="min-w-[600px]">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-10 p-2 text-xs">#</TableHead>
                    <TableHead className="p-2 text-xs min-w-[120px]">
                      Item
                    </TableHead>
                    <TableHead className="p-2 text-xs min-w-[180px]">
                      Description
                    </TableHead>
                    <TableHead className="p-2 text-xs text-right w-24">
                      Quantity
                    </TableHead>
                    <TableHead className="p-2 text-xs w-24">Status</TableHead>
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
                      <TableCell colSpan={5} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <ShoppingCart className="h-8 w-8 text-gray-300" />
                          <p className="text-sm text-gray-500">
                            No items in this order yet
                          </p>
                          {isEditable && (
                            <Button
                              onClick={() => setOnOpen(1)}
                              variant="outline"
                              size="sm"
                              className="mt-1 text-xs"
                            >
                              <PlusCircle className="h-3 w-3 mr-1" />
                              Add Items
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {isFetchingNextPage && (
                    <TableRow>
                      <TableCell colSpan={5} className="p-2 text-center">
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

          {/* Footer Stats */}
          {allItems.length > 0 && (
            <div className="border-t p-2 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  Showing {allItems.length} item
                  {allItems.length !== 1 ? "s" : ""}
                </span>
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

      {/* Modals */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ListPlus className="h-4 w-4" />
            <span className="text-sm">Add Items to Order</span>
          </div>
        }
        children={<AddSupplyOrder />}
        onOpen={onOpen === 1}
        className="lg:min-w-4xl w-[95vw] max-h-[90vh] overflow-auto"
        setOnOpen={() => setOnOpen(0)}
        cancelTitle="Close"
      />

      <Modal
        title="Delete Order"
        children={
          <ConfirmDelete
            confirmation="confirm"
            setOnOpen={setOnOpen}
            onFunction={() => deleteOrderMutation.mutateAsync()}
            isLoading={deleteOrderMutation.isPending}
          />
        }
        loading={deleteOrderMutation.isPending}
        onOpen={onOpen === 2}
        className="max-w-md w-[90vw]"
        setOnOpen={() => setOnOpen(0)}
        footer={1}
      />

      <Modal
        title={
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <span className="text-sm">Submit for Review</span>
          </div>
        }
        children={
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Are you ready to submit this purchase request for review?
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-xs font-medium text-amber-800">
                ⚠️ Important: After submission
              </p>
              <ul className="text-xs text-amber-700 mt-1 space-y-0.5 list-disc pl-4">
                <li>You cannot add or remove items</li>
                <li>Item quantities cannot be changed</li>
                <li>Order details become read-only</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-xs font-medium mb-1">Order Summary</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="text-gray-500">Items:</span>
                <span className="font-medium">{totalItems}</span>
                <span className="text-gray-500">Status:</span>
                <Badge variant="outline" className="text-xs w-fit">
                  Will be: {supplyOrderStatus[1]}
                </Badge>
              </div>
            </div>
          </div>
        }
        loading={handleSaveOrder.isPending}
        onOpen={onOpen === 3}
        className="max-w-md w-[90vw]"
        setOnOpen={() => setOnOpen(0)}
        footer={true}
        onFunction={() => handleSaveOrder.mutateAsync()}
        yesTitle="Submit for Review"
      />

      <Modal
        title={
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span className="text-sm">Order Progress</span>
          </div>
        }
        children={<OrderProgress status={orderData.order.status} />}
        onOpen={onOpen === 5}
        className="max-w-lg w-[90vw] max-h-[85vh] overflow-auto"
        setOnOpen={() => setOnOpen(0)}
        cancelTitle="Close"
      />
    </div>
  );
};

export default NewSupplyOrder;
