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

export const setDashboardCache = async (data: any) => {
  const client = getRedis();
  await client.set("cached_dashboard_data", JSON.stringify(data));
};

export const getDashboardCache = async () => {
  const client = getRedis();
  const data = await client.get("cached_dashboard_data");
  return data ? JSON.parse(data) : null;
};
