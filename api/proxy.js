export const config = { runtime: 'edge' };

const UPSTREAMS = {
  balldontlie: {
    base: 'https://api.balldontlie.io/v1',
    auth: () => ({ Authorization: process.env.BALLDONTLIE_API_KEY ?? '' }),
  },
  hockey: { base: 'https://api-web.nhle.com' },
  puck: { base: 'https://api-web.nhle.com' },
};

export default async function handler(req) {
  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const service = parts[1];
  const rest = parts.slice(2).join('/');

  const upstream = UPSTREAMS[service];
  if (!upstream) {
    return new Response(
      JSON.stringify({ error: 'unknown service', pathname: url.pathname, service, url: req.url }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const target = `${upstream.base}/${rest}${url.search}`;
  const headers = upstream.auth ? upstream.auth() : {};
  const upstreamRes = await fetch(target, { headers, redirect: 'follow' });

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers: {
      'Content-Type': upstreamRes.headers.get('Content-Type') ?? 'application/json',
      'Cache-Control': 'public, max-age=60',
      'X-Debug-Url': req.url,
      'X-Debug-Service': service,
      'X-Debug-Pathname': url.pathname,
    },
  });
}
