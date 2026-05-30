import { KeyGenerator } from '@/features/keygen/key-generator'
import { AppProviders } from '@/providers/app-providers'

export function App() {
  return (
    <AppProviders>
      <main className="auth-page flex-1">
        <div className="container py-10 sm:py-14">
          <KeyGenerator />
        </div>
      </main>
    </AppProviders>
  )
}
