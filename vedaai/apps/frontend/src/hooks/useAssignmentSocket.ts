"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import type { WebSocketEvent } from "@vedaai/types";
import { useAssignmentStore } from "@/store/assignmentStore";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function useAssignmentSocket(assignmentId: string | null) {
  const setStatus = useAssignmentStore((s) => s.setStatus);
  const setAssignment = useAssignmentStore((s) => s.setAssignment);

  useEffect(() => {
    if (!assignmentId) return;

    const socket: Socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
    });

    const room = `assignment:${assignmentId}`;

    socket.on("connect", () => {
      socket.emit("join", room);
    });

    const handleEvent = (event: WebSocketEvent) => {
      if (event.assignmentId !== assignmentId) return;

      switch (event.type) {
        case "JOB_STARTED":
        case "JOB_PROGRESS":
          setStatus(
            "processing",
            event.progress ?? 0,
            event.message ?? "Generating assessment..."
          );
          break;
        case "JOB_COMPLETED":
          setStatus("completed", 100, "Generation complete");
          if (event.data) {
            setAssignment(event.data);
          }
          break;
        case "JOB_FAILED":
          setStatus("failed", 0, event.message ?? "Generation failed");
          break;
      }
    };

    socket.on("assignment:event", handleEvent);
    socket.on(room, handleEvent);

    return () => {
      socket.off("assignment:event", handleEvent);
      socket.off(room, handleEvent);
      socket.disconnect();
    };
  }, [assignmentId, setStatus, setAssignment]);
}