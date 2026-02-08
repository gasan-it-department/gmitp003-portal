import { useEffect, useState } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams } from "react-router";
import axios from "@/db/axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  User,
  Mail,
  Package,
  AlertCircle,
  Download,
} from "lucide-react";
import { formatDate } from "@/utils/date";

//statements
import { supplyUnitDispenseRecord } from "@/db/statements/supply";
import { getUnitInfo } from "@/db/statement";
//
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
//
import type { SupplyDispenseRecordProps, Department } from "@/interface/data";
import DispenseTransactionItem from "./items/DispenseTransactionItem";

interface ListProps {
  list: SupplyDispenseRecordProps[];
  lastCursor: string | null;
  hasMore: boolean;
}

const UnitDispenseRecord = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { unitRecipientId } = useParams();
  const auth = useAuth();
  const { ref, inView } = useInView();

  const {
    data: unitData,
    isLoading: userLoading,
    error: userError,
  } = useQuery<Department>({
    queryKey: ["unit-info", unitRecipientId],
    queryFn: () => getUnitInfo(auth.token as string, unitRecipientId as string),
    enabled: !!unitRecipientId && !!auth.token,
  });

  const { data, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery<ListProps>({
      queryKey: ["supply-user-dispense-record", unitRecipientId],
      queryFn: ({ pageParam }) =>
        supplyUnitDispenseRecord(
          auth.token as string,
          unitRecipientId,
          pageParam as string,
          "20",
          "",
        ),
      initialPageParam: null,
      getNextPageParam: (lastPage) => {
        return lastPage.hasMore ? lastPage.lastCursor : undefined;
      },
      enabled: !!unitRecipientId && !!auth.token,
    });

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
        "/supply/excel-ris/unit",
        { id: unitRecipientId, itemIds: selectedItems },
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
      console.log(error);

      toast.error("Download Failed", {
        description: "Failed to download the file. Please try again.",
      });
    } finally {
      return;
    }
  };

  // Infinite scroll effect
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const totalItems = data?.pages?.flatMap((page) => page.list) || [];
  const totalQuantity = totalItems.reduce(
    (sum, item) => sum + parseInt(item.quantity || "0"),
    0,
  );

  if (userLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userError || !unitData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error Loading User
            </CardTitle>
            <CardDescription>Unable to load user information.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              User ID: {unitRecipientId}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 md:p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Unit Dispense Records
          </h1>
          <p className="text-muted-foreground">
            Transaction history for {unitData.name}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          Total Dispensed: {totalQuantity} units
        </Badge>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* User Profile Card - Left Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{unitData.name}</CardTitle>
                  <CardDescription className="flex items-center justify-center gap-1 mt-1">
                    <Mail className="h-3 w-3" />
                    {unitData.email || "N/A"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Section Chief/Depart. Head
                  </span>
                  <span className="font-medium">
                    {unitData.head && unitData.head.lastName},{" "}
                    {unitData.head && unitData.head.firstName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Member Since
                  </span>
                  <span className="font-medium">
                    {formatDate(unitData.createdAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                disabled={selectedItems.length === 0}
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (selectedItems.length === 0) return;
                  handleDownloadExcelFile();
                }}
              >
                RIS (CSV)
              </Button>
            </CardContent>
            <CardDescription className=" px-2">
              To export RIS, select at least one item.
            </CardDescription>
          </Card>
        </div>

        {/* Dispense Records Table - Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Dispense Records
              </CardTitle>
              <CardDescription>
                {totalItems.length} transaction
                {totalItems.length !== 1 ? "s" : ""} recorded
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Supply Item</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Dispensed By</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Status</TableHead>
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
                            handleCheckItem={handleCheckItem}
                            handleSelectItem={handleSelectItem}
                            multiSelect={true}
                          />
                        ))}
                        {/* Infinite scroll trigger */}
                        <TableRow ref={ref}>
                          <TableCell colSpan={6} className="text-center py-4">
                            {isFetchingNextPage ? (
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading more records...
                              </div>
                            ) : hasNextPage ? (
                              <span className="text-sm text-muted-foreground">
                                Scroll to load more
                              </span>
                            ) : totalItems.length > 0 ? (
                              <span className="text-sm text-muted-foreground">
                                No more records to load
                              </span>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      </>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Package className="h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              No dispense records found
                            </p>
                            <p className="text-sm text-muted-foreground">
                              This user hasn't received any supplies yet.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          {totalItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Total Transactions
                    </p>
                    <p className="text-3xl font-bold">{totalItems.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Total Quantity
                    </p>
                    <p className="text-3xl font-bold">{totalQuantity}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Unique Items
                    </p>
                    <p className="text-3xl font-bold">
                      {new Set(totalItems.map((item) => item.suppliesId)).size}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnitDispenseRecord;
