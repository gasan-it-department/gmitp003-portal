import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams } from "react-router";
import { useDebounce } from "use-debounce";
import { useInView } from "react-intersection-observer";
//db and statements
import { prescriptionList } from "@/db/statement";

//components and layout
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { toast } from "sonner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import SWWItem from "@/layout/item/SWWItem";
import { Spinner } from "@/components/ui/spinner";
import PrescriptionItem from "@/layout/medicine/item/PrescriptionItem";

//
import { Search, CalendarDays } from "lucide-react";

//
import type { Prescription } from "@/interface/data";

interface ListProps {
  list: Prescription[];
  lastCursor: string | null;
  hasMore: boolean;
}

const Prescriptions = () => {
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);
  const { lineId } = useParams();
  const auth = useAuth();
  const { ref, inView } = useInView();

  const {
    isFetching,
    data,
    fetchNextPage,
    refetch,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["prescription", lineId],
    queryFn: ({ pageParam }) =>
      prescriptionList(
        auth.token as string,
        lineId,
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

  useEffect(() => {
    if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage().catch((error) => {
        toast.error("Failed to load more items", {
          description: `${error.message || "Something went wrong."} `,
          closeButton: false,
        });
      });
    }
  }, [inView, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

  const allMedicines = data?.pages.flatMap((page) => page.list) || [];
  const totalCount = allMedicines.length;

  return (
    <div className=" w-full h-full relative overflow-auto">
      <div className=" w-full px-2 h-[10%] bg-white flex items-center sticky top-0 z-50 gap-2">
        <InputGroup className=" lg:w-1/3 ">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            className=""
            placeholder="Search Ref. #/ Last name/ First name"
            onChange={(e) => setText(e.target.value)}
          />
        </InputGroup>

        <InputGroup className=" w-auto ">
          <InputGroupAddon>
            <CalendarDays />
          </InputGroupAddon>
          <InputGroupInput
            className=""
            type="date"
            placeholder="Search Ref. #/ Last name/ First name"
            onChange={(e) => setText(e.target.value)}
          />
        </InputGroup>
      </div>
      <ScrollArea className=" w-full h-[90%] overflow-auto">
        <Table className=" w-full h-[90%] ">
          <TableHeader className="border bg-neutral-700">
            <TableHead className="text-white">No</TableHead>
            <TableHead className="text-white">Ref. #</TableHead>
            <TableHead className="text-white">Last name</TableHead>
            <TableHead className="text-white">First name</TableHead>
            <TableHead className="text-white">Date Recieved</TableHead>
            <TableHead className="text-white">Status</TableHead>
          </TableHeader>

          <TableBody>
            {isFetching || isFetchingNextPage ? (
              <TableRow>
                <TableCell colSpan={6} className="w-full flex items-center">
                  <div className="flex gap-2 items-center">
                    <Spinner /> Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : data ? (
              data.pages.flatMap((item) => item.list).length > 0 ? (
                data.pages
                  .flatMap((item) => item.list)
                  .map((item, i) => (
                    <PrescriptionItem
                      key={item.id}
                      item={item}
                      no={i}
                      query={query}
                    />
                  ))
              ) : (
                <TableRow>
                  <TableCell className=" text-center" colSpan={6}>
                    No Prescription found!
                  </TableCell>
                </TableRow>
              )
            ) : (
              <SWWItem colSpan={6} />
            )}
            <TableRow ref={ref}>
              <TableCell colSpan={6} className="text-center py-4">
                {isFetchingNextPage && <p>Loading more...</p>}
                {!hasNextPage && totalCount > 0 && <p>All items loaded</p>}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default Prescriptions;
