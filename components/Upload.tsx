'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

import { Button } from './ui/button';
import { useGuestName, useSetGuestName, useAddPhoto } from '../store/useAppStore';
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

import type { UploadFile, ImageProps } from '../utils/types';

interface UploadProps {
  currentGuestName?: string;
}

export const Upload = ({ currentGuestName }: UploadProps) => {
  // Zustand store hooks
  const guestName = useGuestName();
  const setGuestName = useSetGuestName();
  const addPhoto = useAddPhoto();

  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize guest name from store or props
  useEffect(() => {
    const name = currentGuestName || guestName || '';
    if (currentGuestName && currentGuestName !== guestName) {
      setGuestName(currentGuestName);
    }
    setNewGuestName(name);
  }, [currentGuestName, guestName, setGuestName]);

  // Detect screen size for responsive UI
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // lg breakpoint
    };

    // Check on mount
    checkScreenSize();

    // Listen for resize events
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const isValidImageFile = (file: File): boolean => {
    try {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

      // Check MIME type first
      if (file.type && validTypes.includes(file.type.toLowerCase())) {
        return true;
      }

      // Fallback: check file extension for Safari compatibility
      const fileName = file.name?.toLowerCase() || '';
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      return validExtensions.some((ext) => fileName.endsWith(ext));
    } catch (error) {
      console.warn('File validation error:', error);
      return false;
    }
  };

  const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve((e.target?.result as string) || '');
        };
        reader.onerror = () => {
          console.warn('Thumbnail creation failed for:', file.name);
          reject(new Error('Failed to create thumbnail'));
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.warn('FileReader not supported:', error);
        reject(error);
      }
    });
  };

  const createFileHash = async (file: File): Promise<string> => {
    try {
      // Check if crypto.subtle is available (Safari compatibility)
      if (!window.crypto || !window.crypto.subtle) {
        // Fallback: use file name + size + lastModified as hash
        return `fallback_${file.name}_${file.size}_${file.lastModified}`;
      }

      // Check file size limit (2GB) for Safari/Chrome compatibility
      if (file.size > 2 * 1024 * 1024 * 1024) {
        // For large files, use metadata hash
        return `large_${file.name}_${file.size}_${file.lastModified}`;
      }

      // Try to use modern File.arrayBuffer() method
      let arrayBuffer: ArrayBuffer;
      if (file.arrayBuffer) {
        arrayBuffer = await file.arrayBuffer();
      } else {
        // Fallback for older browsers using FileReader
        arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(file);
        });
      }

      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.warn('Hash creation failed, using fallback:', error);
      // Ultimate fallback: use file metadata
      return `error_${file.name}_${file.size}_${file.lastModified}`;
    }
  };

  const isDuplicateFile = (newFile: File, newHash: string): boolean => {
    return files.some((existingFile) => {
      // Check by hash (most reliable)
      if (existingFile.hash === newHash) return true;

      // Check by name and size as fallback
      if (existingFile.file.name === newFile.name && existingFile.file.size === newFile.size)
        return true;

      return false;
    });
  };

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const validFiles = Array.from(selectedFiles).filter((file) => {
      if (!isValidImageFile(file)) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: `${file.name} is not a supported image format. Please select JPG, PNG, GIF, or WebP files.`,
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

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
          thumbnail = await createThumbnail(file);
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
          title: 'File processing error',
          description: `Failed to process ${file.name}. Please try again.`,
        });
      }
    }

    // Show duplicate notification if any duplicates found
    if (duplicateFiles.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Duplicate photos detected',
        description: `${duplicateFiles.length} photo${duplicateFiles.length > 1 ? 's' : ''} already selected: ${duplicateFiles.slice(0, 2).join(', ')}${duplicateFiles.length > 2 ? ` and ${duplicateFiles.length - 2} more` : ''}`,
      });
    }

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);

      if (duplicateFiles.length === 0) {
        toast({
          title: 'Photos added',
          description: `${newFiles.length} photo${newFiles.length > 1 ? 's' : ''} ready to add`,
        });
      } else {
        toast({
          title: 'New photos added',
          description: `${newFiles.length} new photo${newFiles.length > 1 ? 's' : ''} added (${duplicateFiles.length} duplicate${duplicateFiles.length > 1 ? 's' : ''} skipped)`,
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
      title: 'Photos removed',
      description: `${selectedFiles.size} photo${selectedFiles.size > 1 ? 's' : ''} removed from the list.`,
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
      const reader = new FileReader();
      reader.readAsDataURL(uploadFile.file);

      reader.onloadend = async () => {
        const base64 = reader.result;

        // Simulate progress
        for (let progress = 10; progress <= 90; progress += 20) {
          setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f)));
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64, guestName }),
        });

        const data = await res.json();

        if (res.ok) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, status: 'success', progress: 100 } : f
            )
          );

          const newPhoto: ImageProps = {
            id: Date.now(), // Generate a unique numeric ID
            public_id: data.public_id,
            format: data.format,
            blurDataUrl: '', // Will be generated on next page load
            guestName: guestName || 'Unknown Guest', // Use the current guest name from store
            uploadDate: data.created_at,
            height: data.height.toString(),
            width: data.width.toString(),
          };

          addPhoto(newPhoto);

          toast({
            title: 'Photo added successfully!',
            description: `${uploadFile.file.name} has been added to the gallery.`,
          });
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      };
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed',
              }
            : f
        )
      );
      toast({
        variant: 'destructive',
        title: 'Failed to add photo',
        description: `Failed to add ${uploadFile.file.name}`,
      });
    }
  };

  const handleUploadAll = async () => {
    const currentName = guestName.trim();
    if (!currentName) {
      toast({
        variant: 'destructive',
        title: 'Name required',
        description: 'Please enter your name before adding photos.',
      });
      return;
    }

    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    await Promise.all(pendingFiles.map((file) => uploadFile(file)));

    setIsUploading(false);
  };

  const handleNameChange = () => {
    if (!newGuestName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Name required',
        description: 'Please enter a valid name.',
      });
      return;
    }

    const trimmedName = newGuestName.trim();
    setGuestName(trimmedName);
    setIsEditingName(false);

    toast({
      title: 'Name updated',
      description: `Your name has been changed to ${trimmedName}`,
    });
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

  // Shared guest name edit dialog
  const GuestNameEditDialog = () => (
    <Dialog open={isEditingName} onOpenChange={setIsEditingName}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Your Name</DialogTitle>
          <DialogDescription>
            Update the name that will be associated with your photos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Enter your name"
            value={newGuestName}
            onChange={(e) => setNewGuestName(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsEditingName(false)}>
            Cancel
          </Button>
          <Button onClick={handleNameChange}>Update Name</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Shared content component for both Dialog and Drawer
  const UploadContent = () => (
    <div className="grid gap-4 p-4 overflow-auto max-h-[60vh] lg:max-h-[70vh]">
      {/* Success indicator when uploads are complete */}
      {hasSuccessfulUploads && pendingCount === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-green-700 font-medium mb-2">
            <Check className="h-5 w-5" />
            Photos Successfully Added!
          </div>
          <p className="text-sm text-green-600">
            {successCount} photo{successCount !== 1 ? 's' : ''} have been added to the wedding gallery.
            Use the &ldquo;View Gallery&rdquo; button below to see your photos.
          </p>
        </div>
      )}

      {/* Smart drag & drop area that adapts to content */}
      <div className="space-y-3">
        <div className="relative">
          {/* Hidden file input for programmatic access */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            key={files.length} // Reset input when files change
          />

          <div
            className={cn(
              'border-2 border-dashed rounded-lg transition-colors min-h-[120px] relative',
              !hasFiles &&
                'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/25 p-6 text-center',
              hasFiles && 'border-primary/30 bg-muted/10 p-4'
            )}
          >
            {/* File input overlay - only covers the header area when files are present */}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={(e) => handleFileSelect(e.target.files)}
              className={cn(
                'absolute opacity-0 cursor-pointer z-10',
                !hasFiles && 'inset-0 w-full h-full',
                hasFiles && 'top-0 left-0 right-32 h-16' // Exclude right area where buttons are
              )}
              key={`${files.length}-overlay`} // Reset input when files change
            />

            {!hasFiles ? (
              // Empty state - show upload prompt
              <div className="flex flex-col items-center gap-2">
                <UploadIcon className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Choose photos or drag & drop</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, GIF, WebP • Multiple files supported
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
                          ? `Managing ${files.length} Files`
                          : `Selected Files (${files.length})`}
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
                          Clear Completed
                        </Button>
                      )}
                      {!isSelectionMode && (
                        <p className="text-xs text-muted-foreground">Drop more files here</p>
                      )}
                    </div>
                  </div>

                  {/* Selection mode controls */}
                  {isSelectionMode && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <div className="flex flex-col gap-3">
                        {/* Top row: Select All button and selection count */}
                        <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={allPendingSelected ? deselectAllFiles : selectAllFiles}
                            className="h-8 flex items-center gap-2 w-full xs:w-auto"
                            disabled={pendingFiles.length === 0}
                          >
                            {allPendingSelected ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                            <span>{allPendingSelected ? 'Deselect All' : 'Select All'}</span>
                          </Button>

                          {selectedFiles.size > 0 && (
                            <div className="text-sm font-medium text-primary text-center xs:text-left">
                              {selectedFiles.size} photo{selectedFiles.size > 1 ? 's' : ''} selected
                            </div>
                          )}
                        </div>

                        {/* Bottom row: Action buttons */}
                        <div className="flex gap-2">
                          {selectedFiles.size > 0 && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={removeSelectedFiles}
                              className="h-8 flex items-center gap-2 flex-1"
                            >
                              <Trash className="h-4 w-4" />
                              <span className="hidden xs:inline">Remove {selectedFiles.size}</span>
                              <span className="xs:hidden">Remove</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleSelectionMode}
                            className="h-8 px-4"
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Multi-select toggle button when not in selection mode */}
                  {!isSelectionMode && pendingFiles.length > 1 && (
                    <div className="flex justify-center relative z-20">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleSelectionMode}
                        className="h-8 flex items-center gap-2 text-sm relative z-20"
                      >
                        <CheckSquare className="h-4 w-4" />
                        Select Multiple
                      </Button>
                    </div>
                  )}
                </div>

                {/* Compact grid layout for files - stable layout */}
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 max-h-60 overflow-y-auto overflow-x-hidden p-1 custom-scrollbar">
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
                        className="relative aspect-square group cursor-pointer overflow-hidden rounded-md"
                        onClick={() => {
                          if (isSelectionMode && uploadFile.status === 'pending') {
                            toggleFileSelection(uploadFile.id);
                          } else if (!isSelectionMode && uploadFile.status === 'pending') {
                            confirmRemoveFile(uploadFile.id);
                          }
                        }}
                      >
                        {uploadFile.thumbnail && (
                          <>
                            <Image
                              src={uploadFile.thumbnail}
                              alt={uploadFile.file.name}
                              width={100}
                              height={100}
                              className="w-full h-full object-cover transition-all duration-200"
                            />

                            {/* Selection mode: Show checkbox overlay */}
                            {isSelectionMode && uploadFile.status === 'pending' && (
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div
                                  className={cn(
                                    'w-7 h-7 rounded-full border-2 border-white bg-white flex items-center justify-center transition-all duration-200 shadow-lg',
                                    selectedFiles.has(uploadFile.id) && 'bg-primary border-primary'
                                  )}
                                >
                                  {selectedFiles.has(uploadFile.id) ? (
                                    <Check className="w-4 h-4 text-white" />
                                  ) : (
                                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                                  )}
                                </div>
                              </div>
                            )}

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
                            {uploadFile.status === 'uploading' && (
                              <UploadIcon className="w-2 h-2" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Compact file info */}
                      <div className="mt-1">
                        <div className="text-xs font-medium truncate" title={uploadFile.file.name}>
                          {uploadFile.file.name}
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
                          <span className="text-xs font-medium">Add More</span>
                        </div>
                      </div>

                      {/* Compact info area to match other items */}
                      <div className="mt-1">
                        <div className="text-xs text-muted-foreground text-center">Photos</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this photo from the list? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fileToDelete && removeFile(fileToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
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
        <span className="hidden sm:inline">Add Photos</span>
        <span className="sm:hidden">Add</span>
      </Button>
    );
  });

  if (isLargeScreen) {
    // Desktop: Use Dialog
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <TriggerButton />
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Share Wedding Memories</DialogTitle>
                <DialogDescription>
                  Select photos to add to {process.env.NEXT_PUBLIC_GROOM_NAME || 'Groom'} &{' '}
                  {process.env.NEXT_PUBLIC_BRIDE_NAME || 'Bride'}&apos;s wedding gallery
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Adding as:</span>
                <span className="font-medium">{guestName || 'Not set'}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNewGuestName(guestName);
                    setIsEditingName(true);
                  }}
                  className="h-7 px-2 text-xs"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
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
                  Close
                </Button>
                <Button onClick={handleViewGallery} className="bg-green-600 hover:bg-green-700">
                  View Gallery ({successCount} added)
                </Button>
              </div>
            ) : (
              // Show standard upload interface
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={handleUploadAll}
                  disabled={!hasFiles || pendingCount === 0 || isUploading || !guestName.trim()}
                >
                  {isUploading
                    ? `Adding... (${uploadingCount})`
                    : `Add ${pendingCount} Photo${pendingCount !== 1 ? 's' : ''}`}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
        <GuestNameEditDialog />
      </Dialog>
    );
  }

  // Mobile/Tablet: Use Drawer
  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <TriggerButton />
      </DrawerTrigger>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <div className="space-y-2">
            <DrawerTitle>Share Wedding Memories</DrawerTitle>
            <DrawerDescription>
              Select photos to add to {process.env.NEXT_PUBLIC_GROOM_NAME || 'Groom'} &{' '}
              {process.env.NEXT_PUBLIC_BRIDE_NAME || 'Bride'}&apos;s wedding gallery
            </DrawerDescription>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Adding as:</span>
                <span className="font-medium text-foreground">{guestName || 'Not set'}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewGuestName(guestName);
                  setIsEditingName(true);
                }}
                className="h-7 px-2 text-xs"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        </DrawerHeader>

        <UploadContent />

        <DrawerFooter>
          {hasSuccessfulUploads && pendingCount === 0 ? (
            // Show "View Gallery" and "Close" when uploads are complete
            <div className="grid grid-cols-2 gap-2">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Close
                </Button>
              </DrawerClose>
              <Button onClick={handleViewGallery} className="bg-green-600 hover:bg-green-700">
                View Gallery ({successCount} added)
              </Button>
            </div>
          ) : (
            // Show standard upload interface
            <div className="grid grid-cols-2 gap-2">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Close
                </Button>
              </DrawerClose>
              <Button
                onClick={handleUploadAll}
                disabled={!hasFiles || pendingCount === 0 || isUploading || !guestName.trim()}
              >
                {isUploading
                  ? `Adding... (${uploadingCount})`
                  : `Add ${pendingCount} Photo${pendingCount !== 1 ? 's' : ''}`}
              </Button>
            </div>
          )}
        </DrawerFooter>
      </DrawerContent>
      <GuestNameEditDialog />
    </Drawer>
  );
};
