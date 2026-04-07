import { useContext, createContext } from "react";
import { useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./ProtectedRoute";
import type {
  ReceivingRoom,
  RoomAuthorizedUserProps,
  RoomRegistration,
} from "@/interface/data";

//
import { Badge } from "@/components/ui/badge";
//import { Button } from "@/components/ui/button";
import { Bell, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { signatoryRegistry } from "@/db/statements/document";
import SignatoryRegistry from "@/layout/e-sign/SignatoryRegistry";
import { roomRegistration } from "@/utils/helper";

const DocumentRoomContext = createContext<{ room: ReceivingRoom | null }>({
  room: null,
});

const DocumentRoomProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  const { lineId } = useParams();
  const queryClient = useQueryClient();

  const { data, isFetching } = useQuery<{
    roomRegistration: RoomRegistration | null;
    authorizedUser: RoomAuthorizedUserProps | null;
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

  console.log(data);

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
            {/* <div className="pt-4">
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
            </div> */}
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
    <DocumentRoomContext.Provider value={{ room: data.room }}>
      {children}
    </DocumentRoomContext.Provider>
  );
};

export default DocumentRoomProvider;

export const useRoom = () => {
  const context = useContext(DocumentRoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a DocumentRoomProvider");
  }
  return context;
};
