import { useState } from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { useNavigate } from "react-router";

import { searchArchiveDocument } from "@/db/statements/document";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  Calendar,
  Loader2,
  X,
  Brain,
  Sparkles,
  Building2,
  Target,
} from "lucide-react";

import type { ArchiveDocument } from "@/interface/data";

interface Props {
  full: boolean;
  roomId: string;
  lineId: string;
  token: string;
}

// Extended type with optional similarity score from the AI endpoint
interface ScoredArchive extends ArchiveDocument {
  similarity?: number;
}

interface ListProps {
  list: ScoredArchive[];
  hasMore: boolean;
  lastCursor: string | null;
  totalMatches?: number;
  threshold?: number;
}

// Available threshold steps for the AI search (relevance cutoff)
const THRESHOLDS = [
  { label: "Loose",   value: 0.15 },
  { label: "Balanced", value: 0.25 },
  { label: "Strict",  value: 0.4  },
];

const SearchArchive = ({ roomId, token, lineId }: Props) => {
  const [onDeepSearch, setOnDeepSearch] = useState(false);
  const [threshold, setThreshold] = useState(0.25);
  const [query, setQuery] = useState("");
  const nav = useNavigate();

  const [searchQuery] = useDebounce(query, 700);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
    error,
  } = useInfiniteQuery<ListProps>({
    queryKey: [
      "archive",
      roomId,
      lineId,
      searchQuery,
      onDeepSearch,
      onDeepSearch ? threshold : null,
    ],
    queryFn: ({ pageParam }) =>
      searchArchiveDocument(
        token,
        roomId,
        pageParam as string | null,
        "20",
        searchQuery,
        lineId,
        onDeepSearch,
        onDeepSearch ? threshold : undefined,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!searchQuery,
    refetchOnWindowFocus: false,
  });

  const results = data?.pages.flatMap((p) => p.list) ?? [];
  const isLoading = isFetching && results.length === 0;
  const isEmpty = !isLoading && results.length === 0;
  const firstPage = data?.pages[0];
  const totalMatches = firstPage?.totalMatches;

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-lg border overflow-hidden">

      {/* ── Search header ──────────────────────────────────────────── */}
      <div className="px-3 py-2 border-b bg-gray-50 space-y-2">

        {/* Title + Deep Search toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Search className="h-3 w-3 text-blue-500" />
            <div>
              <h3 className="text-xs font-semibold text-gray-800">
                Search Archive
              </h3>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                Find documents by title, abstract, or meaning
              </p>
            </div>
          </div>
          <Button
            onClick={() => setOnDeepSearch((d) => !d)}
            size="sm"
            variant={onDeepSearch ? "default" : "outline"}
            className={`h-7 text-[10px] gap-1.5 transition-colors ${
              onDeepSearch
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "hover:border-purple-300 hover:text-purple-700"
            }`}
          >
            {onDeepSearch ? (
              <Sparkles className="h-3 w-3" />
            ) : (
              <Brain className="h-3 w-3" />
            )}
            Deep Search
          </Button>
        </div>

        {/* Search input */}
        <InputGroup className="bg-white">
          <InputGroupAddon>
            <Search className="h-3 w-3 text-gray-400" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={
              onDeepSearch
                ? "Search by meaning, e.g. 'budget overruns Q4 2025'..."
                : "Search by title, abstract, or ID..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 text-xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </InputGroup>

        {/* Deep-search threshold selector */}
        {onDeepSearch && (
          <div className="flex items-center gap-1.5">
            <Target className="h-2.5 w-2.5 text-purple-500" />
            <span className="text-[10px] text-gray-600">Relevance:</span>
            <div className="flex gap-0.5 p-0.5 bg-white border rounded-md">
              {THRESHOLDS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setThreshold(t.value)}
                  className={`h-5 px-2 text-[10px] rounded transition-colors ${
                    threshold === t.value
                      ? "bg-purple-100 text-purple-700 font-medium"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-gray-400 font-mono">
              ≥ {threshold.toFixed(2)}
            </span>
          </div>
        )}

        {/* Description / hint */}
        <div className="flex items-start gap-1.5">
          {onDeepSearch ? (
            <Sparkles className="h-3 w-3 text-purple-500 mt-0.5 flex-shrink-0" />
          ) : (
            <Brain className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
          )}
          <p className="text-[10px] text-gray-500">
            {onDeepSearch ? (
              <>
                <span className="font-semibold text-purple-700">
                  Deep Search (AI) is on.
                </span>{" "}
                Finds documents by meaning, not just keywords. Slower for large
                archives but catches synonyms and paraphrases.
              </>
            ) : (
              <>
                <span className="font-semibold text-gray-700">
                  Keyword search.
                </span>{" "}
                Matches words exactly across title and abstract.{" "}
                <button
                  type="button"
                  onClick={() => setOnDeepSearch(true)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Enable Deep Search →
                </button>
              </>
            )}
          </p>
        </div>

        {/* Filter pills */}
        {searchQuery && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
            >
              "{searchQuery}"
            </Badge>
            {onDeepSearch && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200 gap-0.5"
              >
                <Sparkles className="h-2.5 w-2.5" />
                AI
              </Badge>
            )}
            {typeof totalMatches === "number" && (
              <span className="text-[10px] text-gray-500">
                {totalMatches} relevant match{totalMatches !== 1 ? "es" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Results ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-3">

        {!searchQuery ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <Search className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-xs font-medium text-gray-500">
              Type to search the archive
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5 max-w-xs">
              Toggle <strong>Deep Search</strong> to use AI for meaning-based
              search across abstracts.
            </p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-2">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-xs font-medium text-red-600">
              Search failed
            </p>
            <p className="text-[10px] text-gray-500 mt-1 max-w-xs break-words">
              {(error as any)?.response?.data?.message ||
                (error as any)?.message ||
                "The server returned an error."}
            </p>
            {onDeepSearch && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] gap-1.5 mt-3"
                onClick={() => setOnDeepSearch(false)}
              >
                Fall back to keyword search
              </Button>
            )}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500">
                {onDeepSearch ? "AI-searching..." : "Searching..."}
              </p>
              {onDeepSearch && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Computing semantic similarity
                </p>
              )}
            </div>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <Search className="h-5 w-5 text-gray-300" />
            </div>
            <p className="text-xs font-medium text-gray-500">
              No results for "{searchQuery}"
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5 max-w-xs">
              {onDeepSearch
                ? `Try lowering relevance to ${THRESHOLDS[0].label.toLowerCase()} or switching to keyword search.`
                : "Try different terms or enable Deep Search for semantic matching."}
            </p>
            <div className="flex gap-1.5 mt-3">
              {!onDeepSearch && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] gap-1.5"
                  onClick={() => setOnDeepSearch(true)}
                >
                  <Sparkles className="h-3 w-3" />
                  Try Deep Search
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px]"
                onClick={() => setQuery("")}
              >
                Clear
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[10px] text-gray-500 mb-2">
              {results.length} result{results.length !== 1 ? "s" : ""} shown
              {onDeepSearch && " · ordered by relevance"}
            </p>

            <div className="space-y-1.5">
              {results.map((item, i) => {
                const score = item.similarity ?? 0;
                const scorePct = Math.round(score * 100);
                return (
                  <button
                    key={item.id ?? i}
                    type="button"
                    onClick={() => nav(item.id)}
                    className="group w-full text-left border rounded-lg bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                  >
                    <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileText className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        <span className="text-xs font-semibold text-gray-800 truncate group-hover:text-blue-600">
                          {item.document?.title || "Untitled Document"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {onDeepSearch && score > 0 && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${
                              scorePct >= 60
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : scorePct >= 40
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-gray-50 text-gray-600 border-gray-200"
                            }`}
                          >
                            <Sparkles className="h-2 w-2 mr-0.5" />
                            {scorePct}%
                          </Badge>
                        )}
                        <Badge
                          variant={item.status === 1 ? "default" : "secondary"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {item.status === 1 ? "Active" : "Archived"}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-3">
                      {item.abstract?.content ? (
                        <p className="text-[10px] text-gray-600 line-clamp-2 leading-relaxed">
                          {item.abstract.content}
                        </p>
                      ) : (
                        <p className="text-[10px] text-gray-400 italic">
                          No abstract recorded.
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400 flex-wrap">
                        {item.timestamp && (
                          <span className="flex items-center gap-0.5">
                            <Calendar className="h-2.5 w-2.5" />
                            {new Date(item.timestamp).toLocaleDateString("en-PH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                        {item.documentId && (
                          <span className="font-mono">
                            ID: {item.documentId.slice(0, 8)}
                          </span>
                        )}
                        {item.receivingRoom?.code && (
                          <span className="flex items-center gap-0.5">
                            <Building2 className="h-2.5 w-2.5" />
                            Room {item.receivingRoom.code}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Infinite scroll */}
              {hasNextPage && <div ref={ref} className="h-8" />}

              {isFetchingNextPage && (
                <div className="flex items-center justify-center gap-1.5 py-3 text-gray-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-[10px]">Loading more...</span>
                </div>
              )}

              {!hasNextPage && (
                <div className="text-center py-2">
                  <span className="text-[10px] text-gray-400">
                    End of results
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchArchive;
