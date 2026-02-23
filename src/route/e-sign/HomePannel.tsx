import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams } from "react-router";
//
import { signatoryRegistry } from "@/db/statements/document";
import { roomRegistration } from "@/utils/helper";
//
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SignatoryRegistry from "@/layout/e-sign/SignatoryRegistry";
//icons
import {
  Bell,
  FileClock,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  ChevronRight,
  ChevronLeft,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import ESignPannel from "@/layout/e-sign/ESignPannel";

import type {
  RoomRegistration,
  Signatory,
  ReceivingRoom,
} from "@/interface/data";

const HomePannel = () => {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("notifications");
  const auth = useAuth();
  const { lineId } = useParams();
  const queryClient = useQueryClient();

  const { data, isFetching } = useQuery<{
    roomRegistration: RoomRegistration | null;
    signatory: Signatory | null;
    room: ReceivingRoom | null;
  }>({
    queryKey: ["signatory-registry", auth.userId],
    queryFn: () =>
      signatoryRegistry(auth.token as string, auth.userId as string),
    enabled: !!auth.token || !!auth.userId,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  if (isFetching) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!data?.roomRegistration) {
    return (
      <SignatoryRegistry
        lineId={lineId as string}
        token={auth.token as string}
        userId={auth.userId as string}
        queryClient={queryClient}
      />
    );
  }

  if (data.roomRegistration.status === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50/30 to-indigo-50/30">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Icon/Status Badge */}
          <div className="relative mx-auto">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center animate-pulse">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <Badge
              variant="outline"
              className="absolute -top-2 -right-2 bg-white border-blue-200 text-blue-700 font-medium px-3 py-1"
            >
              Pending
            </Badge>
          </div>

          {/* Status Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {roomRegistration[data.roomRegistration.status]}
            </h2>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full">
              <Bell className="h-4 w-4" />
              <span className="text-sm font-medium">Awaiting Approval</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <p className="text-gray-600 leading-relaxed">
              Please wait for the HR department to review and approve your room
              application.
            </p>

            {/* Progress/Status Info */}
            <Card className="border border-gray-200 bg-white/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Application ID
                    </span>
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {data.roomRegistration.id.substring(0, 8)}...
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Submitted</span>
                    <span className="text-sm font-medium">
                      {new Date(
                        data.roomRegistration.timestamp,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-600">
                      Estimated approval time: 24-48 business hours
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help/Support Links */}
            <div className="pt-4">
              <p className="text-sm text-gray-500 mb-3">
                Need help with your application?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="flex-1">
                  <FileClock className="h-4 w-4 mr-2" />
                  View Application Details
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <User className="h-4 w-4 mr-2" />
                  Contact HR Support
                </Button>
              </div>
            </div>
          </div>

          {/* Loading Animation */}
          <div className="pt-6">
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div
                className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <span className="text-sm ml-2">Checking for updates...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-white">
      {/* Mobile Header for Side Panel Toggle */}
      <div className="lg:hidden flex items-center justify-between p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gray-100 rounded-lg">
            {activeTab === "notifications" ? (
              <Bell className="h-4 w-4 text-gray-700" />
            ) : (
              <FileClock className="h-4 w-4 text-gray-700" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {activeTab === "notifications"
                ? "Notifications"
                : "Activity Logs"}
            </h2>
            <p className="text-xs text-gray-500">
              {activeTab === "notifications"
                ? "System alerts and updates"
                : "Recent system activities"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
        >
          {isSidePanelOpen ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main Content Area */}
      <div
        className={`flex-1 h-full overflow-auto ${
          isSidePanelOpen ? "lg:w-3/4" : "w-full"
        }`}
      >
        <ESignPannel />
      </div>

      {/* Side Panel - Hidden on mobile by default, can be toggled */}
      <div
        className={`
        ${isSidePanelOpen ? "block" : "hidden"} 
        lg:block
        w-full lg:w-80 h-full lg:h-auto
        border-t lg:border-l border-gray-200 bg-white lg:bg-gray-50/30
        lg:relative absolute inset-0 z-50 lg:z-auto
        lg:max-h-none max-h-[80vh] overflow-auto
      `}
      >
        {/* Desktop Toggle Button */}
        <div className="hidden lg:flex absolute -left-3 top-6 z-10">
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0 rounded-full border-gray-300 bg-white shadow-sm"
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
          >
            {isSidePanelOpen ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>
        </div>

        <Tabs
          defaultValue="notifications"
          className="h-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-white">
            <h2 className="text-sm font-semibold text-gray-900 mb-2 hidden lg:block">
              Quick Actions
            </h2>
            <TabsList className="w-full bg-gray-100 p-1">
              <TabsTrigger
                value="notifications"
                className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm"
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <Bell className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">Alerts</span>
                  <span className="sm:hidden">Alert</span>
                  <Badge className="ml-1 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-xs">
                    3
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm"
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <FileClock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">Logs</span>
                  <span className="sm:hidden">Log</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Notifications Content */}
          <TabsContent
            value="notifications"
            className="h-[calc(100%-80px)] lg:h-[calc(100%-88px)] mt-0 p-3 sm:p-4 overflow-auto"
          >
            <Card className="border border-gray-200 shadow-none">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Recent Alerts</span>
                  <Badge variant="outline" className="text-xs">
                    3 new
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  System notifications and pending actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Alert Item */}
                <div className="p-2 sm:p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="p-1 sm:p-1.5 bg-amber-100 rounded-md flex-shrink-0">
                      <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        Document awaiting signature
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        Contract-2024-Q1.pdf
                      </p>
                      <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          2 hours ago
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alert Item */}
                <div className="p-2 sm:p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="p-1 sm:p-1.5 bg-blue-100 rounded-md flex-shrink-0">
                      <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        New user access request
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        Sarah Johnson - Legal Dept.
                      </p>
                      <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          4 hours ago
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alert Item */}
                <div className="p-2 sm:p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="p-1 sm:p-1.5 bg-emerald-100 rounded-md flex-shrink-0">
                      <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        Document signed
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        NDA-Acme-Corp.pdf completed
                      </p>
                      <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400" />
                        <span className="text-xs text-gray-400">Yesterday</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* View All Link */}
                <div className="text-center pt-1">
                  <button className="text-xs text-gray-500 hover:text-gray-700 hover:underline">
                    View all notifications →
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-3 sm:mt-4 border border-gray-200 shadow-none">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm font-semibold">
                  Today's Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Documents processed
                  </span>
                  <span className="text-xs font-medium text-gray-900">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Pending signatures
                  </span>
                  <span className="text-xs font-medium text-gray-900">7</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Avg. response time
                  </span>
                  <span className="text-xs font-medium text-gray-900">
                    1.8h
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Content */}
          <TabsContent
            value="logs"
            className="h-[calc(100%-80px)] lg:h-[calc(100%-88px)] mt-0 p-3 sm:p-4 overflow-auto"
          >
            <Card className="border border-gray-200 shadow-none">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm font-semibold">
                  Activity Logs
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Recent system activities and user actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Log Item */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-900 truncate">
                      Document uploaded
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      09:42 AM
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    Contract-2024-Q1.pdf by John Doe
                  </p>
                </div>

                <Separator />

                {/* Log Item */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-900 truncate">
                      Signature added
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      10:15 AM
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    Jane Smith signed NDA document
                  </p>
                </div>

                <Separator />

                {/* Log Item */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-900 truncate">
                      User permission updated
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      11:30 AM
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    Admin modified access rights
                  </p>
                </div>

                <Separator />

                <div className="text-center pt-2">
                  <button className="text-xs text-gray-500 hover:text-gray-700 hover:underline">
                    Load more activities →
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Export Option */}
            <Card className="mt-3 sm:mt-4 border border-gray-200 shadow-none">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm font-semibold">
                  Export Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <button className="w-full text-xs py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-700 transition-colors">
                  Download full activity report (CSV)
                </button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Overlay for mobile when side panel is open */}
      {isSidePanelOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsSidePanelOpen(false)}
        />
      )}
    </div>
  );
};

export default HomePannel;
