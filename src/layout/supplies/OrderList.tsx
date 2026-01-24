import { useEffect } from "react";
import { useAuth } from "@/provider/ProtectedRoute";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import Modal from "@/components/custom/Modal";
import { formatDate } from "@/utils/date";
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
        }
      );

      if (response.status !== 200) {
        throw new Error(response.data.message);
      }
      await queryClient.invalidateQueries({
        queryKey: ["orders", containerId, listId],
        refetchType: "active",
      });
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
        listId as string
      ),
    queryKey: ["orders", listId],
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });
  console.log({ error });

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
        className="text-white border-0 text-xs px-2 py-1"
      >
        {statusText}
      </Badge>
    );
  };

  if (isLoading) {
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

  if (error) {
    return (
      <Card className="h-full border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Failed to load orders
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            {error.message || "An error occurred while loading orders"}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Header Card */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Supply Orders
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage purchase requests and track order status
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => setOnOpen(1)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Order
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Stats Card */}
      <Card className="border">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search by reference, subject, or status..."
                value={searchText}
                onChange={handleSearchChange}
                className="pl-9 pr-8"
              />
              {searchText && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              )}
            </div>

            {debouncedQuery && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {isEmpty
                    ? "No orders found"
                    : `Found ${totalOrders} order${
                        totalOrders !== 1 ? "s" : ""
                      }`}
                </span>
                {isFetching && (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span className="text-muted-foreground">Searching...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table Card */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <div className="h-full overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
                <TableRow>
                  <TableHead className="w-12 p-4">#</TableHead>
                  <TableHead className="p-4 min-w-32">Ref. No</TableHead>
                  <TableHead className="p-4 min-w-48">Subject</TableHead>
                  <TableHead className="p-4 min-w-24 text-center">
                    Items
                  </TableHead>
                  <TableHead className="p-4 min-w-32">Date Ordered</TableHead>
                  <TableHead className="p-4 min-w-32">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showEmptyState ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64">
                      <div className="flex flex-col items-center justify-center text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground font-medium">
                          No orders yet
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Create your first order to get started
                        </p>
                        <Button
                          onClick={() => setOnOpen(1)}
                          className="mt-4 gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Create New Order
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isEmpty ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64">
                      <div className="flex flex-col items-center justify-center text-center py-8">
                        <Search className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground font-medium">
                          No orders found for "{debouncedQuery}"
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Try a different search term
                        </p>
                        <Button
                          onClick={clearSearch}
                          variant="outline"
                          size="sm"
                          className="mt-4"
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
                        className="group cursor-pointer hover:bg-accent/50 transition-colors"
                      >
                        <TableCell className="p-4 font-medium">
                          {i + 1}
                        </TableCell>
                        <TableCell className="p-4">
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {order.refNumber || "N/A"}
                          </code>
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {order.title || "Untitled Order"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              ID: {order.id.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {order._count?.order || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDate(order.timestamp)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="p-4">
                          {getStatusBadge(order.status)}
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Infinite Scroll Loader */}
                    {isFetchingNextPage && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">
                              Loading more orders...
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Infinite Scroll Trigger */}
                    {hasNextPage && !isFetchingNextPage && (
                      <TableRow ref={ref}>
                        <TableCell colSpan={6} className="p-4">
                          <div className="h-4" />
                        </TableCell>
                      </TableRow>
                    )}

                    {/* End of Results */}
                    {!hasNextPage && totalOrders > 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-4 border-t">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">
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
        </CardContent>
      </Card>

      {/* New Order Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <Plus className="h-5 w-5" />
            Create New Order
          </div>
        }
        children={
          <div className="space-y-4">
            <Form {...form}>
              <FormField
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Order Subject (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Office Supplies Q4 2024"
                        {...field}
                        autoFocus
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      A descriptive title helps identify this order later
                    </p>
                    {errors.title && (
                      <FormMessage>{errors.title.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />
            </Form>

            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Order Information</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">List:</span>
                <span className="font-medium truncate">
                  {listId?.slice(0, 8)}...
                </span>
                <span className="text-muted-foreground">Line:</span>
                <span className="font-medium truncate">
                  {lineId?.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md"
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
