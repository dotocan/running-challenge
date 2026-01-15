import type { APIRoute } from "astro";

export const GET: APIRoute = ({ redirect }) => {
  const clientId =
    import.meta.env.STRAVA_CLIENT_ID || process.env.STRAVA_CLIENT_ID;
  const redirectUri =
    import.meta.env.STRAVA_REDIRECT_URI || "http://localhost:4321/api/callback";
  const scope = "activity:read_all";

  if (!clientId) {
    return new Response("Missing STRAVA_CLIENT_ID", { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scope,
  });

  return redirect(
    `https://www.strava.com/oauth/authorize?${params.toString()}`,
  );
};
