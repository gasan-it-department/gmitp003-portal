import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
//libs & hooks
import { useInfiniteQuery } from "@tanstack/react-query";
//
import {
  Table,
  TableBody,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import EmployeeItem from "./item/EmployeeItem";
import SWWItem from "../item/SWWItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
//statements
import { employeeList } from "@/db/statement";
import type { User, ProtectedRouteProps } from "@/interface/data";
//interfaces and Props
interface Props {
  office: string;
  page: string;
  year: string;
  sgFrom: string;
  sgTo: string;
  query: string;
  lineId?: string;
  auth: ProtectedRouteProps;
}

interface ListProps {
  list: User[];
  lastCursor: string | null;
  hasMore: boolean;
}

const EmployeeList = ({
  office,
  year,
  sgFrom,
  sgTo,
  query,
  lineId,
  auth,
}: Props) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "50px",
  });

  const {
    data,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    hasNextPage,
    isFetching,
    isError,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["employeeList", lineId, query, office, sgFrom, sgTo],
    queryFn: ({ pageParam }) =>
      employeeList(
        auth?.token as string,
        lineId as string,
        pageParam as string | null,
        "20",
        query,
        office,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
  });

  useEffect(() => {
    refetch();
  }, [query, office, sgFrom, sgTo, year, refetch]);

  // Trigger fetch when inView and has more pages
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Get all items from all pages
  const allEmployees = data?.pages.flatMap((page) => page.list) || [];
  const totalItems = allEmployees.length;
  const isLoading =
    isFetching && !isFetchingNextPage && allEmployees.length === 0;

  console.log({ data });

  return (
    <div className="relative w-full h-full overflow-auto bg-white">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="text-sm font-medium text-gray-700">
              Loading employees...
            </p>
          </div>
        </div>
      )}

      {/* Table with medium spacing */}
      <div className="min-w-full">
        <Table className="w-full">
          <TableHeader className="bg-gray-50 border-b sticky top-0 z-10">
            <TableRow>
              <TableHead className="py-3.5 font-semibold text-gray-700">
                No.
              </TableHead>
              <TableHead className="py-3.5 font-semibold text-gray-700">
                Lastname
              </TableHead>
              <TableHead className="py-3.5 font-semibold text-gray-700">
                Firstname
              </TableHead>
              <TableHead className="py-3.5 font-semibold text-gray-700">
                Middle name
              </TableHead>
              <TableHead className="py-3.5 font-semibold text-gray-700">
                Username
              </TableHead>
              <TableHead className="py-3.5 font-semibold text-gray-700">
                Unit
              </TableHead>
              <TableHead className="py-3.5 font-semibold text-gray-700">
                Pos./Designation
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100">
            {isLoading ? (
              // Skeleton loading
              Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={index} className="hover:bg-gray-50/50">
                  <TableCell className="py-3">
                    <Skeleton className="h-4 w-6" />
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : allEmployees.length > 0 ? (
              <>
                {allEmployees.map((item, i) => (
                  <EmployeeItem
                    key={`${item.id}-${i}`}
                    item={item}
                    no={i + 1}
                    query={query}
                    token={auth.token as string}
                    userId={auth.userId as string}
                  />
                ))}

                {/* Infinite scroll loading indicator */}
                {isFetchingNextPage && (
                  <TableRow ref={ref}>
                    <TableCell colSpan={5} className="py-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                        <span className="text-sm text-gray-600">
                          Loading more employees...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Intersection observer trigger */}
                {!isFetchingNextPage && hasNextPage && (
                  <TableRow ref={ref}>
                    <TableCell colSpan={5} className="py-2">
                      <div className="h-1"></div>
                    </TableCell>
                  </TableRow>
                )}

                {/* End of list message */}
                {!hasNextPage && totalItems > 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-4 bg-gray-50">
                      <div className="flex items-center justify-between px-2">
                        <div className="text-sm text-gray-600">
                          Showing{" "}
                          <span className="font-semibold">{totalItems}</span>{" "}
                          employee{totalItems !== 1 ? "s" : ""}
                        </div>
                        <Badge
                          variant="outline"
                          className="font-normal text-xs"
                        >
                          End of list
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8">
                  <SWWItem colSpan={5} />
                </TableCell>
              </TableRow>
            ) : (
              // Empty state
              <TableRow>
                <TableCell colSpan={5} className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No employees found
                    </h3>
                    <p className="text-gray-600 text-sm max-w-md">
                      {query ||
                      office !== "all" ||
                      sgFrom !== "0" ||
                      sgTo !== "0"
                        ? "No employees match your current filters. Try adjusting your search criteria."
                        : "No employees are currently registered in the system."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary Footer */}
      {!isLoading && totalItems > 0 && (
        <div className="sticky bottom-0 left-0 right-0 border-t bg-white px-4 py-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>Total: {totalItems}</span>
              {(query || office !== "all") && (
                <span className="text-gray-500">
                  {query && `Search: "${query}"`}
                  {query && office !== "all" && " • "}
                  {office !== "all" && `Office: ${office}`}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {hasNextPage ? "Scroll to load more" : "All employees loaded"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
