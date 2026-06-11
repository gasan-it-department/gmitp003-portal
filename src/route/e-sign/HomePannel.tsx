import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Bell,
  FileClock,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

import ESignPannel from "@/layout/e-sign/ESignPannel";

const HomePannel = () => {
  const [sideOpen, setSideOpen] = useState(true);
  const [tab, setTab] = useState("notifications");

  return (
    <div className="w-full h-full flex bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-auto">
        <ESignPannel />
      </div>

      {/* Side panel */}
      <aside
        className={`bg-white border-l flex-shrink-0 transition-[width] duration-200 ease-out ${
          sideOpen ? "w-80" : "w-10"
        } flex flex-col`}
      >
        {/* Collapse toggle header */}
        <div className="px-2 py-1.5 border-b bg-gray-50 flex items-center justify-between flex-shrink-0">
          {sideOpen && (
            <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
              Activity
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-auto"
            onClick={() => setSideOpen((o) => !o)}
            title={sideOpen ? "Collapse panel" : "Expand panel"}
          >
            {sideOpen ? (
              <PanelRightClose className="h-3 w-3" />
            ) : (
              <PanelRightOpen className="h-3 w-3" />
            )}
          </Button>
        </div>

        {sideOpen && (
          <Tabs
            value={tab}
            onValueChange={setTab}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Tab strip */}
            <div className="px-2 py-1.5 border-b bg-gray-50 flex-shrink-0">
              <TabsList className="w-full h-7 bg-white border p-0.5">
                <TabsTrigger
                  value="notifications"
                  className="flex-1 h-6 text-[10px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none gap-1"
                >
                  <Bell className="h-2.5 w-2.5" />
                  Alerts
                  <Badge
                    variant="default"
                    className="h-3.5 px-1 text-[9px] leading-none ml-0.5"
                  >
                    3
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="logs"
                  className="flex-1 h-6 text-[10px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none gap-1"
                >
                  <FileClock className="h-2.5 w-2.5" />
                  Logs
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Notifications */}
            <TabsContent
              value="notifications"
              className="flex-1 overflow-auto p-2 space-y-2 mt-0 data-[state=inactive]:hidden"
            >
              {/* Recent alerts card */}
              <div className="border rounded-lg bg-white overflow-hidden">
                <div className="px-2.5 py-1.5 border-b bg-gray-50 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-gray-700">
                    Recent Alerts
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    3 new
                  </Badge>
                </div>
                <div className="divide-y divide-gray-100">

                  <div className="px-2.5 py-2 flex items-start gap-2 hover:bg-gray-50">
                    <div className="p-1 bg-amber-100 rounded-md flex-shrink-0 mt-0.5">
                      <AlertCircle className="h-2.5 w-2.5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-gray-900 truncate">
                        Document awaiting signature
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        Contract-2024-Q1.pdf
                      </p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                        <Clock className="h-2 w-2" /> 2 hours ago
                      </p>
                    </div>
                  </div>

                  <div className="px-2.5 py-2 flex items-start gap-2 hover:bg-gray-50">
                    <div className="p-1 bg-blue-100 rounded-md flex-shrink-0 mt-0.5">
                      <User className="h-2.5 w-2.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-gray-900 truncate">
                        New access request
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        Sarah Johnson — Legal Dept.
                      </p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                        <Clock className="h-2 w-2" /> 4 hours ago
                      </p>
                    </div>
                  </div>

                  <div className="px-2.5 py-2 flex items-start gap-2 hover:bg-gray-50">
                    <div className="p-1 bg-emerald-100 rounded-md flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-2.5 w-2.5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-gray-900 truncate">
                        Document signed
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        NDA-Acme-Corp.pdf completed
                      </p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                        <Clock className="h-2 w-2" /> Yesterday
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-2.5 py-1.5 border-t bg-gray-50">
                  <button
                    type="button"
                    className="w-full text-[10px] text-blue-600 hover:underline"
                  >
                    View all notifications →
                  </button>
                </div>
              </div>

              {/* Today's summary card */}
              <div className="border rounded-lg bg-white overflow-hidden">
                <div className="px-2.5 py-1.5 border-b bg-gray-50">
                  <span className="text-[10px] font-semibold text-gray-700">
                    Today's Summary
                  </span>
                </div>
                <div className="p-2.5 space-y-1.5">
                  {[
                    { label: "Documents processed", value: "24" },
                    { label: "Pending signatures",  value: "7"  },
                    { label: "Avg. response time",  value: "1.8h" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between"
                    >
                      <span className="text-[10px] text-gray-500">
                        {row.label}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-900">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Logs */}
            <TabsContent
              value="logs"
              className="flex-1 overflow-auto p-2 space-y-2 mt-0 data-[state=inactive]:hidden"
            >
              <div className="border rounded-lg bg-white overflow-hidden">
                <div className="px-2.5 py-1.5 border-b bg-gray-50">
                  <span className="text-[10px] font-semibold text-gray-700">
                    Activity Logs
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {[
                    { action: "Document uploaded",       detail: "Contract-2024-Q1.pdf by John Doe",     time: "09:42 AM" },
                    { action: "Signature added",         detail: "Jane Smith signed NDA document",       time: "10:15 AM" },
                    { action: "User permission updated", detail: "Admin modified access rights",         time: "11:30 AM" },
                  ].map((row) => (
                    <div key={row.action} className="px-2.5 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-gray-900 truncate">
                          {row.action}
                        </span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                          {row.time}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">
                        {row.detail}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="px-2.5 py-1.5 border-t bg-gray-50">
                  <button
                    type="button"
                    className="w-full text-[10px] text-blue-600 hover:underline"
                  >
                    Load more →
                  </button>
                </div>
              </div>

              <div className="border rounded-lg bg-white overflow-hidden">
                <div className="px-2.5 py-1.5 border-b bg-gray-50">
                  <span className="text-[10px] font-semibold text-gray-700">
                    Export
                  </span>
                </div>
                <div className="p-2.5">
                  <button
                    type="button"
                    className="w-full h-7 text-[10px] bg-gray-50 hover:bg-gray-100 border rounded-md text-gray-700 transition-colors"
                  >
                    Download full activity report (CSV)
                  </button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

      </aside>
    </div>
  );
};

export default HomePannel;
