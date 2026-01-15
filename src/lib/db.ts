import Redis from "ioredis";

// Singleton instance to avoid multiple connections in dev
let redis: Redis | null = null;

const getRedis = () => {
  if (!redis) {
    const connectionString =
      import.meta.env.REDIS_CONNECTION_STRING ||
      process.env.REDIS_CONNECTION_STRING;

    if (!connectionString) {
      throw new Error("REDIS_CONNECTION_STRING is not defined");
    }

    redis = new Redis(connectionString);
  }
  return redis;
};

export const saveTokens = async (tokens: any) => {
  const client = getRedis();
  await client.set("strava_tokens", JSON.stringify(tokens));
};

export const getTokens = async () => {
  const client = getRedis();
  const tokens = await client.get("strava_tokens");
  return tokens ? JSON.parse(tokens) : null;
};
