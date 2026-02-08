import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import axios from "@/db/axios";
//
import { supplyTimeBaseReport } from "@/db/statement";
//
import { switchYearIndex } from "@/utils/helper";
//hooks and libs
import { useSearchParams } from "react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
//components
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import Modal from "@/components/custom/Modal";

import TimebaseFilter from "./TimebaseFilter";
import TimebasePrint from "./TimebasePrint";
//icons
import { Printer, FunnelPlus } from "lucide-react";

//interfaces, props and schema
import type {
  ProtectedRouteProps,
  TimebaseGroupPriceProps,
} from "@/interface/data";
import TimeBaseItem from "../items/TimeBaseItem";
import { toast } from "sonner";

interface Props {
  id: string | undefined;
  auth: ProtectedRouteProps;
  lineId: string;
}

interface ListProps {
  list: TimebaseGroupPriceProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

const Timebased = ({ id, auth, lineId }: Props) => {
  const [currentYear, setCurrentYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [onOpen, setOpen] = useState(0);

  console.log({ currentYear });

  const { ref, inView } = useInView({
    threshold: 0.5,
    delay: 100,
  });

  const [params, setParams] = useSearchParams({
    opt: "Quarterly",
    inTotal: "yes",
  });

  const rangeYear = switchYearIndex(currentYear);

  const option = params.get("opt") || "Quarterly";
  const inTotal = params.get("inTotal") || "no";

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      {
        replace: true,
      },
    );
  };

  const {
    data,
    isFetchingNextPage,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetching,
  } = useInfiniteQuery<ListProps>({
    queryFn: ({ pageParam }) =>
      supplyTimeBaseReport(
        auth.token as string,
        id as string,
        pageParam as string | null,
        "20",
        currentYear,
      ),
    queryKey: ["timebase", id],
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
  });

  const handleDownloadExcelFile = async () => {
    try {
      const response = await axios.get("/supply/excel", {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        responseType: "blob",
        params: {
          id,
          yearRange: currentYear,
          lineId: lineId,
          category: true,
        },
      });

      if (response.status !== 200) {
        return toast.error("FAILED TO SUBMIT", {
          description: "Try again",
        });
      }

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = `${new Date().toISOString()}.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download started!", {
        description: "Your Excel file is being downloaded.",
      });
      return;
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download Failed", {
        description: "Failed to download the file. Please try again.",
      });
    } finally {
      return;
    }
  };

  const handleExport = async () => {
    handleDownloadExcelFile();
  };

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, isFetching, fetchNextPage]);

  useEffect(() => {
    refetch();
  }, [currentYear]);

  const allItems = data?.pages?.flatMap((page) => page.list) || [];

  return (
    <div className="w-full h-full">
      <TooltipProvider>
        <div className="w-full p-4 border-b bg-white">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpen(1)}
                  className="h-9 px-3"
                >
                  <FunnelPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Filter</TooltipContent>
            </Tooltip>

            <Button size="sm" onClick={() => setOpen(2)} className="h-9 px-3">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-auto h-[calc(100%-68px)]">
          <Table>
            <TableHeader className="bg-gray-100 sticky top-0">
              <TableRow>
                <TableHead className="w-12 text-center">No.</TableHead>
                <TableHead className="min-w-48">Item</TableHead>
                {rangeYear.length === 2 ? (
                  <TableHead className="text-center">2nd half</TableHead>
                ) : (
                  <TableHead className="text-center">1st half</TableHead>
                )}

                <TableHead className="text-center">Unit Cost</TableHead>
                {rangeYear.length === 1 ? (
                  <TableHead className="text-center">2nd half</TableHead>
                ) : (
                  <TableHead className="text-center">1st half</TableHead>
                )}

                <TableHead className="text-center">Unit Cost</TableHead>
                <TableHead className="text-center">TOTAL QTY.</TableHead>
                <TableHead className="text-center">
                  <div>Insurance</div>
                  <div className="flex justify-center gap-6 text-xs mt-1">
                    <span>
                      {rangeYear.length === 2 ? 2 : 1}{" "}
                      {rangeYear.length === 2 &&
                        `(${rangeYear[0].toString().slice(-2)})`}
                    </span>
                    <span>
                      {rangeYear.length === 1 ? 2 : 1}{" "}
                      {rangeYear.length === 2 &&
                        `(${rangeYear[1].toString().slice(-2)})`}
                    </span>
                  </div>
                </TableHead>
                <TableHead className="text-center">TOTAL Ins.</TableHead>
                <TableHead className="text-center">
                  Balance (quantity)
                </TableHead>
                <TableHead className="text-center">Balance (amount)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching && !data ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    Loading initial data...
                  </TableCell>
                </TableRow>
              ) : allItems.length > 0 ? (
                <>
                  {allItems.map((item, i) => (
                    <TimeBaseItem
                      key={item.id}
                      item={item}
                      index={i}
                      rangeYear={rangeYear}
                    />
                  ))}

                  {isFetchingNextPage && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-4">
                        Loading more items...
                      </TableCell>
                    </TableRow>
                  )}

                  <TableRow ref={ref}>
                    <TableCell colSpan={11} className="h-4 p-0">
                      {hasNextPage && !isFetchingNextPage && (
                        <div className="h-1 w-full"></div>
                      )}
                    </TableCell>
                  </TableRow>

                  {!hasNextPage && allItems.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-4">
                        No more items to load
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12">
                    No Data found!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>

      <Modal
        title={"Filter"}
        children={
          <TimebaseFilter
            currentYear={currentYear}
            setCurrentYear={setCurrentYear}
          />
        }
        onOpen={onOpen === 1}
        className="max-w-md"
        setOnOpen={() => setOpen(0)}
        yesTitle="Refine"
        footer={true}
      />

      <Modal
        title={"Export Data"}
        children={
          <TimebasePrint
            setOpen={setOpen}
            id={id}
            lineId={lineId}
            token={auth.token as string}
          />
        }
        onOpen={onOpen === 2}
        className="max-w-2xl max-h-[90vh]"
        setOnOpen={() => setOpen(0)}
        footer={1}
        onFunction={handleExport}
      />
    </div>
  );
};

export default Timebased;
