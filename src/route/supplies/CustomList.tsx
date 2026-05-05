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
  const prev = 3;

  const handleChangeParam = (value: string) => {
    setParams(
      (prev) => {
        prev.set("tab", value);
        return prev;
      },
      { replace: true },
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

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Header - Mobile Responsive */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-3 sm:py-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
                Supplies Management
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                {containerId
                  ? `Container: ${containerId.slice(0, 8)}...`
                  : "No container"}{" "}
                •{listId ? ` List: ${listId.slice(0, 8)}...` : " No list"}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:block border-t">
          <Tabs
            value={currentTab}
            onValueChange={handleChangeParam}
            className="w-full"
          >
            <TabsList className="w-full justify-start h-12 lg:h-14 bg-transparent px-4 sm:px-6 gap-0 sm:gap-1">
              <TabsTrigger
                value="overview"
                className="px-3 sm:px-5 py-2 sm:py-3.5 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:font-medium rounded-lg text-xs sm:text-sm"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {getTabIcon("overview")}
                  <span>Overview</span>
                </div>
              </TabsTrigger>

              {prev >= 2 && (
                <TabsTrigger
                  value="report"
                  className="px-3 sm:px-5 py-2 sm:py-3.5 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:font-medium rounded-lg text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {getTabIcon("report")}
                    <span>Reports</span>
                  </div>
                </TabsTrigger>
              )}

              {prev >= 2 && (
                <TabsTrigger
                  value="orders"
                  className="px-3 sm:px-5 py-2 sm:py-3.5 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:font-medium rounded-lg text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {getTabIcon("orders")}
                    <span>Orders</span>
                  </div>
                </TabsTrigger>
              )}
              {prev >= 2 && (
                <TabsTrigger
                  value="transactions"
                  className="px-3 sm:px-5 py-2 sm:py-3.5 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:font-medium rounded-lg text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {getTabIcon("transactions")}
                    <span>Transactions</span>
                  </div>
                </TabsTrigger>
              )}

              {prev >= 3 && (
                <TabsTrigger
                  value="other"
                  className="px-3 sm:px-5 py-2 sm:py-3.5 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:font-medium rounded-lg text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {getTabIcon("other")}
                    <span>Other</span>
                  </div>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* Mobile Tabs - Scrollable horizontal */}
        <div className="sm:hidden border-t">
          <Tabs value={currentTab} onValueChange={handleChangeParam}>
            <TabsList className="w-full h-12 px-2 justify-start overflow-x-auto flex-nowrap rounded-none bg-transparent gap-0">
              <TabsTrigger value="overview" className="px-3 py-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  {getTabIcon("overview")}
                  <span className="text-xs">Overview</span>
                </div>
              </TabsTrigger>

              {prev >= 2 && (
                <TabsTrigger value="report" className="px-3 py-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {getTabIcon("report")}
                    <span className="text-xs">Reports</span>
                  </div>
                </TabsTrigger>
              )}

              {prev >= 2 && (
                <TabsTrigger value="orders" className="px-3 py-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {getTabIcon("orders")}
                    <span className="text-xs">Orders</span>
                  </div>
                </TabsTrigger>
              )}
              {prev >= 2 && (
                <TabsTrigger
                  value="transactions"
                  className="px-3 py-2 shrink-0"
                >
                  <div className="flex items-center gap-1.5">
                    {getTabIcon("transactions")}
                    <span className="text-xs">Transactions</span>
                  </div>
                </TabsTrigger>
              )}
              {prev >= 3 && (
                <TabsTrigger value="other" className="px-3 py-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {getTabIcon("other")}
                    <span className="text-xs">Other</span>
                  </div>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content Area - Mobile Responsive (No Cards) */}
      <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
        <div className="w-full h-full">
          <Tabs
            value={currentTab}
            onValueChange={handleChangeParam}
            className="h-full"
          >
            {/* Overview Tab */}
            <TabsContent value="overview" className="h-full m-0 overflow-auto">
              <div className="h-full">
                <div className="mb-3 sm:mb-4 lg:mb-6">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-0.5 sm:mb-1">
                    Supplies Overview
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    View and manage all supplies in this list
                  </p>
                </div>
                <div className="h-[calc(100%-60px)]">
                  <SuppliesOverview />
                </div>
              </div>
            </TabsContent>

            {prev >= 2 && (
              <TabsContent value="report" className="h-full m-0">
                <div className="h-full">
                  <div className="mb-3 sm:mb-4 lg:mb-6">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-0.5 sm:mb-1">
                      Supply Reports
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Generate and view supply reports and analytics
                    </p>
                  </div>
                  <div className="h-[calc(100%-60px)]">
                    <SupplyReport />
                  </div>
                </div>
              </TabsContent>
            )}

            {prev >= 2 && (
              <TabsContent value="orders" className="h-full m-0">
                <div className="h-full">
                  <OrderList
                    auth={auth}
                    containerId={containerId}
                    listId={listId}
                  />
                </div>
              </TabsContent>
            )}

            {prev >= 2 && (
              <TabsContent
                value="transactions"
                className="h-full m-0 overflow-auto"
              >
                <div className="h-full">
                  <div className="mb-3 sm:mb-4 lg:mb-6">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-0.5 sm:mb-1">
                      Supply Transactions
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Track supply transactions and history
                    </p>
                  </div>
                  <div className="h-[calc(100%-60px)]">
                    <DispenseTransactions
                      listId={listId as string}
                      token={auth.token as string}
                    />
                  </div>
                </div>
              </TabsContent>
            )}

            {prev >= 3 && (
              <TabsContent value="other" className="h-full m-0">
                <div className="h-full">
                  <div className="mb-3 sm:mb-4 lg:mb-6">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-0.5 sm:mb-1">
                      Other Operations
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Additional supply management operations and settings
                    </p>
                  </div>
                  <div className="h-[calc(100%-60px)]">
                    <SupplyOther
                      listId={listId}
                      token={auth.token}
                      userId={auth.userId as string}
                      lineId={lineId as string}
                      containerId={containerId as string}
                    />
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CustomList;
