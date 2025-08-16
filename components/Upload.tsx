"use client";

import { useState } from "react";
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
import { Upload as UploadIcon, X, Check, Trash2, Edit } from "lucide-react";
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
import { useEffect } from "react";

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
  const { toast } = useToast();

  // Load guest name from localStorage or props on mount
  useEffect(() => {
    const storedName = currentGuestName || guestNameUtils.get() || "";
    setGuestName(storedName);
    setNewGuestName(storedName);
  }, [currentGuestName]);

  const isValidImageFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type.toLowerCase());
  };

  const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const createFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
      const hash = await createFileHash(file);
      
      if (isDuplicateFile(file, hash)) {
        duplicateFiles.push(file.name);
        continue;
      }
      
      const thumbnail = await createThumbnail(file);
      newFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: 'pending',
        thumbnail,
        hash
      });
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
          description: `${newFiles.length} photo${newFiles.length > 1 ? 's' : ''} ready for upload`,
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
            title: "Upload successful!",
            description: `${uploadFile.file.name} has been uploaded.`,
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
        title: "Upload failed",
        description: `Failed to upload ${uploadFile.file.name}`,
      });
    }
  };

  const handleUploadAll = async () => {
    const currentName = guestName.trim();
    if (!currentName) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter your name before uploading.",
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
        title: "Upload complete!",
        description: "Loading new photos...",
      });
      
      // Refetch photos instead of refreshing the page
      setTimeout(() => {
        if ((window as any).refetchPhotos) {
          (window as any).refetchPhotos();
        }
      }, 1000);
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

  return (
    <>
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button>Upload Photos</Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Upload Photos</DrawerTitle>
            <DrawerDescription>
              Select multiple photos to share with Saygin & Dilan
            </DrawerDescription>
          </DrawerHeader>

          <div className="grid gap-4 p-4 overflow-auto">
            {/* Guest name display with edit option */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Uploading as:</p>
                <p className="font-medium">{guestName || "Not set"}</p>
              </div>
              <Dialog open={isEditingName} onOpenChange={setIsEditingName}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setNewGuestName(guestName)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Change
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Change Your Name</DialogTitle>
                    <DialogDescription>
                      Update the name that will be associated with your uploaded photos.
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
            
            <div className="space-y-2">
              <Input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="cursor-pointer"
                key={files.length} // Reset input when files change
              />
              <p className="text-sm text-muted-foreground">
                Select multiple image files (JPG, PNG, GIF, WebP only)
              </p>
            </div>

            {hasFiles && (
              <div className="space-y-3 max-h-80 overflow-auto">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Selected Files ({files.length})</h4>
                  {hasCompleted && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCompleted}
                    >
                      Clear Completed
                    </Button>
                  )}
                </div>
                
                {/* Grid layout for files */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {files.map((uploadFile) => (
                    <div key={uploadFile.id} className="relative border rounded-lg p-2 space-y-2">
                      {/* Thumbnail with click to remove */}
                      <div className="relative aspect-square group">
                        {uploadFile.thumbnail && (
                          <>
                            <img
                              src={uploadFile.thumbnail}
                              alt={uploadFile.file.name}
                              className="w-full h-full object-cover rounded-md"
                            />
                            {/* Click overlay for removal */}
                            {uploadFile.status === 'pending' && (
                              <div 
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-md flex items-center justify-center"
                                onClick={() => confirmRemoveFile(uploadFile.id)}
                              >
                                <Trash2 className="w-6 h-6 text-white" />
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Status overlay */}
                        <div className={cn(
                          "absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm",
                          uploadFile.status === 'success' && "bg-green-500",
                          uploadFile.status === 'error' && "bg-red-500",
                          uploadFile.status === 'uploading' && "bg-blue-500 animate-pulse",
                          uploadFile.status === 'pending' && "bg-gray-300"
                        )}>
                          {uploadFile.status === 'success' && <Check className="w-3 h-3 text-white" />}
                          {uploadFile.status === 'error' && <X className="w-3 h-3 text-white" />}
                          {uploadFile.status === 'uploading' && <UploadIcon className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                      
                      {/* File info */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium truncate" title={uploadFile.file.name}>
                          {uploadFile.file.name}
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {Math.round(uploadFile.file.size / 1024)}KB
                        </div>
                        
                        {uploadFile.status === 'uploading' && (
                          <Progress value={uploadFile.progress} className="h-1" />
                        )}
                        
                        {uploadFile.status === 'error' && uploadFile.error && (
                          <p className="text-xs text-red-600 truncate" title={uploadFile.error}>
                            {uploadFile.error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Confirmation Dialog */}
            <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Photo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove this photo from the upload list?
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
                  ? `Uploading... (${uploadingCount})`
                  : `Upload ${pendingCount} Photo${pendingCount !== 1 ? 's' : ''}`
                }
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};
