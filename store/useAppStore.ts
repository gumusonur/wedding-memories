import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MediaProps } from '../utils/types';

interface AppState {
  // Guest management
  guestName: string;
  setGuestName: (name: string) => void;

  // Media gallery state
  media: MediaProps[];
  setMedia: (media: MediaProps[]) => void;
  addMedia: (media: MediaProps) => void;

  // Modal state
  isMediaModalOpen: boolean;
  selectedMediaIndex: number;
  openMediaModal: (index: number) => void;
  closeMediaModal: () => void;

  // Upload modal state
  isUploadModalOpen: boolean;
  openUploadModal: () => void;
  closeUploadModal: () => void;

  // Gallery refresh state
  lastRefreshTime: Date;
  isLoadingMedia: boolean;
  setIsLoadingMedia: (loading: boolean) => void;
  refreshMedia: () => void;


  // Internal state
  _hasHydrated: boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Guest management
      guestName: '',
      setGuestName: (name: string) => set({ guestName: name }),

      // Media gallery state
      media: [],
      setMedia: (media: MediaProps[]) => set({ media }),
      addMedia: (mediaItem: MediaProps) =>
        set((state) => ({
          media: [mediaItem, ...state.media],
        })),

      // Modal state
      isMediaModalOpen: false,
      selectedMediaIndex: 0,
      openMediaModal: (index: number) =>
        set({
          isMediaModalOpen: true,
          selectedMediaIndex: index,
        }),
      closeMediaModal: () =>
        set({
          isMediaModalOpen: false,
        }),

      // Upload modal state
      isUploadModalOpen: false,
      openUploadModal: () => set({ isUploadModalOpen: true }),
      closeUploadModal: () => set({ isUploadModalOpen: false }),

      // Gallery refresh state
      lastRefreshTime: new Date(),
      isLoadingMedia: false,
      setIsLoadingMedia: (loading: boolean) => set({ isLoadingMedia: loading }),
      refreshMedia: () => set({ lastRefreshTime: new Date() }),


      // Internal state
      _hasHydrated: false,
    }),
    {
      name: 'wedding-memories-store',
      // Only persist guest name
      partialize: (state) => ({
        guestName: state.guestName,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    }
  )
);

// Selectors for better performance
export const useGuestName = () => useAppStore((state) => state.guestName);
export const useSetGuestName = () => useAppStore((state) => state.setGuestName);

export const useMedia = () => useAppStore((state) => state.media);
export const useSetMedia = () => useAppStore((state) => state.setMedia);
export const useAddMedia = () => useAppStore((state) => state.addMedia);

// Individual selectors to avoid object creation issues
export const useMediaModalOpen = () => useAppStore((state) => state.isMediaModalOpen);
export const useSelectedMediaIndex = () => useAppStore((state) => state.selectedMediaIndex);
export const useOpenMediaModal = () => useAppStore((state) => state.openMediaModal);
export const useCloseMediaModal = () => useAppStore((state) => state.closeMediaModal);

export const useUploadModalOpen = () => useAppStore((state) => state.isUploadModalOpen);
export const useOpenUploadModal = () => useAppStore((state) => state.openUploadModal);
export const useCloseUploadModal = () => useAppStore((state) => state.closeUploadModal);

export const useIsLoadingMedia = () => useAppStore((state) => state.isLoadingMedia);
export const useLastRefreshTime = () => useAppStore((state) => state.lastRefreshTime);
export const useSetIsLoadingMedia = () => useAppStore((state) => state.setIsLoadingMedia);
export const useRefreshMedia = () => useAppStore((state) => state.refreshMedia);
export const useHasHydrated = () => useAppStore((state) => state._hasHydrated);

