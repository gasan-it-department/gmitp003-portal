import { useRef } from "react";

//hooks and libs
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
//
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableFooter,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
import AddPosition from "./AddPosition";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
//
import { getAllPostions } from "@/db/statement";
import type { Position } from "@/interface/data";
import { ArrowDownUp, Plus, Printer } from "lucide-react";

//props
interface Props {
  id: string;
  token: string;
}

interface LoadProps {
  list: Position[];
  lastCursor: string | null;
  hasMore: boolean;
}

const OfficePostion = ({ id, token }: Props) => {
  const [onOpen, setOnOpen] = useState(false);
  const { data, isFetching } = useInfiniteQuery<LoadProps>({
    queryKey: ["postions"],
    queryFn: ({ pageParam }) =>
      getAllPostions(id, token, pageParam as string | null),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
  });

  return (
    <div className=" w-full h-full">
      <div className=" w-full p-2 flex justify-end gap-2">
        <Button className=" text-sm" variant="outline" size="sm">
          <ArrowDownUp color="#292929" strokeWidth={1.5} />
          Sort SG
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOnOpen(true)}
          className=" text-sm"
        >
          <Plus color="#292929" strokeWidth={1.5} />
          Add
        </Button>
        <Button className=" text-sm" size="sm">
          <Printer strokeWidth={1.5} />
          Print
        </Button>
      </div>
      <Table>
        <TableHeader className=" border bg-neutral-700">
          <TableHead className=" text-white">No.</TableHead>
          <TableHead className=" text-white">Title</TableHead>
          <TableHead className=" text-white">Slot</TableHead>
          <TableHead className=" text-white">Open</TableHead>
          <TableHead className=" text-white">Salary Grade</TableHead>
          <TableHead className=" text-white">Status</TableHead>
          <TableHead className=" text-white">Application/s</TableHead>
        </TableHeader>
        {data?.pages ? (
          <TableBody>
            {data.pages
              .flatMap((page) => page.list)
              .map((item, i) => (
                <ContextMenu key={item.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow className=" hover:bg-white cursor-pointer">
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.description ?? "N/A"}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.name}</TableCell>
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-64">
                    <ContextMenuItem>Edit</ContextMenuItem>
                    <ContextMenuItem>Duplicate</ContextMenuItem>
                    <ContextMenuItem>Archive</ContextMenuItem>
                    <ContextMenuItem className="text-red-500">
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
          </TableBody>
        ) : (
          <TableBody>
            <TableRow>
              <TableCell className="text-center font-medium" colSpan={7}>
                No data found!
              </TableCell>
            </TableRow>
          </TableBody>
        )}
      </Table>
      <Modal
        title={"Add Position"}
        children={<AddPosition existed={false} />}
        onOpen={onOpen}
        className={" min-w-2xl max-h-5/6 overflow-auto"}
        setOnOpen={() => setOnOpen(false)}
      />
    </div>
  );
};

export default OfficePostion;
