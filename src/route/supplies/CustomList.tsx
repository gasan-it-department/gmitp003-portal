import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams, useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import {
  LayoutDashboard,
  ChartPie,
  ListOrdered,
  BadgeInfo,
  Package,
  ArrowLeftRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
//layout
import SuppliesOverview from "@/layout/supplies/SuppliesOverview";
import SupplyOther from "@/layout/supplies/SupplyOther";
import SupplyReport from "@/layout/supplies/SupplyReport";
import OrderList from "@/layout/supplies/OrderList";
import DispenseTransactions from "@/layout/supplies/DispenseTransactions";

const CustomList = () => {
  const [params, setParams] = useSearchParams({ tab: "overview" });
  const { listId, containerId, lineId } = useParams();
  const auth = useAuth();

  const currentTab = params.get("tab") || "overview";
  const prev = 3; // This should come from actual permissions

  const handleChangeParam = (value: string) => {
    setParams(
      (prev) => {
        prev.set("tab", value);
        return prev;
      },
      { replace: true }
    );
  };

  const getTabIcon = (tabName: string) => {
    switch (tabName) {
      case "overview":
        return <LayoutDashboard className="w-4 h-4" />;
      case "report":
        return <ChartPie className="w-4 h-4" />;
      case "orders":
        return <ListOrdered className="w-4 h-4" />;
      case "transactions":
        return <ArrowLeftRight className="w-4 h-4" />;
      case "other":
        return <BadgeInfo className="w-4 h-4" />;
      default:
        return <LayoutDashboard className="w-4 h-4" />;
    }
  };

  // const getTabTitle = (tabName: string) => {
  //   switch (tabName) {
  //     case "overview":
  //       return "Overview";
  //     case "report":
  //       return "Reports";
  //     case "orders":
  //       return "Orders";
  //     case "other":
  //       return "Other";
  //     default:
  //       return "Overview";
  //   }
  // };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header - Simplified */}
      <div className="bg-white border-b">
        <div className="px-6 py-5">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Supplies Management
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {containerId
                    ? `Container ID: ${containerId}`
                    : "No container selected"}{" "}
                  •{listId ? ` List ID: ${listId}` : " No list selected"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Tabs - More spacious */}
        <div className="hidden lg:block border-t">
          <Tabs
            value={currentTab}
            onValueChange={handleChangeParam}
            className="w-full"
          >
            <TabsList className="w-full justify-start h-14 bg-transparent px-6">
              <TabsTrigger
                value="overview"
                className="px-5 py-3.5 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:font-medium rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {getTabIcon("overview")}
                  <span>Overview</span>
                </div>
              </TabsTrigger>

              {prev >= 2 && (
                <TabsTrigger
                  value="report"
                  className="px-5 py-3.5 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:font-medium rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {getTabIcon("report")}
                    <span>Reports</span>
                  </div>
                </TabsTrigger>
              )}

              {prev >= 2 && (
                <TabsTrigger
                  value="orders"
                  className="px-5 py-3.5 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:font-medium rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {getTabIcon("orders")}
                    <span>Orders</span>
                  </div>
                </TabsTrigger>
              )}
              {prev >= 2 && (
                <TabsTrigger
                  value="transactions"
                  className="px-5 py-3.5 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:font-medium rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {getTabIcon("transactions")}
                    <span>Transactions</span>
                  </div>
                </TabsTrigger>
              )}

              {prev >= 3 && (
                <TabsTrigger
                  value="other"
                  className="px-5 py-3.5 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:font-medium rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {getTabIcon("other")}
                    <span>Other</span>
                  </div>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* Mobile Tabs - More spacious */}
        <div className="lg:hidden border-t">
          <Tabs value={currentTab} onValueChange={handleChangeParam}>
            <TabsList className="w-full grid grid-cols-4 h-16 px-2">
              <TabsTrigger value="overview" className="py-3">
                <div className="flex flex-col items-center gap-1">
                  {getTabIcon("overview")}
                  <span className="text-xs mt-1">Overview</span>
                </div>
              </TabsTrigger>

              {prev >= 2 && (
                <TabsTrigger value="report" className="py-3">
                  <div className="flex flex-col items-center gap-1">
                    {getTabIcon("report")}
                    <span className="text-xs mt-1">Reports</span>
                  </div>
                </TabsTrigger>
              )}

              {prev >= 2 && (
                <TabsTrigger value="orders" className="py-3">
                  <div className="flex flex-col items-center gap-1">
                    {getTabIcon("orders")}
                    <span className="text-xs mt-1">Orders</span>
                  </div>
                </TabsTrigger>
              )}
              {prev >= 2 && (
                <TabsTrigger value="orders" className="py-3">
                  <div className="flex flex-col items-center gap-1">
                    {getTabIcon("orders")}
                    <span className="text-xs mt-1">Transactions</span>
                  </div>
                </TabsTrigger>
              )}
              {prev >= 3 && (
                <TabsTrigger value="other" className="py-3">
                  <div className="flex flex-col items-center gap-1">
                    {getTabIcon("other")}
                    <span className="text-xs mt-1">Other</span>
                  </div>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content Area - More spacious */}
      <div className="flex-1 p-4 lg:p-6 bg-gray-50">
        <div className="max-w-full h-full">
          <Tabs
            value={currentTab}
            onValueChange={handleChangeParam}
            className="h-full"
          >
            {/* Tab Content - Clean and spacious */}
            <TabsContent value="overview" className="h-full m-0">
              <Card className="h-full shadow border">
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">
                      Supplies Overview
                    </h2>
                    <p className="text-gray-500">
                      View and manage all supplies in this list
                    </p>
                  </div>
                  <div className="h-[calc(100%-80px)]">
                    <SuppliesOverview />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {prev >= 2 && (
              <TabsContent value="report" className="h-full m-0">
                <Card className="h-full shadow border">
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">
                        Supply Reports
                      </h2>
                      <p className="text-gray-500">
                        Generate and view supply reports and analytics
                      </p>
                    </div>
                    <div className="h-[calc(100%-80px)]">
                      <SupplyReport />
                    </div>
                  </div>
                </Card>
              </TabsContent>
            )}

            {prev >= 2 && (
              <TabsContent value="orders" className="h-full m-0">
                <Card className="h-full shadow border">
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">
                        Orders Management
                      </h2>
                      <p className="text-gray-500">
                        Manage supply orders and track their status
                      </p>
                    </div>
                    <div className="h-[calc(100%-80px)]">
                      <OrderList
                        auth={auth}
                        containerId={containerId}
                        listId={listId}
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>
            )}

            {prev >= 2 && (
              <TabsContent value="transactions" className="h-full m-0">
                <Card className="h-full shadow border">
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">
                        Orders Management
                      </h2>
                      <p className="text-gray-500">Track supply transactions</p>
                    </div>
                    <div className="h-[calc(100%-80px)]">
                      <DispenseTransactions
                        listId={listId as string}
                        token={auth.token as string}
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>
            )}

            {prev >= 3 && (
              <TabsContent value="other" className="h-full m-0">
                <Card className="h-full shadow border">
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">
                        Other Operations
                      </h2>
                      <p className="text-gray-500">
                        Additional supply management operations and settings
                      </p>
                    </div>
                    <div className="h-[calc(100%-80px)]">
                      <SupplyOther
                        listId={listId}
                        token={auth.token}
                        userId={auth.userId as string}
                        lineId={lineId as string}
                        containerId={containerId as string}
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CustomList;
