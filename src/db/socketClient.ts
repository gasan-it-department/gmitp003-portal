import { io, Socket } from "socket.io-client";
import { getUrl } from "./axios";

// The WebSocket lives on the SAME server as REST, so resolve its URL the
// exact same way axios does (getUrl() reads VITE_STATUS / VITE_DOMAIN /
// VITE_SERVER_URL). VITE_SOCKET_URL still overrides if explicitly set.
// The previous hardcoded "127.0.0.1:3000" fallback meant the deployed site
// tried to reach localhost and the socket never connected — so chat worked
// (REST) but was never real-time.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || getUrl();

let socket: Socket | null = null;

/**
 * Returns the shared Socket.IO client. The connection is lazy — we don't
 * open the socket until something actually subscribes. Reconnection is
 * handled by the client library.
 */
export const getSocket = (): Socket => {
  if (socket && socket.connected) return socket;
  if (socket) return socket;
  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
    timeout: 15000,
  });
  return socket;
};

/**
 * Hook a component into the chat room for an application. Joins on mount,
 * leaves on unmount, fires `onMessage` for every incoming chat:new-message
 * with the matching applicationId.
 */
export interface ChatMessagePayload {
  id: string;
  messageContent: string;
  fromHr: boolean;
  timestamp: string;
  submittedApplicationId: string;
  hrAdmin?: { id: string; firstName?: string; lastName?: string } | null;
}

export interface UserNotificationPayload {
  id: string;
  title: string;
  content: string;
  path?: string | null;
  createdAt: string;
  isRead?: boolean;
}

export interface MedicineNotificationPayload {
  id: string;
  userId: string;
  title: string;
  message: string;
  lineId: string;
  path?: string | null;
  timestamp: string;
  type?: number;
  view?: number;
}

/**
 * Subscribe to `notification:user-new` for a specific user. The server
 * fires this when a Notification row is created with `recipientId ===
 * userId`. Returns a cleanup function that detaches the listener.
 */
export const joinUserRoom = (
  userId: string,
  onNotification: (n: UserNotificationPayload) => void,
): (() => void) => {
  const s = getSocket();
  const join = () => s.emit("user:join", userId);
  if (s.connected) join();
  else s.once("connect", join);

  const handler = (n: UserNotificationPayload) => onNotification(n);
  s.on("notification:user-new", handler);
  return () => {
    s.off("notification:user-new", handler);
  };
};

/**
 * Subscribe to `medicine-notification:new` for a line. Used by the
 * pharmacy inbox so low-stock / new-prescription alerts arrive without
 * polling, scoped to the user's own line.
 */
export const joinLineRoom = (
  lineId: string,
  onNotification: (n: MedicineNotificationPayload) => void,
): (() => void) => {
  const s = getSocket();
  const join = () => s.emit("join-line", lineId);
  if (s.connected) join();
  else s.once("connect", join);

  const handler = (n: MedicineNotificationPayload) => {
    if (n.lineId === lineId) onNotification(n);
  };
  s.on("medicine-notification:new", handler);
  return () => {
    s.off("medicine-notification:new", handler);
  };
};

export const joinChatRoom = (
  applicationId: string,
  onMessage: (msg: ChatMessagePayload) => void,
): (() => void) => {
  const s = getSocket();

  const join = () => s.emit("chat:join", applicationId);

  if (s.connected) join();
  else s.once("connect", join);

  const handler = (msg: ChatMessagePayload) => {
    if (msg.submittedApplicationId === applicationId) onMessage(msg);
  };
  s.on("chat:new-message", handler);

  return () => {
    s.off("chat:new-message", handler);
    if (s.connected) s.emit("chat:leave", applicationId);
  };
};
