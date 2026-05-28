import { Queue } from "bullmq";

export const assignmentQueue = new Queue("assignment-generation", {
  connection: {
    host: "127.0.0.1",
    port: 6379,
  },
});

export interface AssignmentJobData {
  assignmentId: string;
}
