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
        return <LayoutDashboard className="w-3.5 h-3.5" />;
      case "report":
        return <ChartPie className="w-3.5 h-3.5" />;
      case "orders":
        return <ListOrdered className="w-3.5 h-3.5" />;
      case "transactions":
        return <ArrowLeftRight className="w-3.5 h-3.5" />;
      case "other":
        return <BadgeInfo className="w-3.5 h-3.5" />;
      default:
        return <LayoutDashboard className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header - Compact */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md">
              <Package className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 truncate">
                Supplies Management
              </h1>
              <p className="text-[10px] text-gray-500 truncate">
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
            <TabsList className="w-full justify-start h-10 bg-transparent px-3 gap-0">
              <TabsTrigger
                value="overview"
                className="px-3 py-1.5 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none text-xs font-medium"
              >
                <div className="flex items-center gap-1.5">
                  {getTabIcon("overview")}
                  <span>Overview</span>
                </div>
              </TabsTrigger>

              {prev >= 2 && (
                <TabsTrigger
                  value="report"
                  className="px-3 py-1.5 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none text-xs font-medium"
                >
                  <div className="flex items-center gap-1.5">
                    {getTabIcon("report")}
                    <span>Reports</span>
                  </div>
                </TabsTrigger>
              )}

              {prev >= 2 && (
                <TabsTrigger
                  value="orders"
                  className="px-3 py-1.5 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none text-xs font-medium"
                >
                  <div className="flex items-center gap-1.5">
                    {getTabIcon("orders")}
                    <span>Orders</span>
                  </div>
                </TabsTrigger>
              )}
              {prev >= 2 && (
                <TabsTrigger
                  value="transactions"
                  className="px-3 py-1.5 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none text-xs font-medium"
                >
                  <div className="flex items-center gap-1.5">
                    {getTabIcon("transactions")}
                    <span>Transactions</span>
                  </div>
                </TabsTrigger>
              )}

              {prev >= 3 && (
                <TabsTrigger
                  value="other"
                  className="px-3 py-1.5 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none text-xs font-medium"
                >
                  <div className="flex items-center gap-1.5">
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
            <TabsList className="w-full h-9 px-2 justify-start overflow-x-auto flex-nowrap rounded-none bg-transparent gap-0">
              <TabsTrigger
                value="overview"
                className="px-2.5 py-1 shrink-0 text-xs data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
              >
                <div className="flex items-center gap-1">
                  {getTabIcon("overview")}
                  <span>Overview</span>
                </div>
              </TabsTrigger>

              {prev >= 2 && (
                <TabsTrigger
                  value="report"
                  className="px-2.5 py-1 shrink-0 text-xs data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
                >
                  <div className="flex items-center gap-1">
                    {getTabIcon("report")}
                    <span>Reports</span>
                  </div>
                </TabsTrigger>
              )}

              {prev >= 2 && (
                <TabsTrigger
                  value="orders"
                  className="px-2.5 py-1 shrink-0 text-xs data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
                >
                  <div className="flex items-center gap-1">
                    {getTabIcon("orders")}
                    <span>Orders</span>
                  </div>
                </TabsTrigger>
              )}
              {prev >= 2 && (
                <TabsTrigger
                  value="transactions"
                  className="px-2.5 py-1 shrink-0 text-xs data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
                >
                  <div className="flex items-center gap-1">
                    {getTabIcon("transactions")}
                    <span>Transactions</span>
                  </div>
                </TabsTrigger>
              )}
              {prev >= 3 && (
                <TabsTrigger
                  value="other"
                  className="px-2.5 py-1 shrink-0 text-xs data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
                >
                  <div className="flex items-center gap-1">
                    {getTabIcon("other")}
                    <span>Other</span>
                  </div>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content Area - Compact */}
      <div className="flex-1 overflow-auto p-3">
        <Tabs
          value={currentTab}
          onValueChange={handleChangeParam}
          className="h-full"
        >
          {/* Overview Tab */}
          <TabsContent
            value="overview"
            className="h-full m-0 focus-visible:outline-none"
          >
            <div className="h-full">
              <SuppliesOverview />
            </div>
          </TabsContent>

          {prev >= 2 && (
            <TabsContent
              value="report"
              className="h-full m-0 focus-visible:outline-none"
            >
              <div className="h-full">
                <SupplyReport />
              </div>
            </TabsContent>
          )}

          {prev >= 2 && (
            <TabsContent
              value="orders"
              className="h-full m-0 focus-visible:outline-none"
            >
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
              className="h-full m-0 focus-visible:outline-none"
            >
              <div className="h-full">
                <DispenseTransactions
                  listId={listId as string}
                  token={auth.token as string}
                />
              </div>
            </TabsContent>
          )}

          {prev >= 3 && (
            <TabsContent
              value="other"
              className="h-full m-0 focus-visible:outline-none"
            >
              <div className="h-full">
                <SupplyOther
                  listId={listId}
                  token={auth.token}
                  userId={auth.userId as string}
                  lineId={lineId as string}
                  containerId={containerId as string}
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default CustomList;
