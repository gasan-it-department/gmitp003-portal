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
  Download,
  Package,
  Building,
  Award,
  Briefcase,
  AlertCircle,
  Mail,
} from "lucide-react";
import { formatDate } from "@/utils/date";

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
          ""
        ),
      initialPageParam: null,
      getNextPageParam: (lastPage) => {
        return lastPage.hasMore ? lastPage.lastCursor : undefined;
      },
      enabled: !!userRecipientId && !!auth.token,
    });

  // Infinite scroll effect
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

  const getUserStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUserLevelLabel = (level: number) => {
    switch (level) {
      case 0:
        return "User";
      case 1:
        return "Supervisor";
      case 2:
        return "Admin";
      case 3:
        return "System Admin";
      default:
        return `Level ${level}`;
    }
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
        }
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
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
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
  console.log({ date: selectedDate && new Date(selectedDate).toISOString() });

  const totalItems = data?.pages?.flatMap((page) => page.list) || [];
  const totalQuantity = totalItems.reduce(
    (sum, item) => sum + parseInt(item.quantity || "0"),
    0
  );

  if (userLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userError || !userData) {
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
              User ID: {userRecipientId}
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
            User Dispense Records
          </h1>
          <p className="text-muted-foreground">
            Transaction history for {getUserFullName()}
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
                  <CardTitle className="text-xl">{getUserFullName()}</CardTitle>
                  <CardDescription className="flex items-center justify-center gap-1 mt-1">
                    <Mail className="h-3 w-3" />
                    {userData.email}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={getUserStatusColor(userData.status)}>
                    {userData.status || "Unknown"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Access Level
                  </span>
                  <Badge variant="secondary">
                    {getUserLevelLabel(userData.level)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Username
                  </span>
                  <span className="font-medium">{userData.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Member Since
                  </span>
                  <span className="font-medium">
                    {formatDate(userData.createdAt)}
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
          </Card>

          {/* Department Info */}
          {userData.department && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{userData.department.name}</p>
                  {/* <p className="text-sm text-muted-foreground">
                    Code: {userData.department.code || "N/A"}
                  </p> */}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Position Info */}
          {userData.Position && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Position
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* <p className="font-medium">{userData.Position.title}</p> */}
                  {/* <p className="text-sm text-muted-foreground">
                    Level: {userData.Position.level}
                  </p> */}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Salary Grade Info */}
          {userData.SalaryGrade && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Salary Grade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">
                    Grade {userData.SalaryGrade.grade}
                  </p>
                  {/* <p className="text-sm text-muted-foreground">
                    Step: {userData.SalaryGrade.step}
                  </p> */}
                </div>
              </CardContent>
            </Card>
          )}
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
              <div className="rounded-md border py-2">
                <Input
                  className=" w-1/3 ml-2"
                  type="date"
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                  }}
                />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Select</TableHead>
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
                            multiSelect={true}
                            handleCheckItem={handleCheckItem}
                            handleSelectItem={handleSelectItem}
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

export default UserDispenseRecord;
