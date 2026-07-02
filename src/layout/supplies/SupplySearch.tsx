import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { useInView } from "react-intersection-observer";

import { getDataSetDataSupplies } from "@/db/statement";
import { Input } from "@/components/ui/input";
import { Package, Search, Loader2, X, Plus } from "lucide-react";
import type { SuppliesProps, ProtectedRouteProps } from "@/interface/data";

interface Props {
  datasetId: string | undefined;
  auth: ProtectedRouteProps;
  // Reports the current selection: a picked existing supply has an id; while
  // the user is still typing a new name, id is null (→ create on submit).
  onChange: (sel: { id: string | null; name: string }) => void;
}

interface ListProps {
  list: SuppliesProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

const SupplySearch = ({ datasetId, auth, onChange }: Props) => {
  const [query, setQuery] = useState("");
  const [debounced] = useDebounce(query, 350);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const { ref, inView } = useInView();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["supplySearch", datasetId, debounced],
    queryFn: ({ pageParam }) =>
      getDataSetDataSupplies(
        auth.token as string,
        datasetId as string,
        pageParam as string | null,
        "10",
        debounced,
      ),
    initialPageParam: null,
    getNextPageParam: (last) => (last.hasMore ? last.lastCursor : undefined),
    enabled: !!datasetId && !!auth.token && !!debounced.trim() && !pickedId,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (!pickedId) refetch();
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = data?.pages.flatMap((p) => p.list) ?? [];
  const trimmed = debounced.trim();
  const exactMatch = items.some(
    (s) => s.item.toLowerCase() === trimmed.toLowerCase(),
  );

  const pick = (s: SuppliesProps) => {
    setQuery(s.item);
    setPickedId(s.id);
    onChange({ id: s.id, name: s.item });
  };

  const clear = () => {
    setQuery("");
    setPickedId(null);
    onChange({ id: null, name: "" });
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => {
            setPickedId(null);
            setQuery(e.target.value);
            onChange({ id: null, name: e.target.value });
          }}
          placeholder="Search existing items or type a new name..."
          className="pl-8 pr-8 h-8 text-xs"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Results — only while typing a fresh query (not after a pick) */}
      {!pickedId && trimmed && (
        <div className="border rounded-md overflow-hidden">
          <div className="max-h-44 overflow-y-auto divide-y">
            {isLoading ? (
              <div className="flex items-center justify-center gap-1.5 py-4 text-gray-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-[11px]">Searching...</span>
              </div>
            ) : (
              <>
                {items.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pick(s)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2"
                  >
                    <Package className="h-3 w-3 text-gray-400 flex-none" />
                    <span className="text-xs text-gray-800 truncate">
                      {s.item}
                    </span>
                  </button>
                ))}
                {hasNextPage && <div ref={ref} className="h-1" />}
                {isFetchingNextPage && (
                  <div className="py-1.5 text-center">
                    <Loader2 className="h-3 w-3 animate-spin inline text-gray-400" />
                  </div>
                )}
                {/* Create-new hint when the typed name isn't an existing item */}
                {!exactMatch && (
                  <div className="px-3 py-2 bg-blue-50/60 flex items-center gap-1.5">
                    <Plus className="h-3 w-3 text-blue-600" />
                    <span className="text-[11px] text-blue-700">
                      New item — “{trimmed}” will be created
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {pickedId && (
        <p className="text-[10px] text-gray-500 flex items-center gap-1">
          <Package className="h-2.5 w-2.5" />
          Existing item selected — stock will be added to it.
        </p>
      )}
    </div>
  );
};

export default SupplySearch;
