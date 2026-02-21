'use client'

import { useModeContext } from '@/lib/mode-context'

export function ModeToggle() {
  const { currentMode, setMode, canToggle } = useModeContext()

  if (!canToggle) return null

  return (
    <div className="flex items-center">
      <div className="relative flex items-center bg-gray-100 rounded-full p-0.5 h-8">
        {/* Sliding pill */}
        <div
          className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full transition-all duration-200 ${
            currentMode === 'ocf'
              ? 'translate-x-[calc(100%+2px)] bg-[#1e3a6e]'
              : 'translate-x-0.5 bg-gray-800'
          }`}
        />

        {/* E2W button */}
        <button
          onClick={() => {
            console.log('[ModeToggle] Switching to E2W mode, current:', currentMode)
            setMode('e2w')
          }}
          className={`relative z-10 px-3 h-7 text-xs font-semibold rounded-full transition-colors duration-200 ${
            currentMode === 'e2w' ? 'text-white' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          E2W
        </button>

        {/* OCF button */}
        <button
          onClick={() => {
            console.log('[ModeToggle] Switching to OCF mode, current:', currentMode)
            setMode('ocf')
          }}
          className={`relative z-10 px-3 h-7 text-xs font-semibold rounded-full transition-colors duration-200 ${
            currentMode === 'ocf' ? 'text-white' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          OCF
        </button>
      </div>
    </div>
  )
}
