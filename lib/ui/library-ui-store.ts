import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SidebarMode = 'expanded' | 'rail'

interface LibraryUiState {
  sidebarMode: SidebarMode
  setSidebarMode: (mode: SidebarMode) => void
  toggleSidebarMode: () => void
}

export const useLibraryUiStore = create<LibraryUiState>()(
  persist(
    (set) => ({
      sidebarMode: 'expanded', // Default, will be set from component on mount
      setSidebarMode: (mode: SidebarMode) => set({ sidebarMode: mode }),
      toggleSidebarMode: () =>
        set((state) => ({
          sidebarMode: state.sidebarMode === 'expanded' ? 'rail' : 'expanded',
        })),
    }),
    {
      name: 'library-ui',
    }
  )
)

// Manually rehydrate after component sets initial value
export const rehydrateLibraryUiStore = () => {
  if (typeof window === 'undefined') return
  try {
    const stored = localStorage.getItem('library-ui')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.state?.sidebarMode) {
        useLibraryUiStore.getState().setSidebarMode(parsed.state.sidebarMode)
      }
    }
  } catch (e) {
    // Ignore errors
  }
}

