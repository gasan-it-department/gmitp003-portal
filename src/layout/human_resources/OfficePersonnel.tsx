import React from "react";

//
import { useInfiniteQuery } from "@tanstack/react-query";

//
import { getAllOfficePersonnel } from "@/db/statement";

//components and layout
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";

//hooks and libs
import { useAuth } from "@/provider/ProtectedRoute";
import type { User } from "@/interface/data";

//
interface Props {}
const OfficePersonnel = () => {
  const { token } = useAuth();
  const { data, isFetching } = useInfiniteQuery<{
    list: User[];
    lastCursor: string | null;
    hasMore: boolean;
  }>({
    queryKey: ["office"],
    queryFn: ({ pageParam }) =>
      getAllOfficePersonnel("om", token as string, pageParam as string | null),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
  });

  return (
    <div className=" w-full h-full">
      <Table>
        <TableHeader className=" border bg-neutral-700">
          <TableHead className=" text-white">No.</TableHead>
          <TableHead className=" text-white">Lastname</TableHead>
          <TableHead className=" text-white">Firstname</TableHead>
          <TableHead className=" text-white">Middle</TableHead>
          <TableHead className=" text-white">Suffix</TableHead>
          <TableHead className=" text-white">Email</TableHead>
          <TableHead className=" text-white">Position</TableHead>
          <TableHead className=" text-white">SG</TableHead>
        </TableHeader>
        <TableBody></TableBody>
      </Table>
    </div>
  );
};

export default OfficePersonnel;
