export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);

  let base, rest, authHeader;
  const nhlMatch = url.pathname.match(/\/nhl\/(.*)$/);
  if (nhlMatch) {
    base = 'https://api-web.nhle.com';
    rest = nhlMatch[1];
  } else {
    base = 'https://api.balldontlie.io/v1';
    rest = url.pathname.replace(/^\/api\/balldontlie\/?/, '');
    authHeader = process.env.BALLDONTLIE_API_KEY ?? '';
  }

  const target = `${base}/${rest}${url.search}`;
  const headers = authHeader ? { Authorization: authHeader } : {};
  const upstream = await fetch(target, { headers, redirect: 'follow' });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
