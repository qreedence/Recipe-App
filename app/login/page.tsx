import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Sign in · Recipebook',
}

export default function LoginPage() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl uppercase tracking-wider">
            <span className="font-black text-orange-500">Recipe</span>
            <span className="font-light text-orange-300">book</span>
          </h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
