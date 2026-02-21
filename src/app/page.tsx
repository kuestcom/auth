import { KeyGenerator } from '@/features/keygen/key-generator'

export default function Home() {
  return (
    <main className="flex-1">
      <div className="container py-10 sm:py-14">
        <KeyGenerator />
      </div>
    </main>
  )
}
