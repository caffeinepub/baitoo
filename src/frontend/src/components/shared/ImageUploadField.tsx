import { useState, useRef } from 'react';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Camera, Upload, X } from 'lucide-react';
import { useCamera } from '../../camera/useCamera';

interface ImageUploadFieldProps {
  label: string;
  currentImageUrl?: string;
  onChange: (file: File | null) => void;
}

export default function ImageUploadField({ label, currentImageUrl, onChange }: ImageUploadFieldProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isActive,
    isSupported,
    error,
    isLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({
    facingMode: 'environment',
    quality: 0.9,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onChange(file);
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = async () => {
    setShowCamera(true);
    await startCamera();
  };

  const handleCapture = async () => {
    const photo = await capturePhoto();
    if (photo) {
      setSelectedFile(photo);
      const url = URL.createObjectURL(photo);
      setPreviewUrl(url);
      onChange(photo);
      await stopCamera();
      setShowCamera(false);
    }
  };

  const handleCancelCamera = async () => {
    await stopCamera();
    setShowCamera(false);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {!showCamera ? (
        <>
          {displayUrl && (
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-border">
              <img
                src={displayUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleGalleryClick}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose from Gallery
            </Button>
            {isSupported !== false && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCameraClick}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </>
      ) : (
        <div className="space-y-3">
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error.message}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleCapture}
              disabled={!isActive || isLoading}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              Capture Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelCamera}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
