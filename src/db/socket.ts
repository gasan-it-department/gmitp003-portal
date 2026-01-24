import { io } from "socket.io-client";

// Fix: Use the correct URL and options
const URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const socket = io(URL);
