export const config = { runtime: 'edge' };

const UPSTREAMS = {
  balldontlie: {
    base: 'https://api.balldontlie.io/v1',
    headers: () => ({ Authorization: process.env.BALLDONTLIE_API_KEY ?? '' }),
  },
  nhl: { base: 'https://api-web.nhle.com' },
  mlb: { base: 'https://statsapi.mlb.com' },
};

export default async function handler(req) {
  const url = new URL(req.url);
  const [, , service, ...rest] = url.pathname.split('/');
  const upstream = UPSTREAMS[service];
  if (!upstream) return new Response('Unknown upstream', { status: 404 });

  const target = `${upstream.base}/${rest.join('/')}${url.search}`;
  const headers = upstream.headers ? upstream.headers() : {};
  const upstreamRes = await fetch(target, { headers });

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers: {
      'Content-Type': upstreamRes.headers.get('Content-Type') ?? 'application/json',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
