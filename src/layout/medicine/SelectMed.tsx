import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
//
import { searchedChar } from "@/utils/element";
//
import { medicineList } from "@/db/statement";
//
import { Table } from "@/components/ui/table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Item,
  ItemContent,
  ItemFooter,
  ItemHeader,
  ItemMedia,
} from "@/components/ui/item";
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
        query
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

  useEffect(() => {
    refetch();
  }, [query]);

  return (
    <ScrollArea className=" w-full h-full overflow-auto flex flex-col gap-2 px-2">
      <div className=" w-full sticky top-0 bg-white">
        <p className=" font-medium text-lg">Select Medicines</p>
        <InputGroup className=" mt-4">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder=" Search item"
            onChange={(e) => setText(e.target.value)}
          />
        </InputGroup>
      </div>
      {isFetchingNextPage || isFetching ? (
        <Item>
          <ItemMedia>
            <Spinner />
          </ItemMedia>
          <ItemContent>Loading...</ItemContent>
        </Item>
      ) : data ? (
        data.pages.flatMap((item) => item.list).length > 0 ? (
          data.pages
            .flatMap((item) => item.list)
            .map((item, i) => (
              <Item
                onClick={() => onChange(item)}
                key={item.id}
                variant="outline"
                className=" bg-white  mt-2 hover:border-neutral-500 cursor-pointer"
              >
                <ItemMedia>{i + 1}.</ItemMedia>
                <ItemContent className=" text-neutral-800">
                  <p> {searchedChar(query, item.name)}</p>
                  <p className=" text-sm">
                    {searchedChar(query, item.serialNumber)}
                  </p>
                </ItemContent>
                <ItemMedia>
                  {value && value.id === item.id && <Check />}
                </ItemMedia>
              </Item>
            ))
        ) : (
          <Item>
            <ItemMedia>
              <Ban />
            </ItemMedia>
            <ItemContent>No Item Found!</ItemContent>
          </Item>
        )
      ) : null}
    </ScrollArea>
  );
};

export default SelectMed;
