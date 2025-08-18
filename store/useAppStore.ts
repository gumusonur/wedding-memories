import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ImageProps } from '../utils/types';

interface AppState {
  // Guest management
  guestName: string;
  setGuestName: (name: string) => void;
  
  // Photo gallery state
  photos: ImageProps[];
  setPhotos: (photos: ImageProps[]) => void;
  addPhoto: (photo: ImageProps) => void;
  
  // Modal state
  isPhotoModalOpen: boolean;
  selectedPhotoIndex: number;
  openPhotoModal: (index: number) => void;
  closePhotoModal: () => void;
  
  // Upload modal state
  isUploadModalOpen: boolean;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  
  // Gallery refresh state
  lastRefreshTime: Date;
  isLoadingPhotos: boolean;
  setIsLoadingPhotos: (loading: boolean) => void;
  refreshPhotos: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Guest management
      guestName: '',
      setGuestName: (name: string) => set({ guestName: name }),
      
      // Photo gallery state
      photos: [],
      setPhotos: (photos: ImageProps[]) => set({ photos }),
      addPhoto: (photo: ImageProps) => 
        set((state) => ({ 
          photos: [photo, ...state.photos] 
        })),
      
      // Modal state
      isPhotoModalOpen: false,
      selectedPhotoIndex: 0,
      openPhotoModal: (index: number) => 
        set({ 
          isPhotoModalOpen: true, 
          selectedPhotoIndex: index 
        }),
      closePhotoModal: () => 
        set({ 
          isPhotoModalOpen: false 
        }),
      
      // Upload modal state
      isUploadModalOpen: false,
      openUploadModal: () => set({ isUploadModalOpen: true }),
      closeUploadModal: () => set({ isUploadModalOpen: false }),
      
      // Gallery refresh state
      lastRefreshTime: new Date(),
      isLoadingPhotos: false,
      setIsLoadingPhotos: (loading: boolean) => set({ isLoadingPhotos: loading }),
      refreshPhotos: () => set({ lastRefreshTime: new Date() }),
    }),
    {
      name: 'wedding-memories-store',
      // Only persist guest name
      partialize: (state) => ({
        guestName: state.guestName,
      }),
    }
  )
);

// Selectors for better performance
export const useGuestName = () => useAppStore((state) => state.guestName);
export const useSetGuestName = () => useAppStore((state) => state.setGuestName);

export const usePhotos = () => useAppStore((state) => state.photos);
export const useSetPhotos = () => useAppStore((state) => state.setPhotos);
export const useAddPhoto = () => useAppStore((state) => state.addPhoto);

// Individual selectors to avoid object creation issues
export const usePhotoModalOpen = () => useAppStore((state) => state.isPhotoModalOpen);
export const useSelectedPhotoIndex = () => useAppStore((state) => state.selectedPhotoIndex);
export const useOpenPhotoModal = () => useAppStore((state) => state.openPhotoModal);
export const useClosePhotoModal = () => useAppStore((state) => state.closePhotoModal);

export const useUploadModalOpen = () => useAppStore((state) => state.isUploadModalOpen);
export const useOpenUploadModal = () => useAppStore((state) => state.openUploadModal);
export const useCloseUploadModal = () => useAppStore((state) => state.closeUploadModal);

export const useIsLoadingPhotos = () => useAppStore((state) => state.isLoadingPhotos);
export const useLastRefreshTime = () => useAppStore((state) => state.lastRefreshTime);
export const useSetIsLoadingPhotos = () => useAppStore((state) => state.setIsLoadingPhotos);
export const useRefreshPhotos = () => useAppStore((state) => state.refreshPhotos);