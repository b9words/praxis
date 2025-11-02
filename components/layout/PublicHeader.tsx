import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PublicHeader() {
  return (
    <nav className="border-b border-neutral-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-lg font-semibold text-neutral-900 tracking-tight relative">
            Execemy
            <div className="absolute -bottom-1 left-0 w-full h-[0.5px] bg-neutral-900"></div>
          </Link>
          <div className="flex gap-4">
            <Button asChild variant="ghost" size="sm" className="text-neutral-700 rounded-none">
              <Link href="/login">Authenticate</Link>
            </Button>
            <Button asChild size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-none">
              <Link href="/signup">Request Access</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}



