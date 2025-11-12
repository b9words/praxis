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
      sidebarMode: 'expanded',
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

