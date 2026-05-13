import { useState, useMemo } from "react";
import { useDebounce } from "use-debounce";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams } from "react-router";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";

import { employeeList } from "@/db/statement";
import { panels } from "@/layout/ControlPanel";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, User, Users, X, Loader2 } from "lucide-react";

import EmployeeItem from "@/layout/human_resources/module/item/EmployeeItem";
import type { User as UserType } from "@/interface/data";

interface ListProps {
  list: UserType[];
  lastCursor: string | null;
  hasMore: boolean;
}

const AddModuleUser = () => {
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 700);
  const { lineId, moduleId } = useParams();
  const auth = useAuth();

  const moduleTitle = useMemo(() => {
    const panel = panels.find((p) => p.path === moduleId);
    return panel?.title ?? moduleId ?? "Module";
  }, [moduleId]);

  const {
    data,
    isFetchingNextPage,
    isFetching,
    hasNextPage,
    fetchNextPage,
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
    refetchOnWindowFocus: false,
  });

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });

  const users = data?.pages.flatMap((p) => p.list) ?? [];
  const isLoading = isFetching && !data;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <div className="p-3 flex-1 flex flex-col min-h-0">

        {/* Header card */}
        <div className="border rounded-lg bg-white overflow-hidden mb-3">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
            <Users className="h-3 w-3 text-blue-500" />
            <div>
              <h3 className="text-xs font-semibold text-gray-800">
                Add Users · <span className="capitalize">{moduleTitle}</span>
              </h3>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                Search for line members and grant them access
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b">
            <InputGroup className="bg-white">
              <InputGroupAddon>
                <Search className="h-3 w-3 text-gray-400" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by username, name or email..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="h-8 text-xs"
              />
              {text && (
                <button
                  type="button"
                  onClick={() => setText("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </InputGroup>
            {query && (
              <p className="text-[10px] text-gray-500 mt-1">
                Showing results for <span className="font-medium">"{query}"</span>
              </p>
            )}
          </div>
        </div>

        {/* Results list */}
        <div className="border rounded-lg bg-white overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-auto p-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 gap-1.5 text-gray-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-xs">Loading users...</span>
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-2">
                {!isFetching && (
                  <p className="text-[10px] text-gray-500 px-0.5">
                    Found {users.length} user{users.length !== 1 ? "s" : ""}
                    {query && ` matching "${query}"`}
                  </p>
                )}

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

                {/* Load-more trigger */}
                {hasNextPage && <div ref={ref} className="h-1" />}

                {isFetchingNextPage && (
                  <div className="flex items-center justify-center gap-1.5 py-3 text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-[10px]">Loading more...</span>
                  </div>
                )}

                {!hasNextPage && users.length > 0 && (
                  <div className="text-center py-3">
                    <Badge variant="outline" className="text-[10px] px-2 py-0">
                      End of list
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <User className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-xs font-medium text-gray-500">
                  {query ? "No users found" : "No users available"}
                </p>
                <p className="text-[10px] text-gray-400 max-w-xs mt-0.5">
                  {query
                    ? `No matches for "${query}". Try a different search.`
                    : "No line members are available to add."}
                </p>
                {query && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 h-7 text-[10px]"
                    onClick={() => setText("")}
                  >
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddModuleUser;
