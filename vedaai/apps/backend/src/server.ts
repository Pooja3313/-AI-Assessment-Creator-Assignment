if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("dotenv/config");
}
import http from "http";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import assignmentsRouter from "./routes/assignments";
import { initSocket } from "./socket";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/assignments", assignmentsRouter);

const httpServer = http.createServer(app);
const io = initSocket(httpServer);

export { io };
async function start() {
  const mongoUri = process.env.MONGODB_URI!;

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
