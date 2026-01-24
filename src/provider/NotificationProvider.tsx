import React, { useContext, createContext, useEffect, useState } from "react";
import { url } from "@/db/axios";
import { io } from "socket.io-client";
//
import { useAuth } from "./ProtectedRoute";

//

interface NotificationProps {
  id: string;
  title: string;
  message: string;
  type: string;
  userId?: string;
  createdAt: string;
}

const NotificationContext = createContext(null);
const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  console.log({ isConnected });

  const auth = useAuth();
  useEffect(() => {
    const socket = io("http://[::1]:3000");
    socket.on("connection", () => {
      setIsConnected(true);
    });

    socket.on("user:joined", (data: { userId: string; socketId: string }) => {
      console.log("Successfully joined user room:", data);
    });
    socket.on("notification:new", (notification: NotificationProps) => {
      console.log("Received new notification:", notification);

      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: "Text",
        });
      }
    });
  }, [auth.userId]);
  return (
    <NotificationContext.Provider value={null}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
