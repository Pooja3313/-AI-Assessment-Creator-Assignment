"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("dotenv/config");
}
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const assignments_1 = __importDefault(require("./routes/assignments"));
const socket_1 = require("./socket");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.json({ limit: "10mb" }));
// ROOT ROUTE
app.get("/", (_req, res) => {
    res.send("Backend Running Successfully");
});
// HEALTH ROUTE
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/api/assignments", assignments_1.default);
const httpServer = http_1.default.createServer(app);
let io;
async function start() {
    console.log("MONGODB_URL:", process.env.MONGODB_URL);
    console.log("REDIS_URL:", process.env.REDIS_URL);
    const mongoUri = process.env.MONGODB_URL;
    await mongoose_1.default.connect(mongoUri);
    console.log("Connected to MongoDB");
    exports.io = io = (0, socket_1.initSocket)(httpServer);
    httpServer.listen(Number(PORT), "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
    });
}
start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
