import { SignupForm } from '@/components/auth/signup-form'

export const metadata = {
  title: 'Sign up · Recipebook',
}

export default function SignupPage() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl uppercase tracking-wider">
            <span className="font-black text-orange-500">Recipe</span>
            <span className="font-light text-orange-300">book</span>
          </h1>
          <p className="text-sm text-muted-foreground">Create your account</p>
        </div>
        <SignupForm />
      </div>
    </main>
  )
}
