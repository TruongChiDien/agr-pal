import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Đăng nhập - agr-pal',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
