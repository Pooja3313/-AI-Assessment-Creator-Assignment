"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = getRedis;
exports.getCachedAssignment = getCachedAssignment;
exports.setCachedAssignment = setCachedAssignment;
const ioredis_1 = __importDefault(require("ioredis"));
let redisClient = null;
function getRedis() {
    if (!redisClient) {
        redisClient = new ioredis_1.default(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
            maxRetriesPerRequest: null,
            lazyConnect: true,
        });
        redisClient.on("error", (err) => console.log("Redis error:", err));
    }
    return redisClient;
}
async function getCachedAssignment(id) {
    const redis = getRedis();
    const cached = await redis.get(`assignment:${id}`);
    if (!cached)
        return null;
    return JSON.parse(cached);
}
async function setCachedAssignment(id, data, ttlSeconds = 3600) {
    const redis = getRedis();
    await redis.set(`assignment:${id}`, JSON.stringify(data), "EX", ttlSeconds);
}
