import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Bihar Shramik Direct (MVP)</h1>
        <p className="mb-4">Mobile-first platform to connect customers directly with local gig workers.</p>
        <div className="space-y-2">
          <Link href="/worker/dashboard"><a className="block p-3 bg-white rounded shadow text-center">Worker Dashboard (Demo)</a></Link>
        </div>
      </div>
    </main>
  )
}
