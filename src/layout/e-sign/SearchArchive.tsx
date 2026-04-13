import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { useNavigate } from "react-router";
//
import { searchArchiveDocument } from "@/db/statements/document";
//
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Search,
  FileText,
  Calendar,
  ArchiveIcon,
  Loader2,
  X,
  Brain,
  Sparkles,
} from "lucide-react";
import {
  Item,
  ItemContent,
  ItemHeader,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
//
import type { ArchiveDocument } from "@/interface/data";

interface Props {
  full: boolean;
  roomId: string;
  lineId: string;
  token: string;
}

interface ListProps {
  list: ArchiveDocument[];
  hasMore: boolean;
  lastCursor: string | null;
}

const SearchArchive = ({ roomId, token, lineId }: Props) => {
  const [onDeepSearch, setOnDeepSearch] = useState(false);
  const [query, setQuery] = useState("");
  const nav = useNavigate();

  const [searchQuery] = useDebounce(query, 1000);

  const { data, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery<ListProps>({
      queryKey: ["archive", roomId, lineId, searchQuery, onDeepSearch],
      queryFn: ({ pageParam }) =>
        searchArchiveDocument(
          token,
          roomId,
          pageParam as string | null,
          "20",
          searchQuery,
          lineId,
          onDeepSearch,
        ),
      initialPageParam: null,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
      enabled: !!searchQuery,
    });

  const allList = data ? data.pages.flatMap((item) => item.list) : [];
  const isEmpty = !isFetching && allList.length === 0;

  // Infinite scroll observer
  const { ref, inView } = useInView({
    threshold: 0.5,
    rootMargin: "100px",
  });

  // Fetch next page when in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Clear search input
  const handleClearSearch = () => {
    setQuery("");
  };

  console.log({ allList });

  return (
    <div
      className={`flex flex-col h-full w-full bg-gradient-to-br from-gray-50 to-gray-100`}
    >
      {/* Search Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b">
        <div className="p-4">
          <div className="space-y-3">
            {/* Search Input Group */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <InputGroup className="shadow-sm">
                  <InputGroupAddon className="bg-white border-r">
                    <Search className="h-4 w-4 text-gray-400" />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Search by document title, abstract content, or ID..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pr-8"
                  />
                  {query && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </InputGroup>
              </div>
              <Button
                onClick={() => setOnDeepSearch(!onDeepSearch)}
                size="sm"
                variant={onDeepSearch ? "default" : "outline"}
                className={`gap-2 transition-all duration-200 ${
                  onDeepSearch
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    : "hover:border-purple-300 hover:text-purple-600"
                }`}
              >
                {onDeepSearch ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
                Deep Search
              </Button>
            </div>

            {/* Deep Search Description */}
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                {onDeepSearch ? (
                  <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                ) : (
                  <Brain className="h-3.5 w-3.5 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-500">
                {onDeepSearch ? (
                  <>
                    <span className="font-medium text-purple-600">
                      Deep Search (AI) is active.
                    </span>
                    Uses semantic understanding to find relevant documents based
                    on meaning and context, not just keyword matching.
                  </>
                ) : (
                  <>
                    <span className="font-medium text-gray-700">
                      Deep Search (AI)
                    </span>
                    uses semantic understanding to find relevant documents based
                    on meaning.
                    <button
                      onClick={() => setOnDeepSearch(true)}
                      className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    >
                      Enable for better results
                    </button>
                  </>
                )}
              </p>
            </div>

            {/* Search info */}
            {searchQuery && (
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                >
                  Searching: "{searchQuery}"
                </Badge>
                {onDeepSearch && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-purple-50 text-purple-700 border-purple-200 gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    AI Enhanced
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Container */}
      <div className="flex-1 overflow-auto p-4">
        {/* Loading State */}
        {isFetching && allList.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                <ArchiveIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-gray-500 font-medium">Searching archives...</p>
              <p className="text-sm text-gray-400 mt-1">
                {onDeepSearch
                  ? "Using AI-powered semantic search"
                  : "Please wait"}
              </p>
            </div>
          </div>
        ) : /* Empty State */
        isEmpty ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="bg-gray-50 rounded-full p-4 mb-4 inline-block">
                <Search className="h-12 w-12 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? "No results found" : "No archives to display"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery
                  ? `We couldn't find any archives matching "${searchQuery}". ${
                      onDeepSearch
                        ? "Try different search terms or disable Deep Search for keyword matching."
                        : "Try enabling Deep Search (AI) for semantic matching, or adjust your search terms."
                    }`
                  : "Search for documents in the archive to see results here."}
              </p>
              {searchQuery && !onDeepSearch && (
                <Button
                  variant="outline"
                  onClick={() => setOnDeepSearch(true)}
                  className="mx-auto gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Try Deep Search
                </Button>
              )}
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={handleClearSearch}
                  className="mx-auto mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          </div>
        ) : /* Results List */
        allList.length > 0 ? (
          <div className="space-y-3">
            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">
                Found{" "}
                <span className="font-semibold text-gray-700">
                  {allList.length}
                </span>{" "}
                result{allList.length !== 1 ? "s" : ""}
                {searchQuery && (
                  <>
                    for
                    <span className="font-medium text-gray-700">
                      "{searchQuery}"
                    </span>
                  </>
                )}
              </div>
              {onDeepSearch && (
                <Badge
                  variant="outline"
                  className="text-xs gap-1 bg-purple-50 text-purple-600 border-purple-200"
                >
                  <Sparkles className="h-3 w-3" />
                  AI-Powered Results
                </Badge>
              )}
            </div>

            {/* Result items */}
            {allList.map((item, index) => (
              <Item
                onClick={() => nav(item.id)}
                key={item.id || index}
                className="w-full p-4 border rounded-lg hover:shadow-md transition-all duration-200 bg-white cursor-pointer hover:border-blue-200"
              >
                <ItemHeader className="mb-2">
                  <div className="flex items-start justify-between">
                    <ItemTitle className="text-lg font-semibold text-gray-900">
                      {item.document?.title || "Untitled Document"}
                    </ItemTitle>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 1
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.status === 1 ? "Active" : "Archived"}
                    </span>
                  </div>
                </ItemHeader>

                <ItemContent>
                  {/* Abstract content */}
                  {item.abstract?.content && (
                    <ItemDescription className="text-gray-600 mb-3 line-clamp-2">
                      {item.abstract.content}
                    </ItemDescription>
                  )}

                  {/* Metadata footer */}
                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-2 pt-2 border-t">
                    {item.timestamp && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {item.documentId && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span className="font-mono">
                          ID: {item.documentId.slice(0, 8)}...
                        </span>
                      </div>
                    )}
                    {item.receivingRoom?.code && (
                      <div className="flex items-center gap-1">
                        <span>Room: {item.receivingRoom.code}</span>
                      </div>
                    )}
                  </div>
                </ItemContent>
              </Item>
            ))}

            {/* Infinite scroll trigger and loading more */}
            <div ref={ref} className="py-4">
              {isFetchingNextPage && (
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading more results...</span>
                </div>
              )}
              {hasNextPage && !isFetchingNextPage && (
                <div className="text-center text-sm text-gray-400 py-2">
                  Scroll for more results
                </div>
              )}
              {!hasNextPage && allList.length > 0 && (
                <div className="text-center text-sm text-gray-400 py-2">
                  End of results
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SearchArchive;
