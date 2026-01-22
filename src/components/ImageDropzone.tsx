import React, { useCallback, useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { cn } from '../utils/cn';

interface ImageDropzoneProps {
  label: string;
  image: string | null;
  onImageUpload: (file: File) => void;
  onClear: () => void;
  className?: string;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  label,
  image,
  onImageUpload,
  onClear,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        onImageUpload(file);
      }
    },
    [onImageUpload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onImageUpload(file);
      }
    },
    [onImageUpload]
  );

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center w-full h-full min-h-[320px] rounded-3xl transition-all duration-300 overflow-hidden',
        // MD3 State styles
        isDragging 
            ? 'bg-md-primary-container border-2 border-md-primary' 
            : 'bg-md-surface-container-high border border-md-outline-variant hover:bg-md-surface-container-highest',
        image ? 'border-none bg-black/5' : '',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {image ? (
        <div className="relative w-full h-full flex items-center justify-center bg-[#1e1e1e]/5 overflow-hidden"> 
           {/* Checkerboard Pattern */}
           <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
               style={{ 
                   backgroundImage: `
                    linear-gradient(45deg, #ccc 25%, transparent 25%), 
                    linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #ccc 75%), 
                    linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                   backgroundSize: '20px 20px',
                   backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
               }} 
          />
          
          <img
            src={image}
            alt={label}
            className="max-w-full max-h-full object-contain z-10 shadow-md-2 rounded-lg"
          />

          {/* Remove Button - Floating Action Button (Small) style */}
          <button
            onClick={onClear}
            className="absolute top-4 right-4 p-2 bg-md-surface-container-high text-md-on-surface-variant hover:bg-md-error-container hover:text-md-on-error-container rounded-xl shadow-md-2 transition-colors z-20"
            title="Remove image"
          >
            <X size={20} />
          </button>
          
          <div className="absolute bottom-4 left-4 px-3 py-1 bg-md-surface/80 text-md-on-surface text-sm font-medium rounded-full backdrop-blur-md border border-md-outline-variant z-20 shadow-sm">
            {label}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className={cn(
              "p-5 mb-4 rounded-2xl transition-colors",
              isDragging ? "bg-md-primary text-md-on-primary" : "bg-md-secondary-container text-md-on-secondary-container"
          )}>
            <ImageIcon className="w-10 h-10" />
          </div>
          <h3 className="mb-1 text-lg font-normal text-md-on-surface">
            {label}
          </h3>
          <p className="mb-6 text-sm text-md-on-surface-variant">
            Drag & drop or click to upload
          </p>
          <label className="relative">
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <span className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium bg-md-primary text-md-on-primary hover:bg-md-primary/90 shadow-sm hover:shadow-md-1 cursor-pointer transition-all active:scale-95">
               Choose File
            </span>
          </label>
        </div>
      )}
    </div>
  );
};