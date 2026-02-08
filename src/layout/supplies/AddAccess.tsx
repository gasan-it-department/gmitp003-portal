//
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useDebounce } from "use-debounce";
//
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

//
import { searchUser } from "@/db/statement";
import type { User } from "@/interface/data";
import { useState, useEffect } from "react";

//
interface Props {
  list: User[];
  lastCursor: string | null;
  hasMore: boolean;
}

const AddAccess = () => {
  const auth = useAuth();
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);

  const { data, refetch } = useInfiniteQuery<Props>({
    queryFn: ({ pageParam }) =>
      searchUser(auth.token as string, query, pageParam as string | null, "20"),
    queryKey: [""],
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
  });

  useEffect(() => {
    refetch();
  }, [query]);
  return (
    <div className=" w-full h-full">
      <div className=" w-full p-2 bg-white">
        <Input
          placeholder="Search "
          className=" lg:w-1/2 border border-neutral-400"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <Table>
        <TableHeader className=" border bg-neutral-700">
          <TableHead className=" text-white">No.</TableHead>
          <TableHead className=" text-white">Fullname</TableHead>
          <TableHead className=" text-white">Email</TableHead>
          <TableHead className=" text-white">Unit</TableHead>
        </TableHeader>
        <TableBody>
          {data ? (
            data.pages.flatMap((item) => item.list).length > 0 ? (
              data.pages
                .flatMap((item) => item.list)
                .map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      {item.lastName}, {item.firstName}
                    </TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.department?.name ?? "N/A"}</TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className=" text-center">
                  Search someone
                </TableCell>
              </TableRow>
            )
          ) : (
            <TableRow>
              <TableCell colSpan={4} className=" text-center">
                Search someone
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AddAccess;
