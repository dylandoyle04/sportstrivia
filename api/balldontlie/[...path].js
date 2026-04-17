export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const rest = url.pathname.replace(/^\/api\/balldontlie\/?/, '');
  const target = `https://api.balldontlie.io/v1/${rest}${url.search}`;

  const upstream = await fetch(target, {
    headers: { Authorization: process.env.BALLDONTLIE_API_KEY ?? '' },
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
