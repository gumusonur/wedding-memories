import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MediaProps } from '../utils/types';

interface AppState {
  guestName: string;
  setGuestName: (name: string) => void;

  media: MediaProps[];
  setMedia: (media: MediaProps[]) => void;
  addMedia: (media: MediaProps) => void;

  isMediaModalOpen: boolean;
  selectedMediaIndex: number;
  openMediaModal: (index: number) => void;
  closeMediaModal: () => void;

  isUploadModalOpen: boolean;
  openUploadModal: () => void;
  closeUploadModal: () => void;

  lastRefreshTime: Date;
  isLoadingMedia: boolean;
  setIsLoadingMedia: (loading: boolean) => void;
  refreshMedia: () => void;

  _hasHydrated: boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, _get) => ({
      guestName: '',
      setGuestName: (name: string) => set({ guestName: name }),

      media: [],
      setMedia: (media: MediaProps[]) => set({ media }),
      addMedia: (mediaItem: MediaProps) =>
        set((state) => ({
          media: [mediaItem, ...state.media],
        })),

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

      isUploadModalOpen: false,
      openUploadModal: () => set({ isUploadModalOpen: true }),
      closeUploadModal: () => set({ isUploadModalOpen: false }),

      lastRefreshTime: new Date(),
      isLoadingMedia: false,
      setIsLoadingMedia: (loading: boolean) => set({ isLoadingMedia: loading }),
      refreshMedia: () => set({ lastRefreshTime: new Date() }),

      _hasHydrated: false,
    }),
    {
      name: 'wedding-memories-store',
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
export const useGuestName = () => useAppStore((state) => state.guestName);
export const useSetGuestName = () => useAppStore((state) => state.setGuestName);

export const useMedia = () => useAppStore((state) => state.media);
export const useSetMedia = () => useAppStore((state) => state.setMedia);
export const useAddMedia = () => useAppStore((state) => state.addMedia);

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

