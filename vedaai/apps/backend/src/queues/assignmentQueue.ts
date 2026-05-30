import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
});

export const assignmentQueue = new Queue("assignment-generation", {
  connection: connection as any,
});

export interface AssignmentJobData {
  assignmentId: string;
}
