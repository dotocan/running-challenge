export const CHALLENGE_START = "2026-01-15T00:00:00Z";
export const CHALLENGE_END = "2026-07-01T23:59:59Z";

export const CHALLENGE_START_MS = new Date(CHALLENGE_START).getTime();
export const CHALLENGE_END_MS = new Date(CHALLENGE_END).getTime();

export const MIN_DISTANCE_KM = 5;
export const MIN_AVG_SPEED_KMH = 7.3;

export function isInDateRange(date: Date): boolean {
  const t = date.getTime();
  return t >= CHALLENGE_START_MS && t <= CHALLENGE_END_MS;
}

export function isValidActivity(distanceKm: number, avgSpeedKmh: number): boolean {
  return distanceKm >= MIN_DISTANCE_KM && avgSpeedKmh >= MIN_AVG_SPEED_KMH;
}
