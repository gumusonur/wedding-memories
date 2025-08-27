'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { appConfig, StorageProvider } from '../config';

import { Button } from './ui/button';
import { useGuestName, useSetGuestName, useAddMedia } from '../store/useAppStore';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from './ui/input';
import { validateGuestNameForUI, validateGuestName, validateMediaFile } from '../utils/validation';
import { Progress } from './ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Upload as UploadIcon,
  X,
  Check,
  Trash2,
  Edit,
  Plus,
  Camera,
  Square,
  CheckSquare,
  Trash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import type { UploadFile, MediaProps } from '../utils/types';
import { formatFileSize, getCompressionInfo } from '../utils/clientUtils';
import { useI18n } from './I18nProvider';

interface UploadProps {
  currentGuestName?: string;
}

export const Upload = ({ currentGuestName }: UploadProps) => {
  const guestName = useGuestName();
  const setGuestName = useSetGuestName();
  const addMedia = useAddMedia();
  const { t } = useI18n();

  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [currentNameValue, setCurrentNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateName = (name: string): string | null => {
    return validateGuestNameForUI(name, t);
  };

  useEffect(() => {
    if (currentGuestName && currentGuestName !== guestName) {
      setGuestName(currentGuestName);
    }
  }, [currentGuestName, guestName, setGuestName]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // lg breakpoint
    };

    checkScreenSize();

    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const isValidMediaFile = (file: File): boolean => {
    try {
      const isS3Storage = appConfig.storage === StorageProvider.S3;

      return validateMediaFile(file, isS3Storage, !isS3Storage);
    } catch (error) {
      console.warn('File validation error:', error);
      return false;
    }
  };

  const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // For video files, create thumbnail only on desktop
        if (file.type.startsWith('video/')) {
          console.log('Video file detected');
          // On mobile, skip thumbnail creation (will use Image component with direct URL)
          if (window.innerWidth < 1024) {
            console.log('Mobile detected, skipping video thumbnail');
            resolve('');
            return;
          }
          
          console.log('Desktop detected, creating video thumbnail');
          // Desktop: Create canvas thumbnail
          const video = document.createElement('video');
          video.muted = true;
          video.preload = 'metadata';
          video.crossOrigin = 'anonymous';
          
          const timeoutId = setTimeout(() => {
            console.warn('Video thumbnail timeout');
            resolve('');
          }, 5000);
          
          video.onloadedmetadata = () => {
            try {
              console.log('Video metadata loaded, seeking to frame');
              // Seek to 0.5 seconds or 10% of duration
              video.currentTime = Math.min(0.5, video.duration * 0.1);
            } catch (error) {
              console.warn('Error seeking:', error);
              clearTimeout(timeoutId);
              resolve('');
            }
          };
          
          video.onseeked = () => {
            try {
              console.log('Video seeked, creating canvas thumbnail');
              const canvas = document.createElement('canvas');
              const size = 200;
              canvas.width = size;
              canvas.height = size;
              const ctx = canvas.getContext('2d');
              
              if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
                // Simple center crop
                const aspectRatio = video.videoWidth / video.videoHeight;
                let sx = 0, sy = 0, sWidth = video.videoWidth, sHeight = video.videoHeight;
                
                if (aspectRatio > 1) {
                  sWidth = video.videoHeight;
                  sx = (video.videoWidth - sWidth) / 2;
                } else {
                  sHeight = video.videoWidth;
                  sy = (video.videoHeight - sHeight) / 2;
                }
                
                console.log('Drawing video frame to canvas');
                ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, size, size);
                const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
                
                clearTimeout(timeoutId);
                URL.revokeObjectURL(video.src);
                console.log('Thumbnail created successfully');
                resolve(thumbnail);
              } else {
                console.warn('Invalid video dimensions');
                clearTimeout(timeoutId);
                resolve('');
              }
            } catch (error) {
              console.warn('Canvas error:', error);
              clearTimeout(timeoutId);
              resolve('');
            }
          };
          
          video.onerror = () => {
            console.warn('Video load error');
            clearTimeout(timeoutId);
            resolve('');
          };
          
          video.src = URL.createObjectURL(file);
          return;
        } else {
          // For image files, use FileReader as before
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result;
            if (result && typeof result === 'string') {
              resolve(result);
            } else {
              console.warn('Thumbnail creation failed - no result for:', file.name);
              resolve(''); // Return empty string instead of rejecting
            }
          };
          reader.onerror = () => {
            console.warn('Thumbnail creation failed for:', file.name);
            resolve(''); // Return empty string instead of rejecting
          };
          reader.readAsDataURL(file);
        }
      } catch (error) {
        console.warn('Thumbnail creation not supported:', error);
        resolve(''); // Return empty string instead of rejecting
      }
    });
  };

  const createFileHash = async (file: File): Promise<string> => {
    try {
      if (!window.crypto || !window.crypto.subtle) {
        return `fallback_${file.name}_${file.size}_${file.lastModified}`;
      }

      if (file.size > 2 * 1024 * 1024 * 1024) {
        return `large_${file.name}_${file.size}_${file.lastModified}`;
      }

      let arrayBuffer: ArrayBuffer;
      if (file.arrayBuffer) {
        arrayBuffer = await file.arrayBuffer();
      } else {
        arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            if (result && result instanceof ArrayBuffer) {
              resolve(result);
            } else {
              reject(new Error('Failed to read file as ArrayBuffer'));
            }
          };
          reader.onerror = () => reject(reader.error || new Error('FileReader error'));
          reader.readAsArrayBuffer(file);
        });
      }

      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.warn('Hash creation failed, using fallback:', error);
      return `error_${file.name}_${file.size}_${file.lastModified}`;
    }
  };

  const isDuplicateFile = (newFile: File, newHash: string): boolean => {
    return files.some((existingFile) => {
      if (existingFile.hash === newHash) return true;

      if (existingFile.file.name === newFile.name && existingFile.file.size === newFile.size)
        return true;

      return false;
    });
  };

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    console.log('handleFileSelect called with:', selectedFiles);
    if (!selectedFiles) {
      console.log('No files selected');
      toast({
        title: 'Debug: No files selected',
        variant: 'destructive'
      });
      return;
    }

    console.log('Number of files selected:', selectedFiles.length);
    toast({
      title: `Debug: ${selectedFiles.length} files selected`,
    });
    const isS3Storage = appConfig.storage === StorageProvider.S3;

    const validFiles = Array.from(selectedFiles).filter((file) => {
      if (!isValidMediaFile(file)) {
        const supportedFormats = isS3Storage
          ? 'JPG, JPEG, PNG, GIF, WebP, MP4, MOV, AVI, WebM'
          : 'JPG, JPEG, PNG, GIF, WebP';

        toast({
          variant: 'destructive',
          title: t('errors.invalidFileType', { fileName: file.name, supportedFormats }),
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      console.log('No valid files after filtering');
      toast({
        title: 'Debug: No valid files after filtering',
        variant: 'destructive'
      });
      return;
    }

    console.log('Valid files:', validFiles.length);
    toast({
      title: `Debug: ${validFiles.length} valid files`,
    });
    const newFiles: UploadFile[] = [];
    const duplicateFiles: string[] = [];

    for (const file of validFiles) {
      try {
        const hash = await createFileHash(file);

        if (isDuplicateFile(file, hash)) {
          duplicateFiles.push(file.name);
          continue;
        }

        let thumbnail = '';
        try {
          console.log(`Creating thumbnail for: ${file.name}`);
          thumbnail = await createThumbnail(file);
          console.log(`Thumbnail created for: ${file.name}, length: ${thumbnail.length}`);
        } catch (error) {
          console.warn(`Thumbnail creation failed for ${file.name}:`, error);
          // Continue without thumbnail - Safari might not support certain image types
        }

        newFiles.push({
          file,
          id: Math.random().toString(36).substring(2, 11),
          progress: 0,
          status: 'pending',
          thumbnail,
          hash,
        });
      } catch (error) {
        console.error(`Failed to process file ${file.name}:`, error);
        toast({
          variant: 'destructive',
          title: t('errors.fileProcessingError'),
          description: t('errors.fileProcessingErrorDescription', { fileName: file.name }),
        });
      }
    }

    // Show duplicate notification if any duplicates found
    if (duplicateFiles.length > 0) {
      toast({
        variant: 'destructive',
        title: t('errors.duplicateFiles'),
        description: t('errors.duplicateFilesDescription', {
          count: duplicateFiles.length,
          fileNames:
            duplicateFiles.slice(0, 2).join(', ') +
            (duplicateFiles.length > 2 ? ` and ${duplicateFiles.length - 2} more` : ''),
        }),
      });
    }

    if (newFiles.length > 0) {
      console.log('Adding new files to state:', newFiles.length);
      toast({
        title: `Debug: Adding ${newFiles.length} files to state`,
      });
      setFiles((prev) => {
        console.log('Previous files:', prev.length, 'New files:', newFiles.length);
        return [...prev, ...newFiles];
      });

      if (duplicateFiles.length === 0) {
        toast({
          title: t('success.filesAdded'),
          description: t('success.filesAddedDescription', { count: newFiles.length }),
        });
      } else {
        toast({
          title: t('success.newFilesAdded'),
          description: t('success.newFilesAddedDescription', {
            count: newFiles.length,
            duplicateCount: duplicateFiles.length,
          }),
        });
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setFileToDelete(null);
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const confirmRemoveFile = (id: string) => {
    setFileToDelete(id);
  };

  const toggleFileSelection = (id: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllFiles = () => {
    const pendingFileIds = files.filter((f) => f.status === 'pending').map((f) => f.id);
    setSelectedFiles(new Set(pendingFileIds));
  };

  const deselectAllFiles = () => {
    setSelectedFiles(new Set());
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedFiles(new Set());
    }
  };

  const removeSelectedFiles = () => {
    setFiles((prev) => prev.filter((f) => !selectedFiles.has(f.id)));
    setSelectedFiles(new Set());
    setIsSelectionMode(false);

    toast({
      title: t('success.filesRemoved'),
      description: t('success.filesRemovedDescription', { count: selectedFiles.size }),
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f))
    );

    try {
      for (let progress = 10; progress <= 90; progress += 20) {
        setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f)));
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const isVideo = uploadFile.file.type.startsWith('video/');
      let data;

      if (appConfig.storage === StorageProvider.S3 && isVideo) {
        // For S3 videos, first get a presigned URL by sending only metadata
        const presignedRes = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: uploadFile.file.name,
            fileSize: uploadFile.file.size,
            fileType: uploadFile.file.type,
            guestName,
            isVideo: true,
          }),
        });

        const presignedData = await presignedRes.json();

        if (!presignedRes.ok) {
          throw new Error(presignedData.error || 'Failed to get upload URL');
        }

        // Upload directly to S3 using the presigned URL
        setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 30 } : f)));

        const uploadRes = await fetch(presignedData.presignedUrl, {
          method: 'PUT',
          body: uploadFile.file,
          headers: {
            'Content-Type': uploadFile.file.type,
          },
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload video file');
        }

        setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 80 } : f)));

        data = {
          url: presignedData.publicUrl,
          public_id: presignedData.publicUrl,
          format: uploadFile.file.type.split('/')[1] || 'mp4',
          resource_type: 'video',
          guestName: presignedData.guestName,
          uploadDate: new Date().toISOString(),
          height: '480',
          width: '720',
        };
      } else {
        const formData = new FormData();
        formData.append('file', uploadFile.file);
        formData.append('guestName', guestName);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to upload file');
        }
      }

      if (data) {
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'success', progress: 100 } : f))
        );

        const newMedia: MediaProps = {
          id: Date.now(),
          public_id: data.public_id || data.url || '',
          format: data.format,
          resource_type: data.resource_type,
          blurDataUrl: '',
          guestName: data.guestName || guestName,
          uploadDate: data.uploadDate || data.created_at,
          height: data.height?.toString() || '480',
          width: data.width?.toString() || '720',
          videoId: data.videoId,
          duration: data.duration,
        };

        addMedia(newMedia);

        toast({
          title: t('success.mediaAddedSuccessfully'),
          description: t('success.mediaAddedDescription', { fileName: uploadFile.file.name }),
        });
      }
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: 'error',
                error: error instanceof Error ? error.message : t('errors.uploadFailed'),
              }
            : f
        )
      );
      toast({
        variant: 'destructive',
        title: t('errors.uploadFailed'),
        description: t('errors.uploadFailedDescription', { fileName: uploadFile.file.name }),
      });
    }
  };

  const handleUploadAll = async () => {
    const currentName = guestName.trim();
    if (!currentName) {
      toast({
        variant: 'destructive',
        title: t('errors.nameRequired'),
        description: t('errors.nameRequiredDescription'),
      });
      return;
    }

    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    await Promise.all(pendingFiles.map((file) => uploadFile(file)));

    setIsUploading(false);
  };

  const handleNameChange = async () => {
    const rawValue = currentNameValue;
    const nameValue = rawValue.trim();

    // Final validation before submitting
    const error = validateName(rawValue);
    if (error) {
      setNameError(error);
      return;
    }

    setIsUpdatingName(true);
    setNameError(null);

    // Add a small delay to show loading state (simulates processing)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Use validated and sanitized name
    const sanitizedName = validateGuestName(rawValue, t);

    setGuestName(sanitizedName);
    setIsEditingName(false);
    setIsUpdatingName(false);

    toast({
      title: t('success.nameUpdated'),
      description: t('success.nameUpdatedDescription', { name: sanitizedName }),
    });
  };

  // Real-time validation handler
  const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentNameValue(value);
    const error = validateName(value);
    setNameError(error);
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status === 'pending' || f.status === 'uploading'));
  };

  const handleViewGallery = () => {
    setIsOpen(false);
    // Scroll to top of page to show newly added photos
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasFiles = files.length > 0;
  const hasCompleted = files.some((f) => f.status === 'success' || f.status === 'error');
  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const uploadingCount = files.filter((f) => f.status === 'uploading').length;
  const successCount = files.filter((f) => f.status === 'success').length;
  const hasSuccessfulUploads = successCount > 0;
  const pendingFiles = files.filter((f) => f.status === 'pending');
  const selectedPendingFiles = pendingFiles.filter((f) => selectedFiles.has(f.id));
  const allPendingSelected =
    pendingFiles.length > 0 && selectedPendingFiles.length === pendingFiles.length;

  // Shared content component for both Dialog and Drawer
  const UploadContent = () => (
    <div className="flex-1 flex flex-col gap-3 p-3 select-none">
      {/* Success indicator when uploads are complete */}
      {hasSuccessfulUploads && pendingCount === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-green-700 font-medium mb-2">
            <Check className="h-5 w-5" />
            {t('upload.filesSuccessfullyAdded')}
          </div>
          <p className="text-sm text-green-600">
            {t('upload.filesAddedToGallery', { count: successCount })}
          </p>
        </div>
      )}

      {/* Drop area - simplified */}
      <div
        className={cn(
          'flex-1 rounded-lg transition-colors relative flex items-center justify-center',
          !hasFiles &&
            'border border-border/30 hover:border-border/60 hover:bg-muted/20 p-6 text-center',
          hasFiles &&
            'border border-border/50 bg-muted/5 p-3 flex-col items-stretch justify-start overflow-y-auto'
        )}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={
            appConfig.storage === StorageProvider.S3
              ? 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/mov,video/quicktime,video/avi,video/webm,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.webm'
              : 'image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp'
          }
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          key={files.length}
        />

        {/* Overlay input for drag & drop */}
        <input
          type="file"
          multiple
          accept={
            appConfig.storage === StorageProvider.S3
              ? 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/mov,video/quicktime,video/avi,video/webm,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.webm'
              : 'image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp'
          }
          onChange={(e) => handleFileSelect(e.target.files)}
          className={cn(
            'absolute opacity-0 cursor-pointer z-10',
            !hasFiles && 'inset-0',
            hasFiles && 'top-0 left-0 right-32 h-16'
          )}
          key={`overlay-${files.length}`}
        />

        {!hasFiles ? (
          // Empty state - show upload prompt
          <div className="flex flex-col items-center gap-2">
            <UploadIcon className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                <span className="md:hidden">
                  {appConfig.storage === StorageProvider.S3
                    ? t('upload.chooseOrDragVideo')
                    : t('upload.chooseOrDrag')}
                </span>
                <span className="hidden md:inline">
                  {appConfig.storage === StorageProvider.S3
                    ? t('upload.chooseOrDragVideoDesktop')
                    : t('upload.chooseOrDragDesktop')}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {appConfig.storage === StorageProvider.S3
                  ? t('upload.supportedFormatsS3')
                  : t('upload.supportedFormatsCloudinary')}
              </p>
            </div>
          </div>
        ) : (
          // Files selected state - show files inside the drop zone
          <div className="space-y-3">
            <div className="space-y-3">
              {/* Header with file count and actions */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UploadIcon className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-sm">
                    {isSelectionMode
                      ? t('upload.managingFiles', { count: files.length })
                      : t('upload.selectedFiles', { count: files.length })}
                  </h4>
                </div>
                <div className="flex items-center gap-2 relative z-20">
                  {hasCompleted && !isSelectionMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCompleted}
                      className="h-7 px-3 text-xs relative z-20"
                    >
                      {t('upload.clearCompleted')}
                    </Button>
                  )}
                  {!isSelectionMode && (
                    <p className="text-xs text-muted-foreground hidden md:block">
                      {t('upload.dropMoreFiles')}
                    </p>
                  )}
                </div>
              </div>

              {/* Selection mode controls */}
              {isSelectionMode && (
                <div className="bg-muted/10 border border-border/50 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={allPendingSelected ? deselectAllFiles : selectAllFiles}
                        className="h-9 w-9 p-0"
                        disabled={pendingFiles.length === 0}
                      >
                        {allPendingSelected ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>

                      {selectedFiles.size > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeSelectedFiles}
                          className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}

                      <div className="text-sm font-medium text-muted-foreground ml-2">
                        {selectedFiles.size > 0
                          ? `${selectedFiles.size} selected`
                          : `${pendingFiles.length} files`}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectionMode}
                      className="h-8 px-3 text-xs"
                    >
                      {t('upload.done')}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Compact grid layout for files - stable layout */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 max-h-60 p-1 custom-scrollbar">
              {files.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className={cn(
                    'relative rounded-lg bg-background transition-all duration-200 p-0.5',
                    isSelectionMode &&
                      uploadFile.status === 'pending' &&
                      selectedFiles.has(uploadFile.id) &&
                      'ring-2 ring-primary bg-primary/5',
                    isSelectionMode &&
                      uploadFile.status === 'pending' &&
                      !selectedFiles.has(uploadFile.id) &&
                      'opacity-60',
                    !isSelectionMode && 'border'
                  )}
                >
                  <div
                    className="relative aspect-square group cursor-pointer overflow-hidden rounded-md select-none"
                    onClick={(e) => {
                      if (isSelectionMode && uploadFile.status === 'pending') {
                        toggleFileSelection(uploadFile.id);
                      } else if (!isSelectionMode && uploadFile.status === 'pending') {
                        // Desktop: Ctrl+click starts multi-select
                        if (e.ctrlKey || e.metaKey) {
                          setIsSelectionMode(true);
                          toggleFileSelection(uploadFile.id);
                        } else {
                          confirmRemoveFile(uploadFile.id);
                        }
                      }
                    }}
                    onTouchStart={(e) => {
                      if (!isSelectionMode && uploadFile.status === 'pending') {
                        // Mobile: Long press starts multi-select
                        const touchTimer = setTimeout(() => {
                          setIsSelectionMode(true);
                          toggleFileSelection(uploadFile.id);
                        }, 500); // 500ms long press

                        const cleanup = () => {
                          clearTimeout(touchTimer);
                          document.removeEventListener('touchend', cleanup);
                          document.removeEventListener('touchmove', cleanup);
                        };

                        document.addEventListener('touchend', cleanup);
                        document.addEventListener('touchmove', cleanup);
                      }
                    }}
                  >
                    {uploadFile.thumbnail ? (
                      <Image
                        src={uploadFile.thumbnail}
                        alt={uploadFile.file.name}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover transition-all duration-200"
                      />
                    ) : uploadFile.file.type.startsWith('video/') ? (
                      // Mobile: Use Image with video URL, Desktop: Use placeholder until thumbnail loads
                      window.innerWidth >= 1024 ? (
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center">
                          <div className="text-2xl mb-1">🎬</div>
                          <div className="text-xs text-gray-600 text-center px-1">
                            {uploadFile.file.name.split('.').pop()?.toUpperCase()}
                          </div>
                        </div>
                      ) : (
                        <Image
                          src={URL.createObjectURL(uploadFile.file)}
                          alt={uploadFile.file.name}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover transition-all duration-200"
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-muted/20 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}

                    {(uploadFile.thumbnail || uploadFile.file.type.startsWith('video/')) && (
                      <>
                        {/* Normal mode: Show trash on hover */}
                        {!isSelectionMode && uploadFile.status === 'pending' && (
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                              <Trash2 className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Selection checkbox in top-right corner when in selection mode */}
                    {isSelectionMode && uploadFile.status === 'pending' && (
                      <div className="absolute top-1 right-1 z-10">
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full border-2 border-white bg-white shadow-md flex items-center justify-center transition-all duration-200',
                            selectedFiles.has(uploadFile.id) && 'bg-primary border-primary'
                          )}
                        >
                          {selectedFiles.has(uploadFile.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Status indicator (not in selection mode) */}
                    {!isSelectionMode && (
                      <div
                        className={cn(
                          'absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-md text-white text-xs',
                          uploadFile.status === 'success' && 'bg-green-500',
                          uploadFile.status === 'error' && 'bg-red-500',
                          uploadFile.status === 'uploading' &&
                            'bg-blue-500 animate-[bounce_1s_infinite]',
                          uploadFile.status === 'pending' && 'bg-gray-400'
                        )}
                      >
                        {uploadFile.status === 'success' && <Check className="w-2 h-2" />}
                        {uploadFile.status === 'error' && <X className="w-2 h-2" />}
                        {uploadFile.status === 'uploading' && <UploadIcon className="w-2 h-2" />}
                      </div>
                    )}
                  </div>

                  {/* Compact file info */}
                  <div className="mt-1">
                    <div className="text-xs font-medium truncate" title={uploadFile.file.name}>
                      {uploadFile.file.name}
                    </div>

                    {/* File size info */}
                    <div className="text-xs text-muted-foreground truncate">
                      {formatFileSize(uploadFile.file.size)}
                      {(() => {
                        // Only show compression info for image files (not videos)
                        if (uploadFile.file.type.startsWith('image/')) {
                          const compressionInfo = getCompressionInfo(uploadFile.file.size);
                          return (
                            compressionInfo.willCompress && (
                              <span
                                className="text-orange-600 ml-1"
                                title={`Will be compressed by ${compressionInfo.estimatedSizeReduction} to fit 10MB limit`}
                              >
                                ⚡ -{compressionInfo.estimatedSizeReduction}
                              </span>
                            )
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {uploadFile.status === 'uploading' && (
                      <Progress value={uploadFile.progress} className="h-1 mt-1" />
                    )}

                    {uploadFile.status === 'error' && uploadFile.error && (
                      <p className="text-xs text-red-600 truncate" title={uploadFile.error}>
                        Error
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Add more photos button */}
              {!isSelectionMode && (
                <div className="relative rounded-lg bg-background transition-all duration-200 p-0.5 border border-dashed border-muted-foreground/50 hover:border-primary/50 hover:bg-muted/25">
                  <div
                    className="relative aspect-square group cursor-pointer overflow-hidden rounded-md flex items-center justify-center bg-muted/20 hover:bg-muted/40 transition-all duration-200"
                    onClick={triggerFileInput}
                  >
                    <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                      <Plus className="w-6 h-6" />
                      <span className="text-xs font-medium">{t('upload.addMore')}</span>
                    </div>
                  </div>

                  {/* Compact info area to match other items */}
                  <div className="mt-1">
                    <div className="text-xs text-muted-foreground text-center">
                      {t('upload.photoVideo')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDialog.removeFile')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDialog.removeFileDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('upload.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fileToDelete && removeFile(fileToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('upload.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  const TriggerButton = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
  >(function TriggerButton(props, ref) {
    return (
      <Button
        ref={ref}
        {...props}
        size="lg"
        className="shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90 
                   h-14 px-5 py-3 rounded-full flex items-center gap-3 text-sm font-medium
                   md:h-12 md:px-6 md:py-3 md:rounded-lg md:gap-2 md:text-sm md:font-medium"
      >
        <Camera className="h-5 w-5 md:h-5 md:w-5" />
        <span className="hidden sm:inline">{t('upload.addFiles')}</span>
        <span className="sm:hidden">{t('upload.addFiles')}</span>
      </Button>
    );
  });

  if (isLargeScreen) {
    // Desktop: Use Dialog
    return (
      <>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <TriggerButton />
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>{t('upload.title')}</DialogTitle>
                  <DialogDescription>
                    {t('upload.description', {
                      brideName: appConfig.brideName,
                      groomName: appConfig.groomName,
                      interpolation: { escapeValue: false },
                    })}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{t('upload.addingAs')}</span>
                  <span className="font-medium">{guestName || t('upload.notSet')}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingName(true);
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    {t('nameDialog.edit')}
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <UploadContent />

            <DialogFooter className="flex-shrink-0">
              {hasSuccessfulUploads && pendingCount === 0 ? (
                // Show "View Gallery" and "Close" when uploads are complete
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    {t('upload.close')}
                  </Button>
                  <Button onClick={handleViewGallery} className="bg-green-600 hover:bg-green-700">
                    {t('upload.viewGallery', { count: successCount })}
                  </Button>
                </div>
              ) : (
                // Show standard upload interface
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    {t('upload.close')}
                  </Button>
                  <Button
                    onClick={handleUploadAll}
                    disabled={!hasFiles || pendingCount === 0 || isUploading || !guestName.trim()}
                  >
                    {isUploading
                      ? t('upload.adding', { count: uploadingCount })
                      : t('upload.addCount', { count: pendingCount })}
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Name edit dialog for desktop */}
        <Dialog
          open={isEditingName}
          onOpenChange={(open) => {
            if (!isUpdatingName) {
              setIsEditingName(open);
              if (open) {
                setCurrentNameValue(guestName || '');
                setNameError(null);
              } else {
                setNameError(null);
              }
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('nameDialog.title')}</DialogTitle>
              <DialogDescription>{t('nameDialog.description')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  ref={nameInputRef}
                  type="text"
                  placeholder={t('nameDialog.placeholder')}
                  value={currentNameValue}
                  autoFocus
                  disabled={isUpdatingName}
                  onChange={handleNameInput}
                  onKeyDown={(e) => {
                    if (isUpdatingName) return;

                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!nameError) {
                        handleNameChange();
                      }
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setIsEditingName(false);
                    }
                  }}
                  className={nameError ? 'border-destructive focus:border-destructive' : ''}
                />
                <div className="h-6 flex items-center">
                  {nameError && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <span className="w-4 h-4">⚠️</span>
                      {nameError}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (!isUpdatingName) {
                    setIsEditingName(false);
                  }
                }}
                className="w-full sm:w-auto order-2 sm:order-1"
                disabled={isUpdatingName}
              >
                {t('upload.cancel')}
              </Button>
              <Button
                onClick={handleNameChange}
                className="w-full sm:w-auto order-1 sm:order-2"
                disabled={isUpdatingName || !!nameError}
              >
                {isUpdatingName ? t('nameDialog.updating') : t('nameDialog.updateName')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Mobile/Tablet: Use Drawer
  return (
    <>
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <TriggerButton />
        </DrawerTrigger>
        <DrawerContent className="max-h-[90vh] h-[90vh] flex flex-col">
          <DrawerHeader className="flex-shrink-0 border-b bg-background/95 backdrop-blur">
            <div className="space-y-2">
              <DrawerTitle>{t('upload.title')}</DrawerTitle>
              <DrawerDescription>
                {t('upload.description', {
                  brideName: appConfig.brideName,
                  groomName: appConfig.groomName,
                  interpolation: { escapeValue: false },
                })}
              </DrawerDescription>
              <div
                className="pt-2 border-t cursor-pointer"
                onClick={() => {
                  setIsEditingName(true);
                }}
              >
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">{t('upload.addingAs')}</span>
                    <span className="font-medium text-foreground">
                      {guestName || t('upload.notSet')}
                    </span>
                  </div>
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </DrawerHeader>

          <div className="flex-1 flex flex-col">
            <UploadContent />
          </div>

          <DrawerFooter className="flex-shrink-0 border-t bg-background/95 backdrop-blur">
            {hasSuccessfulUploads && pendingCount === 0 ? (
              // Show "View Gallery" and "Close" when uploads are complete
              <div className="grid grid-cols-2 gap-2">
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">
                    {t('upload.close')}
                  </Button>
                </DrawerClose>
                <Button onClick={handleViewGallery} className="bg-green-600 hover:bg-green-700">
                  {t('upload.viewGallery', { count: successCount })}
                </Button>
              </div>
            ) : (
              // Show standard upload interface
              <div className="grid grid-cols-2 gap-2">
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">
                    {t('upload.close')}
                  </Button>
                </DrawerClose>
                <Button
                  onClick={handleUploadAll}
                  disabled={!hasFiles || pendingCount === 0 || isUploading || !guestName.trim()}
                >
                  {isUploading
                    ? t('upload.adding', { count: uploadingCount })
                    : t('upload.addCount', { count: pendingCount })}
                </Button>
              </div>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Name edit dialog for mobile */}
      <Dialog
        open={isEditingName}
        onOpenChange={(open) => {
          if (!isUpdatingName) {
            setIsEditingName(open);
            if (open) {
              setCurrentNameValue(guestName || '');
              setNameError(null);
            } else {
              setNameError(null);
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('nameDialog.title')}</DialogTitle>
            <DialogDescription>{t('nameDialog.descriptionMobile')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                ref={nameInputRef}
                type="text"
                placeholder={t('nameDialog.placeholder')}
                value={currentNameValue}
                autoFocus
                disabled={isUpdatingName}
                onChange={handleNameInput}
                onKeyDown={(e) => {
                  if (isUpdatingName) return;

                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!nameError) {
                      handleNameChange();
                    }
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsEditingName(false);
                  }
                }}
                className={nameError ? 'border-destructive focus:border-destructive' : ''}
              />
              <div className="h-6 flex items-center">
                {nameError && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <span className="w-4 h-4">⚠️</span>
                    {nameError}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!isUpdatingName) {
                  setIsEditingName(false);
                }
              }}
              className="w-full sm:w-auto order-2 sm:order-1"
              disabled={isUpdatingName}
            >
              {t('upload.cancel')}
            </Button>
            <Button
              onClick={handleNameChange}
              className="w-full sm:w-auto order-1 sm:order-2"
              disabled={isUpdatingName || !!nameError}
            >
              {isUpdatingName ? t('nameDialog.updating') : t('nameDialog.updateName')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
