//hooks and libs
import { useParams, useNavigate } from "react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
//
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
//stmt
import { inventoryAccessList } from "@/db/statement";

//icons
import { UserPlus } from "lucide-react";

//props
import { type ContainerAllowedUserProps } from "@/interface/data";
interface Props {
  lastCursor: string | null;
  hasMore: boolean;
  list: ContainerAllowedUserProps[];
}

const Accessibility = () => {
  const { containerId, lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();

  const { data, isFetchingNextPage, isFetching } = useInfiniteQuery<Props>({
    queryFn: ({ pageParam }) =>
      inventoryAccessList(
        auth.token as string,
        containerId as string,
        pageParam as string | null,
        "20"
      ),
    queryKey: ["accessiblity", containerId],
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
  });
  return (
    <div className=" w-full h-full">
      <div className=" w-full p-2 flex justify-end bg-white ">
        <Button
          size="sm"
          onClick={() =>
            nav(
              `/${lineId}/supplies/container/${containerId}/add-accessibility`
            )
          }
        >
          <UserPlus />
          Add
        </Button>
      </div>
      <div>
        <Table>
          <TableHeader>
            <TableHead>No.</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead></TableHead>
            <TableHead></TableHead>
          </TableHeader>
        </Table>
      </div>
    </div>
  );
};

export default Accessibility;
