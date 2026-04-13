import React, { createContext } from "react";
//import { url } from "@/db/axios";
// import { io } from "socket.io-client";
// //
// import { useAuth } from "./ProtectedRoute";

// //

// interface NotificationProps {
//   id: string;
//   title: string;
//   message: string;
//   type: string;
//   userId?: string;
//   createdAt: string;
// }

const NotificationContext = createContext(null);
const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <NotificationContext.Provider value={null}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
