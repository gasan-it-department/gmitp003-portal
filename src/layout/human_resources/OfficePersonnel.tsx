import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { getAllOfficePersonnel } from "@/db/statement";

// Components and layout
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

// Hooks and libs
import { useAuth } from "@/provider/ProtectedRoute";
import type { User as UserProps } from "@/interface/data";
import SWWItem from "../item/SWWItem";
import PersonnelItem from "./item/PersonnelItem";

// Icons
import { Loader2, User } from "lucide-react";

interface ListProps {
  list: UserProps[];
  lastCursor: string | null;
  hasMore: boolean;
}

const OfficePersonnel = () => {
  const { token } = useAuth();
  const { officeID } = useParams();
  const { ref, inView } = useInView();

  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["unitPersonnel", officeID],
    queryFn: ({ pageParam }) =>
      getAllOfficePersonnel(
        token as string,
        officeID as string,
        pageParam as string | null,
        "10",
        "",
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
  });

  // Trigger fetch when scrolled to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPersonnel = data?.pages.flatMap((page) => page.list) || [];
  const totalCount = allPersonnel.length;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Table Container */}
      <div className="flex-1 overflow-hidden bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-16 font-semibold text-gray-700">
                  No.
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Lastname
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Firstname
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Middle
                </TableHead>

                <TableHead className="font-semibold text-gray-700">
                  Position
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100">
              {isFetching && !data ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                      <p className="text-gray-600">Loading personnel data...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : allPersonnel.length > 0 ? (
                <>
                  {allPersonnel.map((item, index) => (
                    <PersonnelItem
                      key={`${item.id}-${index}`}
                      item={item}
                      no={index + 1}
                    />
                  ))}

                  {/* Loading row for infinite scroll */}
                  {(isFetchingNextPage || hasNextPage) && (
                    <TableRow ref={ref}>
                      <TableCell colSpan={8} className="py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          <span className="text-sm text-gray-500">
                            Loading more...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ) : !isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12">
                    <div className="flex flex-col items-center justify-center">
                      <User className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-600 font-medium">
                        No personnel found
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        There are no personnel assigned to this office
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={8}>
                    <SWWItem colSpan={8} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <User className="w-4 h-4 mr-1" />
            Showing {totalCount} personnel
          </span>
          {isFetchingNextPage && (
            <span className="flex items-center text-blue-600">
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
              Loading more...
            </span>
          )}
        </div>
        {hasNextPage && !isFetchingNextPage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            Load More
          </Button>
        )}
      </div>
    </div>
  );
};

export default OfficePersonnel;
