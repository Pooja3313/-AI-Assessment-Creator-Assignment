"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignmentQueue = void 0;
const bullmq_1 = require("bullmq");
exports.assignmentQueue = new bullmq_1.Queue("assignment-generation", {
    connection: {
        host: "127.0.0.1",
        port: 6379,
    },
});
