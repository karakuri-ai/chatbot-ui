import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/', '/index'],
};
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME || '';
const map = BASIC_AUTH_USERNAME.split(',').reduce<Record<string, string>>(
  (acc, cur) => {
    const [key, value] = cur.split(':');
    acc[key] = value;
    return acc;
  },
  {},
);
export function middleware(req: NextRequest) {
  if (!BASIC_AUTH_USERNAME) {
    return NextResponse.next();
  }
  const basicAuth = req.headers.get('authorization');
  const url = req.nextUrl;

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    if (map[user] === pwd) {
      return NextResponse.next();
    }
  }
  url.pathname = '/api/auth';

  return NextResponse.rewrite(url);
}
