import { useState, useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminAuth } from "@/provider/AdminRouter";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";

//
import { getAllLines } from "@/db/statements/line";
//
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHead,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import Modal from "@/components/custom/Modal";
import NewLineForm from "@/layout/admin/NewLineForm";
import LineItem from "@/layout/admin/items/LineItem";

//

//
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Server,
  Users,
  Calendar,
} from "lucide-react";

import type { LineProps } from "@/interface/data";

interface ListProps {
  list: LineProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

const Lines = () => {
  const [onOpen, setOpen] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [query] = useDebounce(searchQuery, 1000);
  const { ref, inView } = useInView();
  const auth = useAdminAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isFetchingNextPage,
    isFetching,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["line-list"],
    queryFn: ({ pageParam }) =>
      getAllLines(
        auth.token as string,
        pageParam as string | null,
        "20",
        query,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!auth.token,
  });
  console.log({ data });

  // Load more when scroll to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allLines = data?.pages.flatMap((page) => page.list) || [];
  const totalLines = allLines.length;

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["line-list"] });
    await refetch();
  };

  useEffect(() => {
    refetch();
  }, [query, refetch]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Lines Management
              </h1>
              <p className="text-gray-600">
                Manage all system lines and their configurations
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setOpen(1)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Line
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search lines by name, location, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Lines</p>
                <p className="text-2xl font-bold text-gray-900">{totalLines}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Server className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Lines</p>
                {/* <p className="text-2xl font-bold text-gray-900">
                  {allLines.filter(line => line.status === 1).length}
                </p> */}
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inactive</p>
                {/* <p className="text-2xl font-bold text-gray-900">
                  {allLines.filter(line => line.status === 0).length}
                </p> */}
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <Server className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-lg font-bold text-gray-900">
                  {/* {allLines.length > 0 
                    ? moment(allLines[0].timestamp).fromNow()
                    : 'N/A'
                  } */}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lines Table */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            All Lines
            <Badge variant="outline" className="ml-2">
              {totalLines}
            </Badge>
          </CardTitle>
          <CardDescription>
            List of all system lines with their status and details
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Line Name</TableHead>
                  <TableHead className="font-semibold">Location</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="font-semibold">Users</TableHead>
                  <TableHead className="font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFetching && allLines.length === 0 ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={6}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : allLines.length > 0 ? (
                  // Lines data
                  allLines.map((line) => {
                    return (
                      <LineItem
                        item={line}
                        key={line.id}
                        query={query}
                        token={auth.token as string}
                        userId={auth.userId as string}
                      />
                    );
                  })
                ) : (
                  // Empty state
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="text-center py-12">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Server className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-900 font-medium">
                          No lines found
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                          {searchQuery
                            ? "Try a different search term"
                            : "Create your first line to get started"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Infinite Scroll Loader */}
          {hasNextPage && (
            <div ref={ref} className="p-4 border-t border-gray-200">
              <div className="flex justify-center">
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Spinner className="w-4 h-4" />
                    <span className="text-sm">Loading more lines...</span>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchNextPage()}
                    className="text-sm"
                  >
                    Load more lines
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* End of list */}
          {!hasNextPage && allLines.length > 0 && (
            <div className="p-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                You've reached the end of the list ({allLines.length} lines
                total)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Line Modal */}
      <Modal
        title={undefined}
        children={<NewLineForm setOpen={setOpen} />}
        onOpen={onOpen === 1}
        className="min-w-2xl max-w-2xl overflow-auto"
        setOnOpen={() => setOpen(0)}
        footer={1}
      />
    </div>
  );
};

export default Lines;
