import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAuthPage = nextUrl.pathname.startsWith('/login')
      const isPublicPage = nextUrl.pathname === '/'

      if (isAuthPage) {
        if (isLoggedIn) return false // Redirect authenticated users away from login
        return true // Allow unauthenticated access to login
      }

      if (!isLoggedIn && !isPublicPage) {
        return false // Redirect unauthenticated users to login
      }

      return true
    },
  },
  providers: [],
}
