import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { formatDate } from "@/utils/date";
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
  Package,
  User,
  Building,
  Calendar,
  Box,
  Hash,
  ClipboardList,
} from "lucide-react";
//statements
import { supplyDispenseTransactionInfo } from "@/db/statements/supply";
//
import { Button } from "@/components/ui/button";
//interface/schema/types
import type { SupplyDispenseRecordProps } from "@/interface/data";

const DispenseRecordData = () => {
  const { transactionId } = useParams();
  const { token } = useAuth();

  const { data, isLoading, error } = useQuery<SupplyDispenseRecordProps>({
    queryKey: ["supply-dispense-transaction-info", transactionId],
    queryFn: () =>
      supplyDispenseTransactionInfo(token as string, transactionId as string),
    enabled: !!transactionId && !!token,
  });

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Transaction</CardTitle>
            <CardDescription>
              Unable to load the dispense record details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispense Record</h1>
          <p className="text-muted-foreground">
            Transaction ID: <span className="font-mono text-sm">{data.id}</span>
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {data.quantity} units dispensed
        </Badge>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supply Item Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Supply Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.supply && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Item Name
                    </p>
                    <p className="text-lg font-semibold">
                      {data.supply?.supply.item || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Reference Code
                    </p>
                    <p className="text-lg font-mono">
                      {data.supply.supply.code || "N/A"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Transaction Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Quantity Dispensed
                  </p>
                  <p className="text-2xl font-bold">{data.quantity}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Remarks
                  </p>
                  <p className="text-base">
                    {data.remarks || "No remarks provided"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Stock Track ID
                </p>
                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                  {data.supplyStockTrackId}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Batch & Container Info */}
          {(data.list || data.container) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  Batch & Container
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.list && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Batch
                      </p>
                      {/* <p className="text-lg">{data.list.batchNumber || "N/A"}</p> */}
                    </div>
                  )}
                  {data.container && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Container
                      </p>
                      {/* <p className="text-lg">{data.container || "N/A"}</p> */}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - People & Metadata */}
        <div className="space-y-6">
          {/* People Involved */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                People Involved
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.user && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Requested By
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{data.user.firstName}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.user.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {data.dispensary && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Dispensed By
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{data.dispensary.firstName}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.dispensary.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {data.unit && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Department
                  </p>
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <p className="font-medium">{data.unit.name}</p>
                  </div>
                </div>
              )}
              {data.user && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    User
                  </p>
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <p className="font-medium">
                      {data.user.lastName}, {data.user.lastName}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Transaction Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Transaction Date
                </p>
                <p className="text-base">{formatDate(data.timestamp)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Transaction ID
                </p>
                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm break-all">
                  {data.id}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Information */}
      {data.supply && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Stock Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Current Stock
                </p>
                <p className="text-lg font-semibold">
                  {data.supply.stock || "N/A"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <Badge
                  variant={
                    data.supply.stock && data.supply.stock > 0
                      ? "default"
                      : "destructive"
                  }
                >
                  {data.supply.stock && data.supply.stock > 0
                    ? "In Stock"
                    : "Out of Stock"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DispenseRecordData;
