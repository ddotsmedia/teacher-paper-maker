import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

/** Routes that require an authenticated session. */
const PROTECTED_PREFIXES = ['/dashboard', '/onboarding', '/settings', '/worksheet', '/templates'];

/**
 * Edge-safe Auth.js config: providers and callbacks that do NOT need Node APIs
 * (no bcrypt, no Prisma). The Credentials provider and Prisma adapter are added
 * in `auth.ts`, which runs only in the Node.js runtime.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24, // 24 hours
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname } = request.nextUrl;
      const isProtected = PROTECTED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      );
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
    session({ session, token }) {
      // With the JWT strategy, the user id is stored in the standard `sub` claim.
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
