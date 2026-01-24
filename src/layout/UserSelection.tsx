import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";

//db
import { searchLineUser } from "@/db/statements/user";

import UserItem from "@/layout/item/UserItem";

//interface/props
import type { User } from "@/interface/data";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, Loader2 } from "lucide-react";

interface Props {
  lineId: string;
  token: string;
  onSelect: (user: User) => void;
}

interface ListProps {
  list: User[];
  lastCursor: string | null;
  hasMore: boolean;
}

const UserSelection = ({ lineId, token, onSelect }: Props) => {
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 500);

  const { ref, inView } = useInView({
    threshold: 0,
  });

  const {
    data,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["users", query, lineId],
    queryFn: ({ pageParam }) =>
      searchLineUser(token, lineId, query, pageParam as string | null, "20"),
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.lastCursor : null;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    refetch();
  }, [query]);

  const allUsers = data?.pages.flatMap((page) => page.list) || [];
  const totalUsers = allUsers.length;

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                User Selection
              </h2>
              <p className="text-sm text-gray-500">
                Select users from your organization
              </p>
            </div>
          </div>
          {totalUsers > 0 && (
            <div className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
              {totalUsers} users
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users by name, username, or email..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isFetching && !data ? (
            // Loading Skeletons
            [...Array(5)].map((_, i) => (
              <Card key={i} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : allUsers.length > 0 ? (
            <>
              {/* User List */}
              {allUsers.map((user) => (
                <UserItem
                  key={user.id}
                  item={user}
                  query={query}
                  onSelect={onSelect}
                />
              ))}

              {/* Infinite Scroll Trigger */}
              <div ref={ref} className="pt-4">
                {isFetchingNextPage ? (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Loading more users...
                    </span>
                  </div>
                ) : hasNextPage ? (
                  <div className="h-2" /> // Invisible trigger
                ) : totalUsers > 0 ? (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        All {totalUsers} users loaded
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {query ? "No users found" : "No users available"}
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                {query
                  ? `No users match "${query}". Try a different search term.`
                  : "There are no users in this organization yet."}
              </p>
            </div>
          )}

          {/* Initial Loading */}
          {isFetching && !isFetchingNextPage && totalUsers === 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Loading users...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default UserSelection;
