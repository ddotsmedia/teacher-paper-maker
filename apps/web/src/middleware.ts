import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Edge middleware uses only the edge-safe config (no bcrypt / Prisma). The
// `authorized` callback in authConfig enforces protected-route redirects.
export default NextAuth(authConfig).auth;

export const config = {
  // Run on everything except static assets, images, and the Auth.js API routes.
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
