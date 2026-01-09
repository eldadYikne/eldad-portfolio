"use client";

import { CldUploadWidget } from "next-cloudinary";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, Copy, Check, Image as ImageIcon } from "lucide-react";

type UploadedImage = {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
};

interface UploadWidgetProps {
  folder?: string;
  onImagesChange?: (images: UploadedImage[]) => void;
  maxFiles?: number;
  initialImages?: UploadedImage[];
}

export default function UploadWidget({
  folder = "portfolio",
  onImagesChange,
  maxFiles,
  initialImages = [],
}: UploadWidgetProps) {
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadSuccess = (result: any) => {
    const newImage: UploadedImage = {
      secure_url: result.info.secure_url,
      public_id: result.info.public_id,
      width: result.info.width,
      height: result.info.height,
      format: result.info.format,
    };

    const updatedImages = [...images, newImage];
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
    setIsUploading(false);
  };

  const handleRemoveImage = (publicId: string) => {
    const updatedImages = images.filter((img) => img.public_id !== publicId);
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  const handleCopyUrl = async (url: string, publicId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(publicId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const canUploadMore = maxFiles ? images.length < maxFiles : true;

  return (
    <div className="space-y-6">
      {/* Upload Button */}
      <div className="flex items-center gap-4">
        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          options={{
            multiple: true,
            folder,
            maxFiles: maxFiles ? maxFiles - images.length : undefined,
            clientAllowedFormats: ["png", "jpg", "jpeg", "webp", "gif"],
            maxFileSize: 10000000, // 10MB
          }}
          onSuccess={(result: any) => {
            handleUploadSuccess(result);
          }}
          onQueuesEnd={() => {
            setIsUploading(false);
          }}
          onOpen={() => setIsUploading(true)}
        >
          {({ open }) => (
            <Button
              onClick={() => open()}
              disabled={!canUploadMore || isUploading}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload Images"}
            </Button>
          )}
        </CldUploadWidget>

        {maxFiles && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {images.length} / {maxFiles} images uploaded
          </p>
        )}
      </div>

      {/* Images Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((img) => (
            <Card
              key={img.public_id}
              className="overflow-hidden group relative"
            >
              {/* Image Preview */}
              <div className="aspect-video relative bg-gray-100 dark:bg-gray-800">
                <img
                  src={img.secure_url}
                  alt={img.public_id}
                  className="w-full h-full object-cover"
                />

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCopyUrl(img.secure_url, img.public_id)}
                    className="gap-2"
                  >
                    {copiedId === img.public_id ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy URL
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveImage(img.public_id)}
                    className="gap-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>

              {/* Image Info */}
              <div className="p-3 space-y-1">
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
                  {img.public_id}
                </p>
                {img.width && img.height && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {img.width} × {img.height}
                    {img.format && ` • ${img.format.toUpperCase()}`}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                No images uploaded yet
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click the upload button to add images
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
