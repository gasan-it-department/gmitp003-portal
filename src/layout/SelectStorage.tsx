import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { useInView } from "react-intersection-observer";
//
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Item, ItemTitle, ItemMedia } from "@/components/ui/item";
//
import { searchedChar } from "@/utils/element";
//
import { storageList } from "@/db/statement";
//
import { Check, Search } from "lucide-react";
//
import type { MedicineStorage } from "@/interface/data";

interface ListProps {
  list: MedicineStorage[];
  hasMore: boolean;
  lastCursor: string | null;
}

interface Props {
  lineId: string;
  token: string;
  onChange: (...event: any[]) => void;
  currentValue: string;
}

const SelectStorage = ({ lineId, token, onChange, currentValue }: Props) => {
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);

  const { ref, inView } = useInView();

  const {
    data,
    isFetchingNextPage,
    fetchNextPage,
    isFetching,
    hasNextPage,
    refetch,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["storage-list", lineId],
    queryFn: ({ pageParam }) =>
      storageList(token, lineId, pageParam as string | null, "10", query),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

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
            placeholder="Search Storage"
            value={text}
          />
        </InputGroup>
      </div>

      <ScrollArea className="flex flex-col max-h-40 overflow-auto">
        {isFetching && !isFetchingNextPage ? (
          <p>Loading...</p>
        ) : allItems.length > 0 ? (
          allItems.map((item) => (
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

export default SelectStorage;
