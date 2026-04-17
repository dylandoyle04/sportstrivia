export const config = { runtime: 'edge' };

const UPSTREAMS = {
  balldontlie: {
    base: 'https://api.balldontlie.io/v1',
    auth: () => ({ Authorization: process.env.BALLDONTLIE_API_KEY ?? '' }),
  },
  hockey: { base: 'https://api-web.nhle.com' },
};

export default async function handler(req) {
  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);

  const service = url.searchParams.get('_service') ?? parts[1];
  const pathFromQuery = url.searchParams.get('_path');
  const rest = pathFromQuery ?? parts.slice(2).join('/');

  const upstream = UPSTREAMS[service];
  if (!upstream) {
    return new Response(`Unknown service: ${service}`, { status: 404 });
  }

  const passthrough = new URLSearchParams(url.searchParams);
  passthrough.delete('_service');
  passthrough.delete('_path');
  const qs = passthrough.toString();

  const target = `${upstream.base}/${rest}${qs ? `?${qs}` : ''}`;
  const headers = upstream.auth ? upstream.auth() : {};
  const upstreamRes = await fetch(target, { headers, redirect: 'follow' });

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers: {
      'Content-Type': upstreamRes.headers.get('Content-Type') ?? 'application/json',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
