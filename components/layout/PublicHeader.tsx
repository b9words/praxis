'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function PublicHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  const navLinks = [
    { href: '/#method', label: 'Method' },
    { href: '/#curriculum', label: 'Curriculum' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/ledger', label: 'The Ledger' },
  ]

  return (
    <>
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-12">
              <Link href="/" className="text-lg font-semibold text-neutral-900 tracking-tight relative">
                Execemy
                <div className="absolute -bottom-1 left-0 w-full h-[0.5px] bg-neutral-900"></div>
              </Link>
              <div className="hidden md:flex gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors relative"
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-[0.5px] bg-neutral-900 transition-all duration-300 hover:w-full"></span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex gap-4 items-center">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-neutral-700 hover:text-neutral-900 transition-colors"
                aria-label="Toggle menu"
              >
                <div className="relative w-6 h-6">
                  <span
                    className={`absolute top-0 left-0 w-6 h-[2px] bg-current transition-all duration-300 ${
                      isMobileMenuOpen ? 'rotate-45 top-3' : ''
                    }`}
                  />
                  <span
                    className={`absolute top-3 left-0 w-6 h-[2px] bg-current transition-all duration-300 ${
                      isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                  <span
                    className={`absolute top-6 left-0 w-6 h-[2px] bg-current transition-all duration-300 ${
                      isMobileMenuOpen ? '-rotate-45 top-3' : ''
                    }`}
                  />
                </div>
              </button>
              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex gap-4">
                <Button asChild variant="ghost" size="sm" className="text-neutral-700 rounded-none">
                  <Link href="/login">Authenticate</Link>
                </Button>
                <Button asChild size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-none">
                  <Link href="/signup">Request Access</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-neutral-900/50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Slide-in Menu */}
        <div
          className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-xl transition-transform duration-300 ease-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">Menu</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-neutral-700 hover:text-neutral-900 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-6 py-6 overflow-y-auto">
              <ul className="space-y-1">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 text-base font-medium text-neutral-900 hover:bg-neutral-50 rounded-md transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Auth Buttons */}
            <div className="px-6 py-4 border-t border-neutral-200 space-y-3">
              <Button
                asChild
                variant="outline"
                className="w-full border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-none"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Link href="/login">Authenticate</Link>
              </Button>
              <Button
                asChild
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-none"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Link href="/signup">Request Access</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
