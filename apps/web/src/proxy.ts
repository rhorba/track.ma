import { NextRequest, NextResponse } from 'next/server';

// Hosts that are NOT org subdomains
const ROOT_HOSTS = new Set(['trackma.ma', 'www.trackma.ma', 'localhost', '127.0.0.1']);

export function proxy(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  // Strip port for local dev (localhost:3000 → localhost)
  const hostname = host.split(':')[0];

  const isRoot = ROOT_HOSTS.has(hostname);
  if (!isRoot) {
    // Extract subdomain: acme.trackma.ma → acme
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const slug = parts[0];
      const res = NextResponse.next();
      res.headers.set('x-org-slug', slug);
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
