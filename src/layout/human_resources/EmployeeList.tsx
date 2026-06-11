import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";

import {
  Table,
  TableBody,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { Loader2, UserX } from "lucide-react";

import EmployeeItem from "./item/EmployeeItem";
import SWWItem from "../item/SWWItem";

import { employeeList } from "@/db/statement";
import type { User, ProtectedRouteProps } from "@/interface/data";

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

const TABLE_COLS = 7;

const EmployeeList = ({
  office,
  year,
  sgFrom,
  sgTo,
  query,
  lineId,
  auth,
}: Props) => {
  const {
    data,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isError,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["employeeList", lineId, query, office, sgFrom, sgTo, year],
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
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!auth?.token && !!lineId,
    refetchOnWindowFocus: false,
  });

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });

  const employees = data?.pages.flatMap((page) => page.list) ?? [];
  const totalItems = employees.length;
  const isLoading = isFetching && !isFetchingNextPage && totalItems === 0;
  const hasActiveFilter =
    !!query || office !== "all" || sgFrom !== "0" || sgTo !== "0";

  return (
    <div className="w-full h-full flex flex-col border rounded-lg bg-white overflow-hidden">
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-gray-100 sticky top-0 z-10">
            <TableRow className="hover:bg-gray-100 border-b">
              <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-10">
                #
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 min-w-[140px]">
                Last Name
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 min-w-[140px]">
                First Name
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 min-w-[120px]">
                Middle Name
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 min-w-[120px]">
                Username
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 min-w-[140px]">
                Unit
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 min-w-[140px]">
                Position / Designation
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-3 py-2"><Skeleton className="h-3 w-6" /></TableCell>
                  <TableCell className="px-3 py-2"><Skeleton className="h-3 w-28" /></TableCell>
                  <TableCell className="px-3 py-2"><Skeleton className="h-3 w-24" /></TableCell>
                  <TableCell className="px-3 py-2"><Skeleton className="h-3 w-20" /></TableCell>
                  <TableCell className="px-3 py-2"><Skeleton className="h-3 w-20" /></TableCell>
                  <TableCell className="px-3 py-2"><Skeleton className="h-3 w-28" /></TableCell>
                  <TableCell className="px-3 py-2"><Skeleton className="h-3 w-32" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={TABLE_COLS} className="py-8">
                  <SWWItem colSpan={TABLE_COLS} />
                </TableCell>
              </TableRow>
            ) : totalItems > 0 ? (
              <>
                {employees.map((item, i) => (
                  <EmployeeItem
                    key={`${item.id}-${i}`}
                    item={item}
                    no={i + 1}
                    query={query}
                    token={auth.token as string}
                    userId={auth.userId as string}
                  />
                ))}

                {hasNextPage && (
                  <TableRow ref={ref}>
                    <TableCell colSpan={TABLE_COLS} className="h-10 p-0" />
                  </TableRow>
                )}

                {isFetchingNextPage && (
                  <TableRow>
                    <TableCell colSpan={TABLE_COLS} className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-gray-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-[10px]">Loading more...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!hasNextPage && (
                  <TableRow>
                    <TableCell colSpan={TABLE_COLS} className="py-3 border-t bg-gray-50">
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] text-gray-500">
                          Total: <span className="font-semibold text-gray-700">{totalItems}</span> employee{totalItems !== 1 ? "s" : ""}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          End of list
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={TABLE_COLS} className="py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <UserX className="h-5 w-5 text-gray-300" />
                    </div>
                    <p className="text-xs font-medium text-gray-500">
                      No employees found
                    </p>
                    <p className="text-[10px] text-gray-400 text-center max-w-xs">
                      {hasActiveFilter
                        ? "No employees match your filters. Try adjusting your search criteria."
                        : "No employees are registered in the system yet."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EmployeeList;
