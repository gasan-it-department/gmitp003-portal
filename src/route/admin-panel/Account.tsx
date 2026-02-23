import { useInfiniteQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/provider/AdminRouter";
import { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useInView } from "react-intersection-observer";
import { useSearchParams } from "react-router";
//
import { getAccounts } from "@/db/statement";
import type { AccountProps } from "@/interface/data";

//
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
//
import { Search, Users, Loader2, UserCircle, Mail } from "lucide-react";

interface LoadProps {
  list: AccountProps[];
  lastCursor: string | null;
  hasMore: boolean;
}

const Account = () => {
  const [onOpen, setOnOpen] = useState(0);
  const [params, setParams] = useSearchParams({ query: "" });
  const admin = useAdminAuth();
  const { ref, inView } = useInView();

  const currentQuery = params.get("query") || "";

  const {
    data,
    isFetchingNextPage,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery<LoadProps>({
    queryFn: ({ pageParam }) =>
      getAccounts(admin.token, pageParam as string | null, 20, currentQuery),
    queryKey: ["account", currentQuery],
    getNextPageParam: (lastPage) => lastPage.lastCursor,
    initialPageParam: null,
  });

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      {
        replace: true,
      },
    );
  };

  const debounced = useDebouncedCallback((value) => {
    handleChangeParams("query", value);
  }, 1000);

  useEffect(() => {
    refetch();
  }, [currentQuery]);

  // Infinite scroll trigger
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const accounts = data?.pages.flatMap((item) => item.list) || [];
  const totalCount = accounts.length;

  return (
    <div className="w-full h-full p-2 md:p-6 bg-gray-50">
      <Card className="border shadow-sm h-full flex flex-col">
        {/* Header */}
        <CardHeader className="bg-white border-b px-4 md:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search Bar */}
            <div className="w-full sm:w-72">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by username, name, or email..."
                  type="text"
                  defaultValue={currentQuery}
                  onChange={(e) => debounced(e.target.value)}
                  className="pl-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Stats Badge */}
          {!isFetching && totalCount > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1">
                {totalCount} {totalCount === 1 ? "Account" : "Accounts"} Found
              </Badge>
              {currentQuery && (
                <Badge variant="outline" className="px-3 py-1">
                  Search: "{currentQuery}"
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        {/* Table Container with Scroll */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="min-w-full inline-block align-middle">
              <Table>
                <TableHeader className="bg-gray-100 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-16 text-gray-700 font-medium">
                      #
                    </TableHead>
                    <TableHead className="text-gray-700 font-medium">
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4" />
                        Username
                      </div>
                    </TableHead>
                    <TableHead className="text-gray-700 font-medium">
                      First Name
                    </TableHead>
                    <TableHead className="text-gray-700 font-medium">
                      Last Name
                    </TableHead>
                    <TableHead className="text-gray-700 font-medium">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFetching && !data ? (
                    // Initial loading skeleton
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Skeleton className="h-4 w-8" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : accounts.length > 0 ? (
                    accounts.map((item, i) => (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-blue-50/50 transition-colors group"
                        onClick={() => setOnOpen(1)}
                      >
                        <TableCell className="font-mono text-xs text-gray-500">
                          <div className="flex items-center gap-1">{i + 1}</div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserCircle className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="group-hover:text-blue-700 transition-colors">
                              {item.username}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.User ? (
                            item.User.firstName
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.User ? (
                            item.User.lastName
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.User ? (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">{item.User.email}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Users className="h-12 w-12 text-gray-300 mb-3" />
                          <p className="font-medium">No accounts found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            {currentQuery
                              ? `No results match "${currentQuery}"`
                              : "No accounts have been created yet"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Loading more indicator */}
                  {isFetchingNextPage && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-4">
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">
                            Loading more accounts...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Infinite scroll trigger */}
                  {hasNextPage && (
                    <TableRow ref={ref}>
                      <TableCell colSpan={5} className="py-2">
                        <div className="flex justify-center">
                          <Badge variant="outline" className="text-xs">
                            Scroll for more
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>

        {/* Footer with stats */}
        {accounts.length > 0 && (
          <div className="bg-gray-50 border-t px-4 md:px-6 py-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Showing {accounts.length}{" "}
                {accounts.length === 1 ? "account" : "accounts"}
              </span>
              {hasNextPage && (
                <span className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                  Scroll down to load more
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Account Details
              </h2>
              <p className="text-sm text-gray-500">
                View and manage account information
              </p>
            </div>
          </div>
        }
        children={
          <div className="p-4">Account details will be displayed here</div>
        }
        onOpen={onOpen === 1}
        className="max-w-2xl"
        setOnOpen={() => setOnOpen(0)}
        footer={true}
        cancelTitle="Close"
      />
    </div>
  );
};

export default Account;
