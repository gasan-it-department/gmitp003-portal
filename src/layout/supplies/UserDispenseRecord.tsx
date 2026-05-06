import { useEffect, useState } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams } from "react-router";
import axios from "@/db/axios";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  User,
  Download,
  Package,
  Building,
  Award,
  AlertCircle,
  History,
  Mail,
  Calendar,
} from "lucide-react";

//statements
import { supplyUserDispenseRecord } from "@/db/statements/supply";
import { getUserInfo } from "@/db/statement";
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
import { toast } from "sonner";
//
import type {
  SupplyDispenseRecordProps,
  User as UserProps,
} from "@/interface/data";
import DispenseTransactionItem from "./items/DispenseTransactionItem";
import { Input } from "@/components/ui/input";

interface ListProps {
  list: SupplyDispenseRecordProps[];
  lastCursor: string | null;
  hasMore: boolean;
}

const UserDispenseRecord = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { userRecipientId } = useParams();
  const auth = useAuth();
  const { ref, inView } = useInView();

  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useQuery<UserProps>({
    queryKey: ["unit-info", userRecipientId],
    queryFn: () => getUserInfo(auth.token as string, userRecipientId as string),
    enabled: !!userRecipientId && !!auth.token,
  });

  const { data, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery<ListProps>({
      queryKey: ["supply-user-dispense-record", userRecipientId],
      queryFn: ({ pageParam }) =>
        supplyUserDispenseRecord(
          auth.token as string,
          userRecipientId,
          pageParam as string,
          "20",
          "",
        ),
      initialPageParam: null,
      getNextPageParam: (lastPage) => {
        return lastPage.hasMore ? lastPage.lastCursor : undefined;
      },
      enabled: !!userRecipientId && !!auth.token,
    });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    refetch();
  }, [selectedDate]);

  const getUserFullName = () => {
    if (!userData) return "Loading...";
    const nameParts = [
      userData.firstName,
      userData.middleName,
      userData.lastName,
      userData.suffix,
    ].filter(Boolean);
    return nameParts.join(" ");
  };

  const handleCheckItem = (id: string) => {
    if (selectedItems.includes(id)) return true;
    return false;
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems((prevSelected) => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter((itemId) => itemId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  const handleDownloadExcelFile = async () => {
    try {
      const response = await axios.post(
        "/supply/excel-ris",
        { id: userRecipientId, itemIds: selectedItems },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          responseType: "blob",
        },
      );

      if (response.status !== 200) {
        return toast.error("FAILED TO SUBMIT", {
          description: "Try again",
        });
      }

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

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download started!", {
        description: "Your Excel file is being downloaded.",
      });
      return;
    } catch (error) {
      console.log(error);
      toast.error("Download Failed", {
        description: "Failed to download the file. Please try again.",
      });
    } finally {
      return;
    }
  };

  const totalItems = data?.pages?.flatMap((page) => page.list) || [];
  const totalQuantity = totalItems.reduce(
    (sum, item) => sum + parseInt(item.quantity || "0"),
    0,
  );

  if (userLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-500">Loading dispense records...</p>
        </div>
      </div>
    );
  }

  if (userError || !userData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="border rounded-lg p-6 max-w-md w-full text-center bg-white">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Error Loading Records
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Unable to load dispense records for this user.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-4 space-y-4">
        {/* Header - Compact */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md">
              <History className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">
                Dispense Records
              </h1>
              <p className="text-xs text-gray-500">
                Transaction history for {getUserFullName()}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs px-3 py-1">
            Total: {totalQuantity} units
          </Badge>
        </div>

        <Separator className="my-2" />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Sidebar - Compact */}
          <div className="lg:col-span-1 space-y-3">
            {/* User Info Card */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">
                    User Information
                  </h3>
                </div>
              </div>
              <div className="p-4 text-center">
                <div className="h-14 w-14 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-7 w-7 text-blue-600" />
                </div>
                <h4 className="text-base font-semibold text-gray-900">
                  {getUserFullName()}
                </h4>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Mail className="h-3 w-3 text-gray-400" />
                  <p className="text-xs text-gray-500">{userData.username}</p>
                </div>
              </div>
            </div>

            {/* Export Card */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">
                    Export
                  </h3>
                </div>
              </div>
              <div className="p-4">
                <Button
                  disabled={selectedItems.length === 0}
                  variant="outline"
                  className="w-full gap-2 h-9 text-sm"
                  onClick={() => {
                    if (selectedItems.length === 0) return;
                    handleDownloadExcelFile();
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export RIS (CSV)
                </Button>
                <p className="text-[10px] text-gray-500 mt-2 text-center">
                  Select at least one item to export
                </p>
              </div>
            </div>

            {/* Department Info */}
            {userData.department && (
              <div className="border rounded-lg bg-white overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-800">
                      Department
                    </h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-900">
                    {userData.department.name}
                  </p>
                </div>
              </div>
            )}

            {/* Position Info */}

            {/* Salary Grade Info */}
            {userData.SalaryGrade && (
              <div className="border rounded-lg bg-white overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-800">
                      Salary Grade
                    </h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-900">
                    Grade {userData.SalaryGrade.grade}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Main Content - Dispense Records Table */}
          <div className="lg:col-span-3 space-y-4">
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-800">
                      Dispense Records
                    </h3>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {totalItems.length} record
                      {totalItems.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <Input
                      type="date"
                      className="h-7 text-xs w-auto"
                      onChange={(e) => setSelectedDate(e.target.value)}
                      placeholder="Filter by date"
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-auto">
                <div className="min-w-[700px]">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead className="text-xs">Date & Time</TableHead>
                        <TableHead className="text-xs">Supply Item</TableHead>
                        <TableHead className="text-xs text-center w-16">
                          Qty
                        </TableHead>
                        <TableHead className="text-xs">Dispensed By</TableHead>
                        <TableHead className="text-xs">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {totalItems.length > 0 ? (
                        <>
                          {totalItems.map((item) => (
                            <DispenseTransactionItem
                              key={item.id}
                              item={item}
                              ref={ref}
                              multiSelect={true}
                              handleCheckItem={handleCheckItem}
                              handleSelectItem={handleSelectItem}
                            />
                          ))}
                          {/* Infinite scroll trigger */}
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-3">
                              {isFetchingNextPage ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  <span className="text-xs text-gray-500">
                                    Loading more...
                                  </span>
                                </div>
                              ) : hasNextPage ? (
                                <span
                                  ref={ref}
                                  className="text-xs text-gray-400"
                                >
                                  Scroll to load more
                                </span>
                              ) : totalItems.length > 0 ? (
                                <span className="text-xs text-gray-400">
                                  No more records
                                </span>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        </>
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Package className="h-10 w-10 text-gray-300" />
                              <p className="text-sm text-gray-500">
                                No dispense records found
                              </p>
                              <p className="text-xs text-gray-400">
                                This user hasn't received any supplies yet.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Summary Stats - Compact */}
            {totalItems.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="border rounded-lg p-3 text-center bg-white">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Transactions
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {totalItems.length}
                  </p>
                </div>
                <div className="border rounded-lg p-3 text-center bg-white">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Total Qty
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {totalQuantity}
                  </p>
                </div>
                <div className="border rounded-lg p-3 text-center bg-white">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Items
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {new Set(totalItems.map((item) => item.suppliesId)).size}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDispenseRecord;
