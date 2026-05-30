"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
exports.initSocket = initSocket;
exports.initWorkerEmitter = initWorkerEmitter;
exports.getIo = getIo;
exports.emitAssignmentEvent = emitAssignmentEvent;
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_emitter_1 = require("@socket.io/redis-emitter");
const ioredis_1 = __importDefault(require("ioredis"));
let io = null;
exports.io = io;
let emitter = null;
function initSocket(httpServer) {
    exports.io = io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    const pubClient = new ioredis_1.default(process.env.REDIS_URL || "redis://127.0.0.1:6379");
    pubClient.on("error", (err) => console.log("Redis error:", err));
    const subClient = pubClient.duplicate();
    subClient.on("error", (err) => console.log("Redis error:", err));
    io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
    io.on("connection", (socket) => {
        socket.on("join", (room) => {
            socket.join(room);
        });
    });
    return io;
}
function initWorkerEmitter() {
    const redisClient = new ioredis_1.default(process.env.REDIS_URL || "redis://127.0.0.1:6379");
    redisClient.on("error", (err) => console.log("Redis error:", err));
    emitter = new redis_emitter_1.Emitter(redisClient);
    return emitter;
}
function getIo() {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
}
function emitAssignmentEvent(assignmentId, event) {
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
