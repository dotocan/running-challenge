import type { APIRoute } from 'astro';
import { saveTokens } from '../../lib/db';

export const GET: APIRoute = async ({ request, redirect }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return new Response(`Error: ${error}`, { status: 400 });
  }

  if (!code) {
    return new Response('No code provided', { status: 400 });
  }

  const clientId = import.meta.env.STRAVA_CLIENT_ID || process.env.STRAVA_CLIENT_ID;
  const clientSecret = import.meta.env.STRAVA_CLIENT_SECRET || process.env.STRAVA_CLIENT_SECRET;
  const allowedId = import.meta.env.ALLOWED_STRAVA_ID || process.env.ALLOWED_STRAVA_ID;

  if (!clientId || !clientSecret || !allowedId) {
    return new Response('Server misconfigured (missing env vars)', { status: 500 });
  }

  try {
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
      }),
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
        return new Response(`Strava Error: ${JSON.stringify(data)}`, { status: tokenResponse.status });
    }

    if (String(data.athlete.id) !== String(allowedId)) {
        return new Response('Unauthorized Athlete', { status: 403 });
    }

    await saveTokens(data);

    return redirect('/');
  } catch (e: any) {
    return new Response(`Server Error: ${e.message}`, { status: 500 });
  }
};
