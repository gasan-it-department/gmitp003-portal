import { useInfiniteQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/provider/AdminRouter";
import { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useSearchParams } from "react-router";
//
import { getAccounts } from "@/db/statement";
import type { AccountProps } from "@/interface/data";

//
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
import { Input } from "@/components/ui/input";
//
interface LoadProps {
  list: AccountProps[];
  lastCursor: string | null;
  hasMore: boolean;
}

const Account = () => {
  const [onOpen, setOnOpen] = useState(0);
  const [typing, setTyping] = useState(false);
  const [params, setParams] = useSearchParams({ query: "" });
  const admin = useAdminAuth();

  const currentQuery = params.get("query") || "";

  const { data, isFetchingNextPage, isFetching, refetch } =
    useInfiniteQuery<LoadProps>({
      queryFn: ({ pageParam }) =>
        getAccounts(admin.token, pageParam as string | null, 20, currentQuery),
      queryKey: ["account"],
      getNextPageParam: (lastPage) => lastPage.lastCursor,
      initialPageParam: null,
    });

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      {
        replace: true,
      }
    );
  };

  const debounced = useDebouncedCallback(
    // function
    (value) => {
      handleChangeParams("query", value);
    },
    // delay in ms
    1000
  );

  useEffect(() => {
    refetch();
  }, [currentQuery]);

  return (
    <div className=" w-full h-full">
      <div className=" w-full p-1 flex justify-end">
        <div className=" lg:w-1/4">
          <Input
            placeholder="Search Account"
            type="text"
            onChange={(e) => debounced(e.target.value)}
          />
        </div>
      </div>
      <Table>
        <TableHeader className=" border bg-neutral-700">
          <TableHead className=" text-white">No.</TableHead>
          <TableHead className=" text-white">Username</TableHead>
          <TableHead className=" text-white">First name</TableHead>
          <TableHead className=" text-white">Last name</TableHead>
          <TableHead className=" text-white">Email</TableHead>
        </TableHeader>
        <TableBody>
          {isFetchingNextPage || isFetching ? (
            <TableRow>
              <TableCell colSpan={5} className=" text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : data ? (
            data.pages
              .flatMap((item) => item.list)
              .map((item, i) => (
                <TableRow key={item.id} className=" cursor-pointer">
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{item.username}</TableCell>
                  <TableCell>
                    {item.User ? item.User.firstName : "N/A"}
                  </TableCell>
                  <TableCell>
                    {item.User ? item.User.lastName : "N/A"}
                  </TableCell>
                  <TableCell>{item.User ? item.User.email : "N/A"}</TableCell>
                </TableRow>
              ))
          ) : (
            <TableRow className=" text-center">
              <TableCell colSpan={5}>No Data found!</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Modal
        title={""}
        children={<div></div>}
        onOpen={onOpen === 1}
        className={" min-w-2/4"}
        setOnOpen={() => setOnOpen(0)}
      />
    </div>
  );
};

export default Account;
