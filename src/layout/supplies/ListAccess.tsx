import {
  Table,
  TableBody,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

//
import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { useInfiniteQuery } from "@tanstack/react-query";

//
import { accessUserList } from "@/db/statement";
//
import { UserRoundPlus } from "lucide-react";
import type { SupplyBatchAccessProps } from "@/interface/data";

//
interface Props {
  listId: string;
  token: string | undefined;
}

interface ListProps {
  list: SupplyBatchAccessProps[];
  lastCursor: string | null;
  hasMore: true;
}
const ListAccess = ({ token, listId }: Props) => {
  const [text, setText] = useState("");
  const [] = useState(false);
  const [query] = useDebounce(text, 1000);

  const { data, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery<ListProps>({
      queryFn: ({ pageParam }) =>
        accessUserList(token as string, query, pageParam, "20", listId),
      queryKey: ["listAccess", listId],
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.lastCursor,
    });

  useEffect(() => {
    refetch();
  }, [query, refetch]);
  return (
    <div className=" w-full h-full">
      <div className=" w-full py-2">
        <Input
          placeholder=" Search User"
          className=" lg:w-1/2"
          onChange={(e) => setText(e.target.value)}
          value={text}
        />
      </div>
      <Table>
        <TableHeader>
          <TableHead>No.</TableHead>
          <TableHead>Username</TableHead>
        </TableHeader>
        <TableBody>
          {data ? (
            data.pages.flatMap((item) => item.list).length > 0 ? (
              data.pages
                .flatMap((item) => item.list)
                .map((item, i) => (
                  <TableRow>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{item.user.username}</TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className=" text-center">
                  No data found!
                </TableCell>
              </TableRow>
            )
          ) : (
            <TableRow>
              <TableCell colSpan={2} className=" text-center">
                Something went wrong!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ListAccess;
