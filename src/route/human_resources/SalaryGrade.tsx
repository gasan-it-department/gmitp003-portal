import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useParams } from "react-router";
import { useDebounce } from "use-debounce";

import { useAuth } from "@/provider/ProtectedRoute";
import { lineSGlist } from "@/db/statements/salaryGrade";

import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import { Loader2, Users, Landmark, Search, AlertCircle } from "lucide-react";

import type { SalaryGrade as SalaryGradeProps } from "@/interface/data";
import SalaryGradeItem from "@/layout/human_resources/item/SalaryGradeItem";

interface ListProps {
  list: SalaryGradeProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

const SalaryGrade = () => {
  const auth = useAuth();
  const { lineId } = useParams();
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 500);

  const {
    data,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    status,
    error,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["salary-grade", lineId, query],
    queryFn: ({ pageParam }) =>
      lineSGlist(
        auth.token as string,
        lineId,
        pageParam as string | null,
        "20",
        query,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.lastCursor ? lastPage.lastCursor : undefined,
    refetchOnWindowFocus: false,
  });

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });

  const items = data?.pages.flatMap((p) => p.list) ?? [];
  const total = items.length;
  const isLoading = status === "pending";

  // ── Error ──────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3">
        <div className="border rounded-lg bg-white p-6 text-center max-w-sm w-full">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Failed to load salary grades
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            {error instanceof Error ? error.message : "Please try again."}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <div className="p-3 flex-1 flex flex-col min-h-0 max-w-5xl mx-auto w-full">

        {/* Header card */}
        <div className="border rounded-lg bg-white overflow-hidden mb-3">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Landmark className="h-3 w-3 text-blue-500" />
              <div>
                <h3 className="text-xs font-semibold text-gray-800">
                  Salary Grades
                </h3>
                <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                  {total} grade{total !== 1 ? "s" : ""} configured
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b">
            <InputGroup className="bg-white">
              <InputGroupAddon>
                <Search className="h-3 w-3 text-gray-400" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by grade..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="h-8 text-xs"
              />
            </InputGroup>
            {query && (
              <p className="text-[10px] text-gray-500 mt-1">
                Searching for <span className="font-medium">"{query}"</span>
              </p>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg bg-white overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-gray-100 sticky top-0 z-10">
                <TableRow className="hover:bg-gray-100 border-b">
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-20 text-center">
                    Grade
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 min-w-[160px]">
                    Salary Amount
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-32">
                    Users
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 text-right w-16">

                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-3 py-2">
                        <Skeleton className="h-4 w-12 mx-auto" />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Skeleton className="h-3 w-24" />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Skeleton className="h-3 w-16" />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Skeleton className="h-3 w-6 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : items.length > 0 ? (
                  <>
                    {items.map((g) => (
                      <SalaryGradeItem
                        key={g.id}
                        item={g}
                        userId={auth.userId as string}
                        token={auth.token as string}
                        lineId={lineId as string}
                      />
                    ))}

                    {hasNextPage && (
                      <TableRow ref={ref}>
                        <TableCell colSpan={4} className="h-10 p-0" />
                      </TableRow>
                    )}

                    {isFetchingNextPage && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-gray-400">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-[10px]">Loading more...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {!hasNextPage && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-3 text-center border-t"
                        >
                          <p className="text-[10px] text-gray-400">
                            All {total} grade{total !== 1 ? "s" : ""} loaded
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-300" />
                        </div>
                        <p className="text-xs font-medium text-gray-500">
                          {query ? `No grades match "${query}"` : "No salary grades yet"}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {query
                            ? "Try a different search term"
                            : "Configure salary grades to assign them to employees."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryGrade;
