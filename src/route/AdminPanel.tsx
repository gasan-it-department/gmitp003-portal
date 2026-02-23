import { useSearchParams } from "react-router";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { Badge } from "@/components/ui/badge";
import {
  BookUser,
  // Component,
  // Gauge,
  // LandPlot,
  Server,
  // Logs,
  Shield,
  //Settings,
  Bell,
  Menu,
  X,
  //Home,
} from "lucide-react";

//tabs
// import Dashboard from "./admin-panel/Dashboard";
// import Areas from "./admin-panel/Areas";
import Account from "./admin-panel/Account";
import Lines from "./admin-panel/Lines";

const AdminPanel = () => {
  const [params, setParams] = useSearchParams({ tab: "account" });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentTab = params.get("tab") || "account";

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      { replace: true },
    );
    setIsMobileMenuOpen(false);
  };

  // Tabs configuration with icons and badges
  const tabs = [
    // {
    //   value: "dashboard",
    //   label: "Dashboard",
    //   icon: Gauge,
    //   badge: notifications.dashboard,
    //   component: <Dashboard />,
    // },
    {
      value: "account",
      label: "Account",
      icon: BookUser,
      component: <Account />,
    },
    // {
    //   value: "module",
    //   label: "Modules",
    //   icon: Component,
    //   badge: notifications.module,
    //   component: <div className="p-6">Modules Content</div>,
    // },
    {
      value: "line",
      label: "Lines",
      icon: Server,
      component: <Lines />,
    },
    // {
    //   value: "area",
    //   label: "Areas",
    //   icon: LandPlot,
    //   badge: notifications.area,
    //   component: <Areas />,
    // },
    // {
    //   value: "logs",
    //   label: "Audit Logs",
    //   icon: Logs,
    //   badge: notifications.logs,
    //   component: <div className="p-6">Audit Logs Content</div>,
    // },
  ];

  // const activeTab = tabs.find((tab) => tab.value === currentTab);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Admin Panel
                  </h1>
                  <p className="text-xs text-gray-500">System Administration</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Bell className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Notifications</span>
                {/* <Badge
                  variant="destructive"
                  className="ml-2 h-5 w-5 p-0 text-xs"
                >
                  12
                </Badge> */}
              </Button>
              {/* 
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Settings</span>
              </Button> */}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2">
              <TabsList className="w-full flex flex-col h-auto bg-transparent gap-1">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    onClick={() => handleChangeParams("tab", tab.value)}
                    className="w-full justify-start px-4 py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                  >
                    <div className="flex items-center gap-3">
                      <tab.icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
        )}
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Tabs */}
          <div className="hidden md:block mb-6">
            <Tabs
              value={currentTab}
              onValueChange={(value) => handleChangeParams("tab", value)}
              className="w-full"
            >
              <TabsList className="w-full justify-start bg-white border border-gray-200 p-1 rounded-lg">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="px-6 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-sm relative"
                  >
                    <div className="flex items-center gap-2">
                      <tab.icon className="h-4 w-4" />
                      <span className="font-medium">{tab.label}</span>
                    </div>
                    {currentTab === tab.value && (
                      <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <Tabs
              value={currentTab}
              onValueChange={(value) => handleChangeParams("tab", value)}
              className="w-full"
            >
              {tabs.map((tab) => (
                <TabsContent
                  key={tab.value}
                  value={tab.value}
                  className="m-0 p-0 focus-visible:outline-none focus-visible:ring-0"
                >
                  {/* Main Content */}
                  <div className="p-2">{tab.component}</div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
