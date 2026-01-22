import React, { useCallback, useState, useRef, useEffect } from 'react';
import { X, Film } from 'lucide-react';
import { cn } from '../utils/cn';

interface VideoDropzoneProps {
  label: string;
  video: string | null;
  onVideoUpload: (file: File, handle?: FileSystemFileHandle) => void;
  onClear: () => void;
  className?: string;
}

export const VideoDropzone: React.FC<VideoDropzoneProps> = ({
  label,
  video,
  onVideoUpload,
  onClear,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      // 尝试获取文件句柄 (File System Access API)
      const items = e.dataTransfer.items;
      if (items && items.length > 0) {
        const item = items[0];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && file.type.startsWith('video/')) {
            // 尝试获取文件句柄
            let handle: FileSystemFileHandle | undefined;
            try {
              if ('getAsFileSystemHandle' in item) {
                const fsHandle = await (item as DataTransferItem & {
                  getAsFileSystemHandle(): Promise<FileSystemHandle | null>;
                }).getAsFileSystemHandle();
                if (fsHandle && fsHandle.kind === 'file') {
                  handle = fsHandle as FileSystemFileHandle;
                }
              }
            } catch (err) {
              console.warn('Could not get file handle from drop:', err);
            }
            onVideoUpload(file, handle);
          }
        }
      }
    },
    [onVideoUpload]
  );

  const handleFileSelect = useCallback(async () => {
    try {
      // 使用 File System Access API
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Videos',
            accept: {
              'video/*': ['.mp4', '.webm', '.mov'],
            },
          },
        ],
        multiple: false,
      });
      const file = await handle.getFile();
      onVideoUpload(file, handle);
    } catch (err) {
      // 用户取消选择或浏览器不支持
      if ((err as Error).name !== 'AbortError') {
        console.warn('File picker error:', err);
      }
    }
  }, [onVideoUpload]);

  useEffect(() => {
    if (videoRef.current && video) {
      const handleLoadedMetadata = () => {
        if (videoRef.current) {
          setDuration(videoRef.current.duration);
        }
      };
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        videoRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [video]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center w-full h-full min-h-[320px] rounded-3xl transition-all duration-300 overflow-hidden',
        isDragging
            ? 'bg-md-primary-container border-2 border-md-primary'
            : 'bg-md-surface-container-high border border-md-outline-variant hover:bg-md-surface-container-highest',
        video ? 'border-none bg-black/5' : '',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {video ? (
        <div className="relative w-full h-full flex items-center justify-center bg-[#1e1e1e]/5 overflow-hidden">
          <video
            ref={videoRef}
            src={video}
            className="max-w-full max-h-full object-contain z-10 shadow-md-2 rounded-lg"
            muted
            loop
            autoPlay
            playsInline
          />

          <button
            onClick={onClear}
            className="absolute top-4 right-4 p-2 bg-md-surface-container-high text-md-on-surface-variant hover:bg-md-error-container hover:text-md-on-error-container rounded-xl shadow-md-2 transition-colors z-20"
            title="Remove video"
          >
            <X size={20} />
          </button>

          <div className="absolute bottom-4 left-4 px-3 py-1 bg-md-surface/80 text-md-on-surface text-sm font-medium rounded-full backdrop-blur-md border border-md-outline-variant z-20 shadow-sm flex items-center gap-2">
            {label}
            {duration && (
              <span className="text-xs opacity-70">{formatDuration(duration)}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className={cn(
              "p-5 mb-4 rounded-2xl transition-colors",
              isDragging ? "bg-md-primary text-md-on-primary" : "bg-md-secondary-container text-md-on-secondary-container"
          )}>
            <Film className="w-10 h-10" />
          </div>
          <h3 className="mb-1 text-lg font-normal text-md-on-surface">
            {label}
          </h3>
          <p className="mb-6 text-sm text-md-on-surface-variant">
            Drag & drop or click to upload
          </p>
          <button
            onClick={handleFileSelect}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium bg-md-primary text-md-on-primary hover:bg-md-primary/90 shadow-sm hover:shadow-md-1 cursor-pointer transition-all active:scale-95"
          >
            Choose Video
          </button>
          <p className="mt-4 text-xs text-md-on-surface-variant/60">
            Supports MP4, WebM, MOV
          </p>
        </div>
      )}
    </div>
  );
};
