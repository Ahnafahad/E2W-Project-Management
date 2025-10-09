'use client'

import { useState, useEffect } from 'react'
import Image from "next/image"
import Link from "next/link"
import { signOut } from 'next-auth/react'
import { Search, Bell, Settings, User, LogOut, ChevronDown, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from '@/lib/context'
import { getInitials } from '@/lib/utils'
import { GlobalSearch } from '@/components/search/global-search'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps = {}) {
  const { user } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showGlobalSearch, setShowGlobalSearch] = useState(false)

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
    setShowUserMenu(false)
  }

  // Global search keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowGlobalSearch(true)
      }
      if (e.key === 'Escape') {
        setShowGlobalSearch(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="h-full flex items-center justify-between px-4 lg:px-8">
        {/* Mobile Menu Button + Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          {onMenuClick && (
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={onMenuClick}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/E2W Black Logo.png"
            alt="E2W Global"
            width={32}
            height={32}
            priority
          />
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-gray-900">E2W</span>
              <span className="text-xs text-gray-500 hidden sm:block">PROJECT MANAGEMENT</span>
            </div>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4 lg:mx-8 hidden sm:block">
          <button
            onClick={() => setShowGlobalSearch(true)}
            className="w-full flex items-center gap-3 px-3 py-2 text-left border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-gray-50"
          >
            <Search className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500 hidden md:inline">Search tasks, projects...</span>
            <span className="text-gray-500 md:hidden">Search...</span>
            <div className="ml-auto items-center gap-1 text-xs text-gray-400 hidden lg:flex">
              <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">⌘</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">K</kbd>
            </div>
          </button>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1 lg:gap-2">
          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="sm"
            className="sm:hidden"
            onClick={() => setShowGlobalSearch(true)}
          >
            <Search className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Bell className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Settings className="w-4 h-4" />
          </Button>

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <span className="text-xs font-medium text-gray-600">
                    {user ? getInitials(user.name) : 'U'}
                  </span>
                )}
              </div>
              <span className="hidden lg:inline text-sm">{user?.name || 'User'}</span>
              <ChevronDown className="w-3 h-3 hidden sm:block" />
            </Button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>

                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>

                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />
    </header>
  )
}