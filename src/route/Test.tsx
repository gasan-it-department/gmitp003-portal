import { useState, useEffect } from "react";
import CameraWithCapture from "@/layout/CameraWithCapture";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import { io } from "socket.io-client";
import { generateSecureRef } from "@/utils/helper";

interface AreaProps {
  width: number;
  height: number;
  x: number;
  y: number;
  page: number;
  id: string;
}

// In your React component
const socket = io("http://localhost:3000", {
  withCredentials: true,
  transports: ["websocket", "polling"],
  // Add these configurations
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  // Ping settings
  // Force WebSocket if available
  forceNew: true,
  // Add if you're behind a proxy
  // path: "/socket.io/",
});
function DraggableBox() {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "signature-box",
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        ...style,
        width: 120,
        height: 50,
        border: "2px dashed blue",
        cursor: "move",
        background: "white",
        textAlign: "center",
        lineHeight: "50px",
      }}
    >
      Drag Me
    </div>
  );
}

function DropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "drop-zone" });

  return (
    <div
      ref={setNodeRef}
      id="drop-zone"
      style={{
        position: "relative",
        width: "100%",
        height: "80vh",
        border: "2px solid gray",
        background: isOver ? "rgba(0,255,0,0.1)" : "transparent",
      }}
    >
      {children}
    </div>
  );
}

export default function Test() {
  const [areas, setAreas] = useState<AreaProps[]>([]);
  const [mesasge, setMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [id, setId] = useState("");

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.over?.id === "drop-zone") {
      console.log("Dropped inside drop-zone ✅");

      const rect = event.active.rect.current.translated;
      if (!rect) return;

      const dropZone = document.getElementById("drop-zone");
      if (!dropZone) return;
      const dzRect = dropZone.getBoundingClientRect();

      const x = rect.left - dzRect.left;
      const y = rect.top - dzRect.top;

      const newArea = {
        x,
        y,
        page: 1,
        width: 120,
        height: 50,
        id: generateSecureRef(),
      };

      setAreas((prev) => [...prev, newArea]);

      // Emit the new area to socket
      if (socketConnected) {
        socket.emit("new_area", newArea);
      }
    }
  };

  useEffect(() => {
    // Socket connection events
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setSocketConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Listen for incoming messages
    socket.on("message_received", (data) => {
      console.log("Message from server:", data);
      alert(data.message);
    });

    // Listen for areas from other clients
    socket.on("new_area_broadcast", (area) => {
      console.log("New area from other client:", area);
      setAreas((prev) => [...prev, area]);
    });

    // Cleanup
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("message_received");
      socket.off("new_area_broadcast");
    };
  }, []);

  return (
    <>
      <div
        style={{
          padding: "10px",
          background: socketConnected ? "green" : "red",
          color: "white",
          marginBottom: "10px",
        }}
      >
        Socket: {socketConnected ? `Connected (${socket.id})` : "Disconnected"}
      </div>
      <CameraWithCapture />
      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <DropZone>
          {areas.map((area, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: area.y,
                left: area.x,
                width: area.width,
                height: area.height,
                border: "2px dashed red",
                background: "rgba(255,0,0,0.1)",
              }}
            >
              Signature Here
            </div>
          ))}
        </DropZone>

        {/* toolbox */}
        <div style={{ marginTop: "20px" }}>
          <DraggableBox />
        </div>
      </DndContext>
      <input
        placeholder="ID"
        onChange={(e) => setId(e.target.value)}
        className="border"
      />
      <input
        placeholder="Message"
        onChange={(e) => setMessage(e.target.value)}
        className="border"
      />
      <button
        className=" border hover:border-neutral-300"
        onClick={() =>
          socket.emit("send_message_123", {
            message: mesasge,
            areas: areas,
            id,
          })
        }
        style={{ marginTop: "20px", padding: "10px" }}
      >
        Send Test Message to Server
      </button>
    </>
  );
}
