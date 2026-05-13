import { useState, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useDebounce } from "use-debounce";
import { useInView } from "react-intersection-observer";

import { getModuleUsers } from "@/db/statement";
import { panels } from "@/layout/ControlPanel";

import {
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableHeader,
  TableCell,
} from "@/components/ui/table";
import SWWItem from "@/layout/item/SWWItem";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, PlusCircle, Users, Loader2 } from "lucide-react";

import ModuleUserItem from "./item/ModuleUserItem";
import type { User } from "@/interface/data";

interface ListProps {
  list: User[];
  lastCursor: string | null;
  hasMore: boolean;
}

const ModuleUsers = () => {
  const { moduleId, lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 700);

  // Resolve the moduleId slug ("supplies", "medicine", ...) to its panel title
  const moduleTitle = useMemo(() => {
    const panel = panels.find((p) => p.path === moduleId);
    return panel?.title ?? moduleId ?? "Module";
  }, [moduleId]);

  const {
    data,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isError,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["module-users", moduleId, lineId, query],
    queryFn: ({ pageParam }) =>
      getModuleUsers(
        auth.token as string,
        moduleId,
        pageParam as string | null,
        "20",
        query,
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
  const totalUsers = users.length;
  const isLoading = isFetching && !data;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <div className="p-3 flex-1 flex flex-col min-h-0">

        {/* Header card */}
        <div className="border rounded-lg bg-white overflow-hidden mb-3">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 text-blue-500" />
              <div>
                <h3 className="text-xs font-semibold text-gray-800 capitalize">
                  {moduleTitle}
                </h3>
                <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                  {totalUsers} user{totalUsers !== 1 ? "s" : ""} have module access
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
              onClick={() => nav("add")}
            >
              <PlusCircle className="h-3 w-3" />
              Add User
            </Button>
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
            </InputGroup>
            {query && (
              <p className="text-[10px] text-gray-500 mt-1">
                Searching for <span className="font-medium">"{query}"</span>
              </p>
            )}
          </div>
        </div>

        {/* Users table */}
        <div className="border rounded-lg bg-white overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-gray-100 sticky top-0 z-10">
                <TableRow className="hover:bg-gray-100 border-b">
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-10">
                    #
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 min-w-[140px]">
                    Username
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 min-w-[140px]">
                    Last Name
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 min-w-[140px]">
                    First Name
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-32">
                    Privilege
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-24">
                    Status
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 text-right w-16">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-3 w-6" /></TableCell>
                      <TableCell><Skeleton className="h-3 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-3 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-3 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-3 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-3 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-3 w-6 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <SWWItem colSpan={7} />
                ) : users.length > 0 ? (
                  <>
                    {users.map((item, i) => (
                      <ModuleUserItem
                        key={item.id || i}
                        item={item}
                        no={i}
                        userId={auth.userId as string}
                        token={auth.token as string}
                        lineId={lineId as string}
                        moduleId={moduleId as string}
                        query={query}
                      />
                    ))}

                    {hasNextPage && (
                      <TableRow ref={ref}>
                        <TableCell colSpan={7} className="h-10 p-0" />
                      </TableRow>
                    )}

                    {isFetchingNextPage && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-gray-400">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-[10px]">Loading more...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {!hasNextPage && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-3 text-center border-t">
                          <p className="text-[10px] text-gray-400">
                            All {totalUsers} user{totalUsers !== 1 ? "s" : ""} loaded
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-300" />
                        </div>
                        <p className="text-xs font-medium text-gray-500">
                          {query ? `No results for "${query}"` : "No users yet"}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {query
                            ? "Try a different search term"
                            : "Add users to grant them module access."}
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

export default ModuleUsers;
