import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { useInView } from "react-intersection-observer"; // Add this import
//
import { searchedChar } from "@/utils/element";
//
import { medicineList } from "@/db/statement";
//
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Item, ItemContent, ItemMedia } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";

//
import { Search, Check, Ban } from "lucide-react";

//
import type { Medicine } from "@/interface/data";

interface ListProps {
  list: Medicine[];
  lastCursor: string | null;
  hasMore: boolean;
}

interface Props {
  onChange: (...event: any[]) => void;
  value: Medicine | undefined;
}

const SelectMed = ({ onChange, value }: Props) => {
  const { lineId } = useParams();
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);
  const auth = useAuth();

  // Add useInView hook for infinite scroll
  const { ref, inView } = useInView();

  const {
    data,
    isFetchingNextPage,
    isFetching,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["medicine-list", lineId],
    queryFn: ({ pageParam }) =>
      medicineList(
        auth.token as string,
        lineId as string,
        pageParam as string | null,
        "20",
        query,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

  useEffect(() => {
    refetch();
  }, [query]);

  // Add infinite scroll effect
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allMedicines = data?.pages.flatMap((page) => page.list) || [];
  const totalCount = allMedicines.length;

  return (
    <ScrollArea className="w-full h-full overflow-auto flex flex-col gap-2 px-2">
      <div className="w-full sticky top-0 bg-white z-10 pb-4">
        <p className="font-medium text-lg">Select Medicines</p>
        <InputGroup className="mt-4">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search item"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </InputGroup>
        {query && totalCount > 0 && (
          <div className="text-sm text-gray-500 mt-2">
            Found {totalCount} item{totalCount !== 1 ? "s" : ""} for "{query}"
          </div>
        )}
      </div>

      {isFetching && totalCount === 0 ? (
        <div className="flex justify-center py-8">
          <div className="flex flex-col items-center gap-2">
            <Spinner />
            <p className="text-gray-500">Loading medicines...</p>
          </div>
        </div>
      ) : totalCount > 0 ? (
        <div className="space-y-2 pb-4">
          {allMedicines.map((item, i) => (
            <Item
              onClick={() => onChange(item)}
              key={item.id}
              variant="outline"
              className="bg-white hover:border-neutral-500 cursor-pointer transition-colors"
            >
              <ItemMedia>{i + 1}.</ItemMedia>
              <ItemContent className="text-neutral-800">
                <p>{searchedChar(query, item.name)}</p>
                <p className="text-sm text-gray-500">
                  {searchedChar(query, item.serialNumber)}
                </p>
              </ItemContent>
              <ItemMedia>
                {value && value.id === item.id && (
                  <Check className="text-green-600" />
                )}
              </ItemMedia>
            </Item>
          ))}

          {/* Infinite scroll trigger element */}
          <div ref={ref} className="h-4" />

          {/* Loading more indicator */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <div className="flex items-center gap-2 text-gray-500">
                <Spinner className="w-4 h-4" />
                <span>Loading more...</span>
              </div>
            </div>
          )}

          {/* End of list indicator */}
          {!hasNextPage && totalCount > 0 && (
            <div className="text-center py-4 text-gray-400 text-sm">
              All {totalCount} item{totalCount !== 1 ? "s" : ""} loaded
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center py-8">
          <div className="flex flex-col items-center gap-2">
            <Ban className="h-8 w-8 text-gray-400" />
            <p className="text-gray-500">No items found</p>
            {query && (
              <p className="text-sm text-gray-400">
                Try a different search term
              </p>
            )}
          </div>
        </div>
      )}
    </ScrollArea>
  );
};

export default SelectMed;
