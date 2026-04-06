import type { APIRoute } from "astro";
import { addManualActivities, deleteManualActivity } from "../../lib/db";
import type { ManualActivity } from "../../lib/db";

export const prerender = false;

function isAuthenticated(request: Request): boolean {
  const adminPassword =
    import.meta.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;

  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/admin_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) === adminPassword : false;
}

const unauthorized = () =>
  new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

export const POST: APIRoute = async ({ request }) => {
  if (!isAuthenticated(request)) return unauthorized();
  try {
    const body = await request.json();
    const activities: ManualActivity[] = body.activities;

    if (!Array.isArray(activities) || activities.length === 0) {
      return new Response(JSON.stringify({ error: "No activities provided" }), {
        status: 400,
      });
    }

    const saved = await addManualActivities(activities);
    return new Response(
      JSON.stringify({ ok: true, count: activities.length, total: saved.length }),
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  if (!isAuthenticated(request)) return unauthorized();
  try {
    const { id } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: "No id provided" }), {
        status: 400,
      });
    }

    const remaining = await deleteManualActivity(id);
    return new Response(JSON.stringify({ ok: true, remaining: remaining.length }));
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
