import { useEffect, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import { useSearchParams } from "react-router";

import { roomDocumentRequest } from "@/db/statements/document";
//
import {
  Table,
  TableBody,
  TableHeader,
  TableHead,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import RoomRequestItem from "../item/RoomRequestItem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
//
import {
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
//
import type { RoomRegistration } from "@/interface/data";

interface Props {
  token: string;
  userId: string;
  lineId: string;
}

interface ListProps {
  list: RoomRegistration[];
  hasMore: boolean;
  lastCursor: string | null;
}

const Request = ({ token, userId, lineId }: Props) => {
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);

  const [params, setParams] = useSearchParams({ status: "all" });

  const queryClient = useQueryClient();

  const currentStatus = params.get("status") || "all";

  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery<ListProps>({
    queryFn: ({ pageParam }) =>
      roomDocumentRequest(
        token,
        lineId,
        pageParam as string | null,
        "20",
        query,
        currentStatus,
      ),
    queryKey: ["room-request", lineId],
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  // Infinite scroll observer
  const { ref, inView } = useInView({
    threshold: 0,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    refetch();
  }, [query, currentStatus]);

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      { replace: true },
    );
  };

  // Get status badge based on status

  // Format date

  // Calculate total items
  const allItems = data?.pages.flatMap((page) => page.list) || [];
  const totalItems = allItems.length;

  // Get stats
  const stats = {
    pending: allItems.filter((item) => item.status === 0).length,
    approved: allItems.filter((item) => item.status === 1).length,
    rejected: allItems.filter((item) => item.status === 2).length,
  };

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Room Requests</h1>
            <p className="text-gray-500 text-sm">
              Manage and review room registration requests
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Filter Section */}
      <Card className="mb-6 border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex-1">
              <InputGroup>
                <InputGroupAddon>
                  <Search className="w-4 h-4 text-gray-500" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Search by address, user name, or ID..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="pl-10"
                />
              </InputGroup>
            </div>
            <div className="">
              <Select
                defaultValue={currentStatus}
                onValueChange={(e) => handleChangeParams("status", e)}
              >
                <SelectTrigger defaultValue={currentStatus}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {["Pending", "Approved", "Rejected"].map((stat, index) => (
                    <SelectItem value={index.toString()}>{stat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="flex-1 overflow-hidden border shadow-sm">
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="w-[180px]">Request ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Line</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Loading State */}
              {isFetching && !allItems.length ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : allItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                      <FileText className="w-12 h-12" />
                      <p>No room requests found</p>
                      {query && (
                        <p className="text-sm">
                          No results for "{query}". Try a different search term.
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {/* Data Rows */}
                  {allItems.map((item) => (
                    <RoomRequestItem
                      key={item.id}
                      item={item}
                      token={token}
                      lineId={lineId}
                      userId={userId}
                      queryClient={queryClient}
                    />
                  ))}

                  {/* Loading More Rows */}
                  {isFetchingNextPage && (
                    <TableRow>
                      <TableCell colSpan={8} className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-2 w-2 bg-gray-300 rounded-full animate-pulse"></div>
                          <div
                            className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <div
                            className="h-2 w-2 bg-gray-500 rounded-full animate-pulse"
                            style={{ animationDelay: "0.4s" }}
                          ></div>
                          <span className="text-sm text-gray-500 ml-2">
                            Loading more requests...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Infinite Scroll Trigger */}
                  {hasNextPage && (
                    <TableRow ref={ref}>
                      <TableCell colSpan={8} className="p-4 text-center">
                        <div className="invisible h-1" />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer Stats */}
        <div className="border-t px-6 py-3 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Showing {totalItems} request{totalItems !== 1 ? "s" : ""}
            </span>
            {query && <span>Search: "{query}"</span>}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Request;
