import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { useInView } from "react-intersection-observer";
//
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { searchedChar } from "@/utils/element";
//
import { getLinetUnits } from "@/db/statement";

//
import { Check, Search } from "lucide-react";

//
import type { Department, ProtectedRouteProps } from "@/interface/data";
interface Props {
  onChange: (...event: any[]) => void;
  lineId: string;
  auth: ProtectedRouteProps;
  currentValue: string;
}

interface ListProps {
  list: Department[];
  lastCursor: string | null;
  hasMore: boolean;
}

const SelectUnit = ({ onChange, lineId, auth, currentValue }: Props) => {
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["line-units", lineId, query], // Include query in queryKey for proper caching
    queryFn: ({ pageParam }) =>
      getLinetUnits(
        auth.token as string,
        lineId as string,
        pageParam as string | null,
        "20",
        query
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined, // Return undefined when no more pages
  });

  const { ref, inView } = useInView({
    threshold: 0,
  });

  // Fetch next page when the observer element comes into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Refetch when query changes (debounced)
  useEffect(() => {
    refetch();
  }, [query, refetch]);

  const allItems = data?.pages.flatMap((page) => page.list) || [];

  return (
    <div>
      <div className=" mb-2">
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            onChange={(e) => setText(e.target.value)}
            placeholder="Search Unit"
            value={text}
          />
        </InputGroup>
      </div>

      <ScrollArea className="flex flex-col max-h-40 overflow-auto">
        {isFetching && !isFetchingNextPage ? (
          <p>Loading...</p>
        ) : allItems.length > 0 ? (
          allItems.map((item, i) => (
            <Item
              className="mt-1 hover:bg-neutral-200 cursor-pointer w-full flex justify-between"
              variant="outline"
              key={item.id}
              onClick={(e) => {
                e.preventDefault();
                onChange(item.id);
              }}
            >
              <ItemTitle>{searchedChar(query, item.name)}</ItemTitle>
              <ItemMedia>{currentValue === item.id && <Check />}</ItemMedia>
            </Item>
          ))
        ) : (
          <p>No units found</p>
        )}

        {/* Observer element for infinite loading */}
        <div ref={ref} className="h-4 flex items-center justify-center">
          {isFetchingNextPage && <p>Loading more...</p>}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SelectUnit;
