"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon, X, Check, Trash2, Edit, Plus, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
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
} from "@/components/ui/alert-dialog";
import { guestNameUtils } from "./WelcomeDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  thumbnail?: string;
  hash?: string;
}

interface UploadProps {
  currentGuestName?: string;
}

export const Upload = ({ currentGuestName }: UploadProps) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [guestName, setGuestName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGuestName, setNewGuestName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const { toast } = useToast();

  // Load guest name from localStorage or props on mount
  useEffect(() => {
    const storedName = currentGuestName || guestNameUtils.get() || "";
    setGuestName(storedName);
    setNewGuestName(storedName);
  }, [currentGuestName]);

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
      return validExtensions.some(ext => fileName.endsWith(ext));
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
          resolve(e.target?.result as string || '');
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
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.warn('Hash creation failed, using fallback:', error);
      // Ultimate fallback: use file metadata
      return `error_${file.name}_${file.size}_${file.lastModified}`;
    }
  };

  const isDuplicateFile = (newFile: File, newHash: string): boolean => {
    return files.some(existingFile => {
      // Check by hash (most reliable)
      if (existingFile.hash === newHash) return true;
      
      // Check by name and size as fallback
      if (existingFile.file.name === newFile.name && 
          existingFile.file.size === newFile.size) return true;
      
      return false;
    });
  };

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const validFiles = Array.from(selectedFiles).filter(file => {
      if (!isValidImageFile(file)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
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
          hash
        });
      } catch (error) {
        console.error(`Failed to process file ${file.name}:`, error);
        toast({
          variant: "destructive",
          title: "File processing error",
          description: `Failed to process ${file.name}. Please try again.`,
        });
      }
    }
    
    // Show duplicate notification if any duplicates found
    if (duplicateFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "Duplicate photos detected",
        description: `${duplicateFiles.length} photo${duplicateFiles.length > 1 ? 's' : ''} already selected: ${duplicateFiles.slice(0, 2).join(', ')}${duplicateFiles.length > 2 ? ` and ${duplicateFiles.length - 2} more` : ''}`,
      });
    }
    
    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      
      if (duplicateFiles.length === 0) {
        toast({
          title: "Photos added",
          description: `${newFiles.length} photo${newFiles.length > 1 ? 's' : ''} ready to add`,
        });
      } else {
        toast({
          title: "New photos added",
          description: `${newFiles.length} new photo${newFiles.length > 1 ? 's' : ''} added (${duplicateFiles.length} duplicate${duplicateFiles.length > 1 ? 's' : ''} skipped)`,
        });
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setFileToDelete(null);
  };

  const confirmRemoveFile = (id: string) => {
    setFileToDelete(id);
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f
    ));

    try {
      const reader = new FileReader();
      reader.readAsDataURL(uploadFile.file);
      
      reader.onloadend = async () => {
        const base64 = reader.result;
        
        // Simulate progress
        for (let progress = 10; progress <= 90; progress += 20) {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, progress } : f
          ));
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: base64, guestName }),
        });

        const data = await res.json();
        
        if (res.ok) {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, status: 'success', progress: 100 } : f
          ));
          toast({
            title: "Photo added successfully!",
            description: `${uploadFile.file.name} has been added to the gallery.`,
          });
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      };
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed'
        } : f
      ));
      toast({
        variant: "destructive",
        title: "Failed to add photo",
        description: `Failed to add ${uploadFile.file.name}`,
      });
    }
  };

  const handleUploadAll = async () => {
    const currentName = guestName.trim();
    if (!currentName) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter your name before adding photos.",
      });
      return;
    }

    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;
    
    setIsUploading(true);
    
    let successCount = 0;
    for (const file of pendingFiles) {
      try {
        await uploadFile(file);
        successCount++;
      } catch (error) {
        // Error handling is already done in uploadFile
      }
    }
    
    setIsUploading(false);
    
    if (successCount > 0) {
      toast({
        title: "Photos added!",
        description: "Loading new photos...",
      });
      
      // Refetch photos with retries for Cloudinary indexing delay
      const refetchWithRetry = async (attempt = 1, maxAttempts = 3) => {
        if ((window as any).refetchPhotos) {
          await (window as any).refetchPhotos();
          
          // If this isn't the last attempt, schedule another refetch
          if (attempt < maxAttempts) {
            setTimeout(() => refetchWithRetry(attempt + 1, maxAttempts), 2000);
          }
        }
      };
      
      // Start first refetch after 2 seconds to allow Cloudinary indexing
      setTimeout(() => refetchWithRetry(), 2000);
    }
  };

  const handleNameChange = () => {
    if (!newGuestName.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter a valid name.",
      });
      return;
    }

    const trimmedName = newGuestName.trim();
    setGuestName(trimmedName);
    guestNameUtils.set(trimmedName);
    setIsEditingName(false);
    
    toast({
      title: "Name updated",
      description: `Your name has been changed to ${trimmedName}`,
    });
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status === 'pending' || f.status === 'uploading'));
  };

  const hasFiles = files.length > 0;
  const hasCompleted = files.some(f => f.status === 'success' || f.status === 'error');
  const pendingCount = files.filter(f => f.status === 'pending').length;
  const uploadingCount = files.filter(f => f.status === 'uploading').length;

  // Shared content component for both Dialog and Drawer
  const UploadContent = () => (
    <div className="grid gap-4 p-4 overflow-auto max-h-[60vh] lg:max-h-[70vh]">
      {/* Compact guest name display */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Adding as: <span className="font-medium text-foreground">{guestName || "Not set"}</span>
        </span>
        <Dialog open={isEditingName} onOpenChange={setIsEditingName}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" onClick={() => setNewGuestName(guestName)} className="h-6 px-2 text-xs">
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </DialogTrigger>
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
              <Button onClick={handleNameChange}>
                Update Name
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Smart drag & drop area that adapts to content */}
      <div className="space-y-3">
        <div className="relative">
          <div className={cn(
            "border-2 border-dashed rounded-lg transition-colors min-h-[120px] relative",
            !hasFiles && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/25 p-6 text-center",
            hasFiles && "border-primary/30 bg-muted/10 p-4"
          )}>
            {/* File input overlay - only covers the header area when files are present */}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={(e) => handleFileSelect(e.target.files)}
              className={cn(
                "absolute opacity-0 cursor-pointer z-10",
                !hasFiles && "inset-0 w-full h-full",
                hasFiles && "top-0 left-0 right-0 h-16 w-full"
              )}
              key={files.length} // Reset input when files change
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
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <UploadIcon className="h-4 w-4 text-primary" />
                    <h4 className="font-medium text-sm">Selected Files ({files.length})</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasCompleted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearCompleted}
                        className="h-6 px-2 text-xs"
                      >
                        Clear Completed
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">Drop more files here</p>
                  </div>
                </div>
                
                {/* Compact grid layout for files - now scrollable */}
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 max-h-60 overflow-y-auto overflow-x-hidden relative z-0 custom-scrollbar">
                  {files.map((uploadFile) => (
                    <div key={uploadFile.id} className="relative border rounded-md p-1 bg-background">
                      {/* Thumbnail with click to remove */}
                      <div className="relative aspect-square group">
                        {uploadFile.thumbnail && (
                          <>
                            <img
                              src={uploadFile.thumbnail}
                              alt={uploadFile.file.name}
                              className="w-full h-full object-cover rounded-sm"
                            />
                            {/* Click overlay for removal */}
                            {uploadFile.status === 'pending' && (
                              <div 
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-sm flex items-center justify-center"
                                onClick={() => confirmRemoveFile(uploadFile.id)}
                              >
                                <Trash2 className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Status overlay */}
                        <div className={cn(
                          "absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm text-white",
                          uploadFile.status === 'success' && "bg-green-500",
                          uploadFile.status === 'error' && "bg-red-500",
                          uploadFile.status === 'uploading' && "bg-blue-500 animate-pulse",
                          uploadFile.status === 'pending' && "bg-gray-400"
                        )}>
                          {uploadFile.status === 'success' && <Check className="w-2 h-2" />}
                          {uploadFile.status === 'error' && <X className="w-2 h-2" />}
                          {uploadFile.status === 'uploading' && <UploadIcon className="w-2 h-2" />}
                        </div>
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
              Are you sure you want to remove this photo from the list?
              This action cannot be undone.
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

  const TriggerButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    (props, ref) => (
      <Button 
        ref={ref}
        {...props}
        size="lg"
        className="shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90 
                   h-14 px-5 py-3 rounded-full flex items-center gap-3 text-sm font-medium
                   md:h-10 md:px-4 md:py-2 md:rounded-lg md:gap-2"
      >
        <Camera className="h-5 w-5 md:h-4 md:w-4" />
        <span className="hidden xs:inline">Add Photos</span>
        <span className="xs:hidden">Add</span>
      </Button>
    )
  );

  if (isLargeScreen) {
    // Desktop: Use Dialog
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <TriggerButton />
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Share Wedding Memories</DialogTitle>
            <DialogDescription>
              Select photos to add to {process.env.NEXT_PUBLIC_GROOM_NAME} & {process.env.NEXT_PUBLIC_BRIDE_NAME}'s wedding gallery
            </DialogDescription>
          </DialogHeader>
          
          <UploadContent />

          <DialogFooter className="flex-shrink-0">
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
                  : `Add ${pendingCount} Photo${pendingCount !== 1 ? 's' : ''}`
                }
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
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
          <DrawerTitle>Share Wedding Memories</DrawerTitle>
          <DrawerDescription>
            Select photos to add to {process.env.NEXT_PUBLIC_GROOM_NAME} & {process.env.NEXT_PUBLIC_BRIDE_NAME}'s wedding gallery
          </DrawerDescription>
        </DrawerHeader>

        <UploadContent />

        <DrawerFooter>
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
                : `Add ${pendingCount} Photo${pendingCount !== 1 ? 's' : ''}`
              }
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
