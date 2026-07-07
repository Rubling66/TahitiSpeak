import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const maintenance = process.env.MAINTENANCE_MODE === 'true';
  const pathname = request.nextUrl.pathname;
  if (maintenance && pathname.startsWith('/api') && pathname !== '/api/health') {
    return NextResponse.json(
      { error: 'Service unavailable', maintenance: true },
      { status: 503 }
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};

