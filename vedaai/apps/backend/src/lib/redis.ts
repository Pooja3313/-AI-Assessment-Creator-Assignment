import Redis from "ioredis";

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    redisClient.on("error", (err) => console.log("Redis error:", err));
  }
  return redisClient;
}

export async function getCachedAssignment<T>(id: string): Promise<T | null> {
  const redis = getRedis();
  const cached = await redis.get(`assignment:${id}`);
  if (!cached) return null;
  return JSON.parse(cached) as T;
}

export async function setCachedAssignment(
  id: string,
  data: unknown,
  ttlSeconds = 3600
): Promise<void> {
  const redis = getRedis();
  await redis.set(`assignment:${id}`, JSON.stringify(data), "EX", ttlSeconds);
}
