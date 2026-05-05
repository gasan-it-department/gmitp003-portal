// import React from "react";
// import { useInfiniteQuery } from "@tanstack/react-query";

// //
// import { inventroyReport } from "@/db/statements/supply";
//
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableHeader,
} from "@/components/ui/table";

//
import type { ProtectedRouteProps } from "@/interface/data";

interface Props {
  id: string | undefined;
  auth: ProtectedRouteProps;
  lineId: string;
}

const InventoryReport = ({}: Props) => {
  return (
    <div className="w-full h-full overflow-auto bg-white  border">
      <div className="min-w-[800px]">
        <Table>
          <TableHeader className="bg-gray-50 sticky top-0 z-10">
            <TableRow className="border-b">
              <TableHead className="font-semibold text-gray-700 text-xs w-20">
                Item No.
              </TableHead>
              <TableHead className="font-semibold text-gray-700 text-xs min-w-[200px]">
                Description
              </TableHead>
              <TableHead className="font-semibold text-gray-700 text-xs w-16">
                Unit
              </TableHead>

              {/* Insurance Section with nested headers */}
              <TableHead className="font-semibold text-gray-700 text-xs text-center p-0">
                <div className="border-b px-3 py-2">Insurance 2026</div>
                <div className="flex border-t">
                  <div className="w-16 px-2 py-1.5 text-center text-[10px] font-medium text-gray-500 border-r">
                    1st
                  </div>
                  <div className="w-16 px-2 py-1.5 text-center text-[10px] font-medium text-gray-500 border-r">
                    2nd
                  </div>
                  <div className="w-16 px-2 py-1.5 text-center text-[10px] font-medium text-gray-500 border-r">
                    3rd
                  </div>
                  <div className="w-16 px-2 py-1.5 text-center text-[10px] font-medium text-gray-500 border-r">
                    4th
                  </div>
                  <div className="w-16 px-2 py-1.5 text-center text-[10px] font-medium text-gray-500">
                    5th
                  </div>
                </div>
              </TableHead>

              <TableHead className="font-semibold text-gray-700 text-xs w-28 text-center">
                Balance Stock
              </TableHead>
              <TableHead className="font-semibold text-gray-700 text-xs w-28 text-center">
                Total Amount
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Empty state */}
            <TableRow>
              <TableCell colSpan={8} className="h-48 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    No inventory data available
                  </p>
                  <p className="text-xs text-gray-400">
                    Select a report to view details
                  </p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InventoryReport;
