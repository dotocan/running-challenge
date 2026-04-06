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

export interface ManualActivity {
  id: string;
  name: string;
  type: string;
  date: string;
  distanceKm: number;
  durationMs: number;
  source: string;
}

const MANUAL_ACTIVITIES_KEY = "manual_activities";

export const getManualActivities = async (): Promise<ManualActivity[]> => {
  const client = getRedis();
  const data = await client.get(MANUAL_ACTIVITIES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveManualActivities = async (activities: ManualActivity[]) => {
  const client = getRedis();
  await client.set(MANUAL_ACTIVITIES_KEY, JSON.stringify(activities));
};

export const addManualActivities = async (newActivities: ManualActivity[]) => {
  const existing = await getManualActivities();
  const merged = [...existing, ...newActivities];
  await saveManualActivities(merged);
  return merged;
};

export const deleteManualActivity = async (id: string) => {
  const existing = await getManualActivities();
  const filtered = existing.filter((a) => a.id !== id);
  await saveManualActivities(filtered);
  return filtered;
};

