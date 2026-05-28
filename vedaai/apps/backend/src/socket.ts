import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Emitter } from "@socket.io/redis-emitter";
import Redis from "ioredis";
import type { WebSocketEvent } from "@vedaai/types";

let io: Server | null = null;
let emitter: Emitter | null = null;

function getRedisOptions() {
  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
    maxRetriesPerRequest: null,
    lazyConnect: true,
  } as const;
}

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true,
},
  });

  const opts = getRedisOptions();
  const pubClient = new Redis(opts);
  pubClient.on("error", (err) => console.log("Redis error:", err));

  const subClient = pubClient.duplicate();
  subClient.on("error", (err) => console.log("Redis error:", err));

  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    socket.on("join", (room: string) => {
      socket.join(room);
    });
  });

  return io;
}

export function initWorkerEmitter(): Emitter {
  const opts = getRedisOptions();
  const redisClient = new Redis(opts);
  redisClient.on("error", (err) => console.log("Redis error:", err));
  emitter = new Emitter(redisClient);
  return emitter;
}

export function getIo(): Server {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

export function emitAssignmentEvent(
  assignmentId: string,
  event: WebSocketEvent
): void {
  const room = `assignment:${assignmentId}`;
  const eventName = "assignment:event";

  if (io) {
    io.to(room).emit(eventName, event);
    // also emit to a namespaced event so clients can listen on `assignment:<id>` directly
    io.to(room).emit(room, event);
    return;
  }

  if (!emitter) {
    emitter = initWorkerEmitter();
  }
  emitter.to(room).emit(eventName, event);
  emitter.to(room).emit(room, event);
}

export { io };
