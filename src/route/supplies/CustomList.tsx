import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell, Toolbar } from "@/components/custom/page";
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

  const rawTab = params.get("tab") || "overview";
  // Orders tab is hidden for now. Flip to true to bring it back (the OrderList
  // content stays wired below so nothing breaks the build).
  const showOrders = false;
  const currentTab =
    rawTab === "orders" && !showOrders ? "overview" : rawTab;
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

  /*
    One tab list, built from one array.

    There used to be two: a `hidden sm:block` set and a `sm:hidden` set,
    each repeating all five triggers with slightly different padding. That
    is 130 lines saying the same thing twice, and the failure mode is
    silent — add a tab, update one copy, and half your users never see it.
    A single row that scrolls horizontally works at every width.
  */
  const tabs = [
    { value: "overview", label: "Overview", show: true },
    { value: "report", label: "Reports", show: prev >= 2 },
    { value: "orders", label: "Orders", show: showOrders },
    { value: "transactions", label: "Transactions", show: prev >= 2 },
    { value: "other", label: "Other", show: prev >= 3 },
  ].filter((t) => t.show);

  return (
    <PageShell>
      <Toolbar icon={Package} title="Supplies" />

      <div className="bg-white border-b shrink-0">
        <Tabs value={currentTab} onValueChange={handleChangeParam}>
          <TabsList className="w-full h-9 justify-start px-2 gap-0 bg-transparent rounded-none overflow-x-auto flex-nowrap">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="px-3 py-1.5 shrink-0 text-xs font-medium rounded-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
              >
                <div className="flex items-center gap-1.5">
                  {getTabIcon(t.value)}
                  <span>{t.label}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 min-h-0 p-3">
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

          {showOrders && (
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
    </PageShell>
  );
};

export default CustomList;
