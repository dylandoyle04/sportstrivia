export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const rest = url.pathname.replace(/^\/api\/mlb\/?/, '');
  const target = `https://statsapi.mlb.com/${rest}${url.search}`;

  const upstream = await fetch(target);

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
