import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.base.config'

export const { auth: middleware } = NextAuth(authConfig)

export default middleware

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
