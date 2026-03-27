import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = ({ request }) => {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken =
    import.meta.env.STRAVA_VERIFY_TOKEN || process.env.STRAVA_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === "subscribe" && token === verifyToken) {
      console.log("STRAVA WEBHOOK VERIFIED");
      return new Response(JSON.stringify({ "hub.challenge": challenge }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } else {
      return new Response("Forbidden", { status: 403 });
    }
  }

  return new Response("OK", { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    console.log("Strava webhook event received:", body);

    const buildHook =
      import.meta.env.NETLIFY_BUILD_HOOK || process.env.NETLIFY_BUILD_HOOK;

    if (buildHook) {
      // Fire and forget: Trigger Netlify build hook to generate static site with new data
      fetch(buildHook, { method: "POST" }).catch((err) => {
        console.error("Failed to trigger Netlify build hook:", err);
      });
    } else {
      console.warn("No NETLIFY_BUILD_HOOK environment variable configured.");
    }
  } catch (err) {
    console.error("Error parsing webhook body:", err);
  }

  // Strava requires a 200 response within 2 seconds
  return new Response("EVENT_RECEIVED", { status: 200 });
};
