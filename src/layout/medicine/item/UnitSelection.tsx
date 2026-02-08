import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/provider/ProtectedRoute";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useDebounce } from "use-debounce";
import { useInView } from "react-intersection-observer";
//
import { getLinetUnits } from "@/db/statement";
//icons
import { Check, ChevronsUpDown, Search, Building2, Hash } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  InputGroupInput,
  InputGroup,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
//
import type { Department } from "@/interface/data";

interface ListProps {
  list: Department[];
  lastCursor: string | null;
  hasMore: boolean;
}

interface Props {
  onChange: (...event: any[]) => void;
  value?: string;
  defaultValue?: string;
}

const UnitSelection = ({ onChange, value, defaultValue = "all" }: Props) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);
  const { ref, inView } = useInView();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const auth = useAuth();
  const { lineId } = useParams();

  const {
    data,
    isFetching,
    refetch,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["line-units", lineId, query],
    queryFn: ({ pageParam }) =>
      getLinetUnits(
        auth.token as string,
        lineId as string,
        pageParam as string | null,
        "15",
        query,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
  });

  useEffect(() => {
    refetch();
  }, [query, refetch]);

  // Infinite scroll trigger
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSelect = (selectedId: string) => {
    onChange(selectedId);
    setOpen(false);
  };

  const allUnits = data?.pages.flatMap((item) => item.list) || [];
  const totalUnits = allUnits.length;

  const displayValue = value
    ? allUnits.find((unit) => unit.id === value)?.name
    : defaultValue;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between h-10 px-3"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 text-gray-500" />
            <span className="truncate">{displayValue}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Select Unit</h3>
            {totalUnits > 0 && !isFetching && (
              <Badge variant="outline" className="text-xs font-normal">
                {totalUnits} unit{totalUnits !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <InputGroup>
            <InputGroupAddon className="bg-white border-r-0">
              <Search className="size-4 text-gray-400" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search units by name..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="pl-10 border-l-0"
            />
          </InputGroup>
          {query && (
            <p className="text-xs text-gray-500 mt-2">
              Searching for: "{query}"
            </p>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="h-80" ref={scrollAreaRef}>
          <div className="p-2">
            {/* "All" option */}
            {defaultValue && (
              <div className="mb-2">
                <Button
                  variant="ghost"
                  className={`w-full justify-start h-auto py-3 px-3 rounded-lg ${
                    !value || value === "all"
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelect("all")}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-gray-100">
                        <Building2 className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="text-left">
                        <span className="font-medium text-gray-900">
                          All Units
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Select all organizational units
                        </p>
                      </div>
                    </div>
                    {(!value || value === "all") && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </Button>
                <Separator className="my-2" />
              </div>
            )}

            {/* Loading State */}
            {isFetching && allUnits.length === 0 && (
              <div className="space-y-2 p-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Units List */}
            {allUnits.length > 0 ? (
              <div className="space-y-1">
                {allUnits.map((item, index) => (
                  <div
                    key={item.id}
                    ref={index === allUnits.length - 1 ? ref : null}
                  >
                    <Button
                      variant="ghost"
                      className={`w-full justify-start h-auto py-3 px-3 rounded-lg mb-1 ${
                        value === item.id
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleSelect(item.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-md ${
                              value === item.id ? "bg-blue-100" : "bg-gray-100"
                            }`}
                          >
                            <Building2
                              className={`h-4 w-4 ${
                                value === item.id
                                  ? "text-blue-600"
                                  : "text-gray-600"
                              }`}
                            />
                          </div>
                          <div className="text-left">
                            <span
                              className={`font-medium ${
                                value === item.id
                                  ? "text-blue-700"
                                  : "text-gray-900"
                              }`}
                            >
                              {item.name}
                            </span>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Hash className="h-3 w-3" />
                                <span>{item.id.substring(0, 8)}...</span>
                              </div>
                              {item.createdAt && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <span>
                                    Created: {formatDate(item.createdAt)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {value === item.id && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    </Button>
                  </div>
                ))}

                {/* Loading More Indicator */}
                {isFetchingNextPage && (
                  <div className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
                      <span className="text-sm text-gray-500">
                        Loading more units...
                      </span>
                    </div>
                  </div>
                )}

                {/* End of List */}
                {!hasNextPage && totalUnits > 0 && (
                  <div className="py-3 px-4 border-t">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">
                        Showing {totalUnits} unit{totalUnits !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : !isFetching ? (
              // Empty State
              <div className="py-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-gray-400" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  No units found
                </h4>
                <p className="text-sm text-gray-500">
                  {query ? `No results for "${query}"` : "No units available"}
                </p>
                {query && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setText("")}
                    className="mt-3 text-xs"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </ScrollArea>

        {/* Footer */}
        {allUnits.length > 0 && (
          <div className="border-t bg-gray-50 px-4 py-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span>Scroll to load more units</span>
              </div>
              <span>
                Last updated:{" "}
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default UnitSelection;
