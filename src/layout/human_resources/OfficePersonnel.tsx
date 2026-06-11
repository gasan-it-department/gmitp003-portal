import { useState } from "react";
import { useParams } from "react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";

import { useAuth } from "@/provider/ProtectedRoute";
import { getAllOfficePersonnel } from "@/db/statement";

import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import PersonnelItem from "./item/PersonnelItem";

import { Loader2, User, Search, AlertCircle } from "lucide-react";

import type { User as UserProps } from "@/interface/data";

interface ListProps {
  list: UserProps[];
  lastCursor: string | null;
  hasMore: boolean;
}

const OfficePersonnel = () => {
  const { token } = useAuth();
  const { officeID } = useParams();

  const [text, setText] = useState("");
  const [query] = useDebounce(text, 400);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["unitPersonnel", officeID, query],
    queryFn: ({ pageParam }) =>
      getAllOfficePersonnel(
        token as string,
        officeID as string,
        pageParam as string | null,
        "20",
        query,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!token && !!officeID,
    refetchOnWindowFocus: false,
  });

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const items = data?.pages.flatMap((p) => p.list) ?? [];
  const total = items.length;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b px-3 py-2 flex items-center gap-1.5 flex-shrink-0">
        <InputGroup className="bg-white flex-1 max-w-xs">
          <InputGroupAddon>
            <Search className="h-3 w-3 text-gray-400" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by name or email..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-7 text-[11px]"
          />
        </InputGroup>
        <span className="ml-auto text-[10px] text-gray-500">
          {total} member{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-10 text-[10px] font-semibold text-gray-700">
                  No
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[140px]">
                  Last name
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[140px]">
                  First name
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[120px]">
                  Middle
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[150px]">
                  Position
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-[10px] font-medium text-red-600">
                        Failed to load personnel
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {(error as any)?.message ?? "Try again later."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isFetching && total === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center gap-1.5 text-gray-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-[10px]">Loading personnel...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : total === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-300" />
                      </div>
                      <p className="text-xs font-medium text-gray-700">
                        No personnel found
                      </p>
                      <p className="text-[10px] text-gray-500 max-w-[260px]">
                        {query
                          ? `No matches for "${query}".`
                          : "This office doesn't have personnel assigned yet."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, i) => (
                  <PersonnelItem
                    key={item.id}
                    item={item}
                    no={i + 1}
                  />
                ))
              )}

              {hasNextPage && (
                <TableRow ref={ref}>
                  <TableCell colSpan={5} className="text-center py-2">
                    {isFetchingNextPage ? (
                      <div className="flex items-center justify-center gap-1.5 text-gray-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-[10px]">Loading more...</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400">
                        Scroll to load more
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )}
              {!hasNextPage && total > 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-2 border-t">
                    <span className="text-[10px] text-gray-400">
                      Showing all {total} personnel
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default OfficePersonnel;
