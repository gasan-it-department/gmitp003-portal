import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams } from "react-router";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
//
import { employeeList } from "@/db/statement";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import EmployeeItem from "@/layout/human_resources/module/item/EmployeeItem";
//
import { Search, User, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
//
import type { User as UserType } from "@/interface/data";

interface ListProps {
  list: UserType[];
  lastCursor: string | null;
  hasMore: boolean;
}

const AddModuleUser = () => {
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);
  const { lineId, moduleId } = useParams();
  const auth = useAuth();

  const {
    data,
    isFetchingNextPage,
    isFetching,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["users", lineId, query],
    queryFn: ({ pageParam }) =>
      employeeList(
        auth.token as string,
        lineId as string,
        pageParam as string | null,
        "20",
        query,
        "",
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

  const { ref } = useInView({
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const users = data?.pages.flatMap((page) => page.list) || [];

  useEffect(() => {
    refetch();
  }, [query]);

  const handleClearSearch = () => {
    setText("");
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section - Compact */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">
                Add Module Users
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Select users to add to this module
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section - Compact */}
      <div className="bg-white/50 border-b px-4 py-3">
        <div className="relative">
          <InputGroup className="bg-white shadow-sm">
            <InputGroupAddon className="bg-white border-r">
              <Search className="h-4 w-4 text-gray-400" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by username, name or email..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-8"
            />
            {text && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </InputGroup>

          {/* Search info */}
          {query && (
            <div className="mt-2 text-xs text-gray-500">
              Showing results for:{" "}
              <span className="font-medium text-gray-700">"{query}"</span>
            </div>
          )}
        </div>
      </div>

      {/* Users List */}
      <ScrollArea className="flex-1 overflow-auto">
        <div className="p-4 space-y-2">
          {/* Results count */}
          {!isFetching && users.length > 0 && (
            <div className="text-xs text-gray-500 mb-2 px-1">
              Found {users.length} user{users.length !== 1 ? "s" : ""}
              {query && ` matching "${query}"`}
            </div>
          )}

          {/* Loading State */}
          {isFetching && !isFetchingNextPage ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <Spinner className="h-8 w-8" />
              </div>
              <p className="mt-3 text-xs font-medium text-gray-600">
                Loading users...
              </p>
              <p className="text-xs text-gray-400 mt-1">Please wait</p>
            </div>
          ) : users.length > 0 ? (
            <>
              {users.map((user) => (
                <EmployeeItem
                  currUserId={auth.userId as string}
                  key={user.id}
                  item={user}
                  module={moduleId as string}
                  query={query}
                  token={auth.token as string}
                  lineId={lineId as string}
                />
              ))}

              {/* Load more trigger */}
              <div ref={ref} className="h-1" />

              {/* Loading more indicator */}
              {isFetchingNextPage && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Spinner className="h-4 w-4" />
                  <span className="text-xs text-gray-500">
                    Loading more users...
                  </span>
                </div>
              )}

              {/* End of list */}
              {!hasNextPage && users.length > 0 && (
                <div className="text-center py-4">
                  <Badge variant="outline" className="text-xs bg-white">
                    End of list
                  </Badge>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                {query ? "No users found" : "No users available"}
              </h3>
              <p className="text-xs text-gray-500 text-center max-w-sm">
                {query
                  ? `We couldn't find any users matching "${query}". Try adjusting your search.`
                  : "No users are currently available to add to this module."}
              </p>
              {query && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 text-xs"
                  onClick={handleClearSearch}
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AddModuleUser;
