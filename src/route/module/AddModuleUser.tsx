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

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmployeeItem from "@/layout/human_resources/module/item/EmployeeItem";
//
import { Search, User, Mail, Building } from "lucide-react";
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
        ""
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
  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-xl font-semibold">Add Module Users</h1>
        <p className="text-sm text-gray-600">Select users to add to module</p>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <InputGroup className="bg-white">
          <InputGroupAddon>
            <Search className="w-4 h-4" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search user by username, name or email..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </InputGroup>
      </div>

      {/* Users List */}
      <ScrollArea className="flex-1 overflow-auto">
        <div className="p-4 space-y-3">
          {isFetching && !isFetchingNextPage ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : users.length > 0 ? (
            users.map((user) => (
              <EmployeeItem
                currUserId={auth.userId as string}
                key={user.id}
                item={user}
                module={moduleId as string}
                query={query}
                token={auth.token as string}
                lineId={lineId as string}
              />
            ))
          ) : (
            <Item className="p-8 text-center">
              <ItemContent>
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <User className="w-12 h-12" />
                  <ItemTitle>No users found</ItemTitle>
                  <p>Try adjusting your search criteria</p>
                </div>
              </ItemContent>
            </Item>
          )}

          {/* Load more trigger */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          )}
          <div ref={ref} className="h-1" />
        </div>
      </ScrollArea>
    </div>
  );
};

export default AddModuleUser;
