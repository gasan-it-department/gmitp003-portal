import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/provider/ProtectedRoute";
import axios from "@/db/axios";
import { getSocket } from "@/db/socketClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plug,
  PlugZap,
  Send,
  Eraser,
  Wifi,
  WifiOff,
  Bell,
  MessageSquare,
  Hash,
  Loader2,
} from "lucide-react";

type LogLevel = "info" | "out" | "in" | "warn" | "error";
interface LogEntry {
  id: number;
  ts: string;
  level: LogLevel;
  label: string;
  payload?: unknown;
}

const colorFor = (l: LogLevel) => {
  switch (l) {
    case "out":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "in":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "warn":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "error":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const Test = () => {
  const auth = useAuth();
  const socket = useMemo(() => getSocket(), []);
  const [connected, setConnected] = useState(socket.connected);
  const [socketId, setSocketId] = useState(socket.id ?? "—");

  // Generic event log.
  const [log, setLog] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);
  const append = (level: LogLevel, label: string, payload?: unknown) =>
    setLog((prev) =>
      [
        {
          id: ++logIdRef.current,
          ts: new Date().toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          level,
          label,
          payload,
        },
        ...prev,
      ].slice(0, 150),
    );

  // Inputs.
  const [applicationId, setApplicationId] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatFromHr, setChatFromHr] = useState(true);
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);

  const [echoText, setEchoText] = useState("hello from frontend");

  const [customEvent, setCustomEvent] = useState("");
  const [customPayload, setCustomPayload] = useState("");

  // ── Connection lifecycle ────────────────────────────────────────────
  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      setSocketId(socket.id ?? "—");
      append("info", "socket connected", { id: socket.id });
    };
    const onDisconnect = (reason: string) => {
      setConnected(false);
      append("warn", "socket disconnected", { reason });
    };
    const onConnectError = (err: Error) => {
      append("error", "connect_error", { message: err.message });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, [socket]);

  // ── Listeners for events emitted by the API ────────────────────────
  useEffect(() => {
    const onJoined = (p: { applicationId: string }) => {
      setJoinedRoom(`chat-${p.applicationId}`);
      append("in", "chat:joined", p);
    };
    const onNewMessage = (m: any) => append("in", "chat:new-message", m);
    const onNotification = (n: any) => append("in", "notification:new", n);
    const onMessageReceived = (m: any) => append("in", "message_received", m);
    const onUserJoined = (p: any) => append("in", "user:joined", p);
    const onLineJoined = (p: any) => append("in", "line:joined", p);
    const onAdminJoined = () => append("in", "admin:joined");

    socket.on("chat:joined", onJoined);
    socket.on("chat:new-message", onNewMessage);
    socket.on("notification:new", onNotification);
    socket.on("message_received", onMessageReceived);
    socket.on("user:joined", onUserJoined);
    socket.on("line:joined", onLineJoined);
    socket.on("admin:joined", onAdminJoined);

    return () => {
      socket.off("chat:joined", onJoined);
      socket.off("chat:new-message", onNewMessage);
      socket.off("notification:new", onNotification);
      socket.off("message_received", onMessageReceived);
      socket.off("user:joined", onUserJoined);
      socket.off("line:joined", onLineJoined);
      socket.off("admin:joined", onAdminJoined);
    };
  }, [socket]);

  // ── Actions ────────────────────────────────────────────────────────
  const handleConnect = () => {
    if (!socket.connected) {
      socket.connect();
      append("out", "connect()");
    }
  };

  const handleDisconnect = () => {
    if (socket.connected) {
      socket.disconnect();
      append("out", "disconnect()");
    }
  };

  const handleEcho = () => {
    if (!echoText.trim()) return;
    socket.emit("send_message", { text: echoText });
    append("out", "send_message", { text: echoText });
  };

  const handleUserJoin = () => {
    if (!auth.userId) {
      append("warn", "not authenticated — auth.userId is missing");
      return;
    }
    socket.emit("user:join", auth.userId);
    append("out", "user:join", { userId: auth.userId });
  };

  const handleLineJoin = () => {
    const lineId = window.prompt("Line id to join:");
    if (!lineId) return;
    socket.emit("join-line", lineId);
    append("out", "join-line", { lineId });
  };

  const handleAdminJoin = () => {
    socket.emit("join-admin");
    append("out", "join-admin");
  };

  const handleJoinChat = () => {
    if (!applicationId.trim()) return;
    socket.emit("chat:join", applicationId.trim());
    append("out", "chat:join", { applicationId: applicationId.trim() });
  };

  const handleLeaveChat = () => {
    if (!joinedRoom) return;
    const id = joinedRoom.replace(/^chat-/, "");
    socket.emit("chat:leave", id);
    append("out", "chat:leave", { applicationId: id });
    setJoinedRoom(null);
  };

  // Send via REST — exercises the production code path: a POST hits the
  // controller, which then emits chat:new-message to the room we're in.
  // If the "in" log line shows up here, the full round-trip works.
  const [sending, setSending] = useState(false);
  const handleSendViaApi = async () => {
    if (!applicationId.trim() || !chatMessage.trim()) return;
    setSending(true);
    try {
      const url = chatFromHr
        ? "/application/send/admin-conversation"
        : "/application/send/applicant-conversation";
      const body = chatFromHr
        ? {
            applicationId: applicationId.trim(),
            message: chatMessage,
            userId: auth.userId,
          }
        : { applicationId: applicationId.trim(), message: chatMessage };
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      };
      if (auth.token) headers.Authorization = `Bearer ${auth.token}`;
      append("out", `POST ${url}`, body);
      const res = await axios.post(url, body, { headers });
      append("info", `${res.status} ${url}`, res.data);
      setChatMessage("");
    } catch (e: any) {
      append("error", "POST failed", {
        message:
          e?.response?.data?.message ??
          (e instanceof Error ? e.message : String(e)),
      });
    } finally {
      setSending(false);
    }
  };

  const handleCustomEmit = () => {
    if (!customEvent.trim()) return;
    let payload: any = customPayload;
    try {
      payload = customPayload ? JSON.parse(customPayload) : undefined;
    } catch {
      // pass as plain string
    }
    socket.emit(customEvent.trim(), payload);
    append("out", customEvent.trim(), payload);
  };

  const handleClear = () => setLog([]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto p-3 space-y-3">

        {/* Header */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {connected ? (
                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-red-500" />
              )}
              <div>
                <h1 className="text-xs font-semibold text-gray-800">
                  Socket.IO Test Console
                </h1>
                <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                  Verify connection, rooms, chat, and notifications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${
                  connected
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {connected ? "Connected" : "Disconnected"}
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 font-mono"
              >
                <Hash className="h-2.5 w-2.5 mr-0.5" />
                {socketId.slice(-8) || "—"}
              </Badge>
              <Button
                size="sm"
                variant={connected ? "outline" : "default"}
                onClick={connected ? handleDisconnect : handleConnect}
                className="h-7 text-[10px] gap-1.5"
              >
                {connected ? (
                  <>
                    <Plug className="h-3 w-3" />
                    Disconnect
                  </>
                ) : (
                  <>
                    <PlugZap className="h-3 w-3" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* Left — controls */}
          <div className="lg:col-span-1 space-y-3">

            {/* Echo */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3 text-blue-500" />
                <h3 className="text-xs font-semibold text-gray-800">
                  Echo test
                </h3>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-[10px] text-gray-500">
                  Emits <code>send_message</code> → server replies with{" "}
                  <code>message_received</code>.
                </p>
                <Input
                  value={echoText}
                  onChange={(e) => setEchoText(e.target.value)}
                  placeholder="Echo text"
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  onClick={handleEcho}
                  disabled={!connected}
                  className="h-7 text-[10px] w-full bg-blue-600 hover:bg-blue-700 gap-1.5"
                >
                  <Send className="h-3 w-3" />
                  Send echo
                </Button>
              </div>
            </div>

            {/* Notification rooms */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
                <Bell className="h-3 w-3 text-blue-500" />
                <h3 className="text-xs font-semibold text-gray-800">
                  Notification rooms
                </h3>
              </div>
              <div className="p-3 space-y-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUserJoin}
                  disabled={!connected}
                  className="h-7 text-[10px] w-full justify-start gap-1.5"
                >
                  Join user:{auth.userId?.slice(0, 8) ?? "—"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLineJoin}
                  disabled={!connected}
                  className="h-7 text-[10px] w-full justify-start gap-1.5"
                >
                  Join line room...
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAdminJoin}
                  disabled={!connected}
                  className="h-7 text-[10px] w-full justify-start gap-1.5"
                >
                  Join admin-room
                </Button>
                <p className="text-[10px] text-gray-400 pt-1 border-t">
                  Trigger a server-side push from a route (e.g. notify a user)
                  and watch the log on the right.
                </p>
              </div>
            </div>

            {/* Custom emit */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50">
                <h3 className="text-xs font-semibold text-gray-800">
                  Custom event
                </h3>
              </div>
              <div className="p-3 space-y-2">
                <Input
                  value={customEvent}
                  onChange={(e) => setCustomEvent(e.target.value)}
                  placeholder="event name"
                  className="h-8 text-xs"
                />
                <Textarea
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  placeholder='payload (JSON or plain string, optional)'
                  className="min-h-[60px] text-xs"
                />
                <Button
                  size="sm"
                  onClick={handleCustomEmit}
                  disabled={!connected || !customEvent.trim()}
                  className="h-7 text-[10px] w-full bg-blue-600 hover:bg-blue-700 gap-1.5"
                >
                  <Send className="h-3 w-3" />
                  Emit
                </Button>
              </div>
            </div>
          </div>

          {/* Middle — chat room test */}
          <div className="lg:col-span-1 space-y-3">

            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3 text-blue-500" />
                  <h3 className="text-xs font-semibold text-gray-800">
                    Application chat
                  </h3>
                </div>
                {joinedRoom && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 font-mono"
                  >
                    in {joinedRoom}
                  </Badge>
                )}
              </div>
              <div className="p-3 space-y-2">
                <div>
                  <label className="text-[10px] font-semibold text-gray-700">
                    Application ID
                  </label>
                  <Input
                    value={applicationId}
                    onChange={(e) => setApplicationId(e.target.value)}
                    placeholder="paste an applicationId here"
                    className="h-8 text-xs mt-1 font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    size="sm"
                    onClick={handleJoinChat}
                    disabled={!connected || !applicationId.trim()}
                    className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                  >
                    Join room
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLeaveChat}
                    disabled={!joinedRoom}
                    className="h-7 text-[10px]"
                  >
                    Leave room
                  </Button>
                </div>

                <div className="pt-2 border-t space-y-2">
                  <label className="text-[10px] font-semibold text-gray-700">
                    Send a message (via REST)
                  </label>
                  <div className="flex items-center gap-2 text-[10px] text-gray-600">
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        checked={chatFromHr}
                        onChange={() => setChatFromHr(true)}
                      />
                      HR side
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        checked={!chatFromHr}
                        onChange={() => setChatFromHr(false)}
                      />
                      Applicant side
                    </label>
                  </div>
                  <Textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a chat message..."
                    className="min-h-[60px] text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={handleSendViaApi}
                    disabled={
                      sending || !chatMessage.trim() || !applicationId.trim()
                    }
                    className="h-7 text-[10px] w-full bg-blue-600 hover:bg-blue-700 gap-1.5"
                  >
                    {sending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    POST →{" "}
                    {chatFromHr
                      ? "/admin-conversation"
                      : "/applicant-conversation"}
                  </Button>
                  <p className="text-[10px] text-gray-400">
                    The server emits <code>chat:new-message</code> back to this
                    room. If real-time works, it appears in the log.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right — event log */}
          <div className="lg:col-span-1">
            <div className="border rounded-lg bg-white overflow-hidden flex flex-col h-[600px]">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2 flex-shrink-0">
                <div>
                  <h3 className="text-xs font-semibold text-gray-800">
                    Event log
                  </h3>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                    Newest first · last 150
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClear}
                  disabled={log.length === 0}
                  className="h-7 text-[10px] gap-1.5"
                >
                  <Eraser className="h-3 w-3" />
                  Clear
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-2 space-y-1">
                {log.length === 0 ? (
                  <p className="text-[10px] text-gray-400 text-center py-6">
                    No events yet. Connect and trigger something.
                  </p>
                ) : (
                  log.map((entry) => (
                    <div
                      key={entry.id}
                      className={`border rounded px-2 py-1 ${colorFor(entry.level)}`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                        <span className="font-semibold">{entry.label}</span>
                        <span className="opacity-70">{entry.ts}</span>
                      </div>
                      {entry.payload !== undefined && (
                        <pre className="text-[10px] mt-0.5 font-mono whitespace-pre-wrap break-words opacity-90">
                          {typeof entry.payload === "string"
                            ? entry.payload
                            : JSON.stringify(entry.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;
