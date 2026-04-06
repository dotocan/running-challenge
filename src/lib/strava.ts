import { getTokens, saveTokens, getManualActivities } from "./db";

export interface DashboardData {
  activities: any[];
  totalDistance: number;
  totalOverallDistance: number;
  runCount: number;
  errorMsg: string;
}

export const fetchDashboardData = async (): Promise<DashboardData> => {
  let activities: any[] = [];
  let totalDistance = 0;
  let totalOverallDistance = 0;
  let runCount = 0;
  let errorMsg = "";

  try {
    let tokens = await getTokens();

    if (tokens) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (tokens.expires_at && nowSeconds > tokens.expires_at) {
        console.log("Tokens expired, refreshing...");
        const clientId =
          import.meta.env.STRAVA_CLIENT_ID || process.env.STRAVA_CLIENT_ID;
        const clientSecret =
          import.meta.env.STRAVA_CLIENT_SECRET ||
          process.env.STRAVA_CLIENT_SECRET;

        const refreshRes = await fetch("https://www.strava.com/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
            refresh_token: tokens.refresh_token,
          }),
        });

        if (!refreshRes.ok) {
          throw new Error("Failed to refresh token");
        }

        const newTokens = await refreshRes.json();
        tokens = newTokens;
        await saveTokens(tokens);
      }

      const startDate = new Date("2026-01-15T00:00:00Z").getTime() / 1000;
      const endDate = new Date("2026-07-01T23:59:59Z").getTime() / 1000;

      const activitiesRes = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?per_page=200&after=${startDate}&before=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        },
      );

      if (activitiesRes.ok) {
        const rawActivities = await activitiesRes.json();

        const stravaActivities = rawActivities
          .filter((a: any) => a.type === "Run" || a.type === "Soccer")
          .map((run: any) => {
            const distanceKm = run.distance / 1000;
            const avgSpeedKmh = run.average_speed * 3.6;

            const isRed = avgSpeedKmh < 7.3 || distanceKm < 5;

            return {
              id: run.id,
              name: run.name,
              type: run.type,
              date: new Date(run.start_date),
              distanceKm: distanceKm,
              avgSpeedKmh: avgSpeedKmh,
              isRed: isRed,
              source: "strava",
              formattedDate: new Date(run.start_date).toLocaleDateString(
                "en-GB",
                {
                  day: "numeric",
                  month: "numeric",
                  year: "numeric",
                },
              ),
            };
          });

        const startDateMs = startDate * 1000;
        const endDateMs = endDate * 1000;
        const manualActivities = (await getManualActivities())
          .filter((run) => {
            const t = new Date(run.date).getTime();
            return t >= startDateMs && t <= endDateMs;
          })
          .map((run) => {
          const durationHours = run.durationMs / 3_600_000;
          const avgSpeedKmh = durationHours > 0 ? run.distanceKm / durationHours : 0;
          const isRed = avgSpeedKmh < 7.3 || run.distanceKm < 5;

          return {
            id: run.id,
            name: run.name,
            type: run.type || "Run",
            date: new Date(run.date),
            distanceKm: run.distanceKm,
            avgSpeedKmh: avgSpeedKmh,
            isRed: isRed,
            source: run.source,
            formattedDate: new Date(run.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "numeric",
              year: "numeric",
            }),
          };
        });

        // Deduplicate: if a manual activity falls on the same day and has
        // similar distance (within 20%) to a Strava activity, drop it.
        const deduped = manualActivities.filter((manual) => {
          const manualDay = manual.date.toISOString().slice(0, 10);
          return !stravaActivities.some((strava: any) => {
            const stravaDay = strava.date.toISOString().slice(0, 10);
            if (manualDay !== stravaDay) return false;
            const diff = Math.abs(manual.distanceKm - strava.distanceKm);
            return diff / Math.max(manual.distanceKm, strava.distanceKm) < 0.2;
          });
        });

        activities = [...stravaActivities, ...deduped]
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const validRuns = activities.filter((a) => !a.isRed);
        runCount = validRuns.length;
        totalDistance = validRuns.reduce((sum, run) => sum + run.distanceKm, 0);
        totalOverallDistance = activities.reduce(
          (sum, run) => sum + run.distanceKm,
          0,
        );
      } else {
        errorMsg = "Failed to fetch activities from Strava.";
      }
    } else {
      errorMsg = "No Strava tokens found. Please visit /admin/login to connect.";
    }
  } catch (e: any) {
    console.error(e);
    errorMsg = `Error: ${e.message}`;
  }

  return { activities, totalDistance, totalOverallDistance, runCount, errorMsg };
};
