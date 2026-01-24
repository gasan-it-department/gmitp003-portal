import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useDebounce } from "use-debounce";
import { useInView } from "react-intersection-observer";
//
import { getModuleUsers } from "@/db/statement";
//
import {
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableHeader,
  TableCell,
} from "@/components/ui/table";
import SWWItem from "@/layout/item/SWWItem";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import ModuleUserItem from "./item/ModuleUserItem";
import { Skeleton } from "@/components/ui/skeleton";
//
import { Search, PlusCircle, Users } from "lucide-react";
//
import type { User } from "@/interface/data";
interface ListProps {
  list: User[];
  lastCursor: string | null;
  hasMore: boolean;
}

const ModuleUsers = () => {
  const { moduleId, lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);

  // Add this for infinite scroll trigger
  const { ref, inView } = useInView();

  const {
    data,
    isFetching,
    hasNextPage,
    fetchNextPage,
    refetch,
    isFetchingNextPage,
    error,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["module-users", moduleId, lineId, query],
    queryFn: ({ pageParam }) =>
      getModuleUsers(
        auth.token as string,
        moduleId,
        pageParam as string | null,
        "20",
        query
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

  console.log(error);

  // Add this useEffect to trigger fetchNextPage when inView is true
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    refetch();
  }, [query]);

  // Calculate total users
  const totalUsers =
    data?.pages.reduce((total, page) => total + page.list.length, 0) || 0;

  return (
    <div className="w-full h-full p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 capitalize">
              {moduleId}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {totalUsers} user{totalUsers !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => nav(`add`)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-4">
          <InputGroup className="bg-white border rounded-lg w-full max-w-md">
            <InputGroupAddon className="pl-3">
              <Search className="h-4 w-4 text-gray-500" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search users..."
              onChange={(e) => setText(e.target.value)}
              className="border-0"
            />
          </InputGroup>
        </div>
      </div>

      {/* Table Container */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-800">
              <TableRow className="hover:bg-gray-800">
                <TableHead className="text-white font-medium py-3">
                  No.
                </TableHead>
                <TableHead className="text-white font-medium py-3">
                  Username
                </TableHead>
                <TableHead className="text-white font-medium py-3">
                  Last Name
                </TableHead>
                <TableHead className="text-white font-medium py-3">
                  First Name
                </TableHead>
                <TableHead className="text-white font-medium py-3">
                  Privilege
                </TableHead>
                <TableHead className="text-white font-medium py-3">
                  Status
                </TableHead>
                <TableHead className="text-white font-medium py-3 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100">
              {isFetching && !data ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-gray-50">
                    <TableCell>
                      <Skeleton className="h-6 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-6 w-16 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data ? (
                <>
                  {/* Render the list items */}
                  {data.pages.flatMap((item) => item.list).length > 0 ? (
                    data.pages
                      .flatMap((item) => item.list)
                      .map((item, i) => (
                        <ModuleUserItem
                          key={item.id || i}
                          item={item}
                          no={i}
                          userId={auth.userId as string}
                          token={auth.token as string}
                          lineId={lineId as string}
                          moduleId={moduleId as string}
                          query={query}
                        />
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Users className="h-8 w-8 mb-2 text-gray-300" />
                          <p className="text-sm">
                            {query
                              ? `No results for "${query}"`
                              : "No users found"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Add the infinite scroll trigger row */}
                  {hasNextPage && (
                    <TableRow ref={ref} className="border-t">
                      <TableCell colSpan={6} className="text-center py-4">
                        {isFetchingNextPage ? (
                          <div className="flex items-center justify-center gap-2 text-gray-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm">Loading more...</span>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ) : (
                <SWWItem colSpan={6} />
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Status */}
      {data && data.pages.flatMap((item) => item.list).length > 0 && (
        <div className="mt-3 text-sm text-gray-500">
          Showing {totalUsers} user{totalUsers !== 1 ? "s" : ""}
          {isFetchingNextPage && " • Loading more..."}
        </div>
      )}
    </div>
  );
};

export default ModuleUsers;
