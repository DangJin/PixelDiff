import { useState, useEffect, useCallback, useRef } from 'react';
import { ImageDropzone } from './components/ImageDropzone';
import { VideoDropzone } from './components/VideoDropzone';
import { SliderDiff } from './components/DiffViewer/SliderDiff';
import { SideBySideDiff } from './components/DiffViewer/SideBySideDiff';
import { OverlayDiff } from './components/DiffViewer/OverlayDiff';
import { VideoDiff } from './components/DiffViewer/VideoDiff';
import { VideoSliderDiff } from './components/DiffViewer/VideoSliderDiff';
import { VideoOverlayDiff } from './components/DiffViewer/VideoOverlayDiff';
import { ZoomToolbar, ZOOM_STEP, MIN_ZOOM, MAX_ZOOM } from './components/DiffViewer/ZoomToolbar';
import { AnnotationToolbar } from './components/Annotation/AnnotationToolbar';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { KeyboardShortcutsDialog } from './components/ui/KeyboardShortcutsDialog';
import { RecentDiffsDialog } from './components/ui/RecentDiffsDialog';
import { RecentDiffsList } from './components/ui/RecentDiffsList';
import type { Annotation, AnnotationTool } from './types/annotation';
import { DEFAULT_ANNOTATION_COLOR } from './types/annotation';
import { GitCompare, Github, Keyboard, History, X, Eraser } from 'lucide-react';
import { ContentModeSelector } from './components/ContentModeSelector';
import { ViewModeSelector } from './components/ViewModeSelector';
import { Button, IconButton } from './components/ui/Button';
import { useRecentDiffs } from './hooks';

type ContentMode = 'image' | 'video';
export type ViewMode = 'slider' | 'side-by-side' | 'overlay';

interface ImageSize {
  width: number;
  height: number;
}

function App() {
  // 顶层模式：图片 or 视频
  const [contentMode, setContentMode] = useState<ContentMode>('image');

  // 图片状态
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [beforeSize, setBeforeSize] = useState<ImageSize | null>(null);
  const [afterSize, setAfterSize] = useState<ImageSize | null>(null);
  const [beforeFilename, setBeforeFilename] = useState<string | null>(null);
  const [afterFilename, setAfterFilename] = useState<string | null>(null);
  const [beforeImageHandle, setBeforeImageHandle] = useState<FileSystemFileHandle | null>(null);
  const [afterImageHandle, setAfterImageHandle] = useState<FileSystemFileHandle | null>(null);

  // 视频状态
  const [beforeVideo, setBeforeVideo] = useState<string | null>(null);
  const [afterVideo, setAfterVideo] = useState<string | null>(null);
  const [beforeVideoHandle, setBeforeVideoHandle] = useState<FileSystemFileHandle | null>(null);
  const [afterVideoHandle, setAfterVideoHandle] = useState<FileSystemFileHandle | null>(null);

  // 视频播放状态（跨模式共享）
  const [videoPlaybackState, setVideoPlaybackState] = useState({
    isPlaying: false,
    currentTime: 0,
    playbackRate: 1,
  });

  const [mode, setMode] = useState<ViewMode>('slider');
  const [zoom, setZoom] = useState(1);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);

  // 标注状态
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [primaryTool, setPrimaryTool] = useState<AnnotationTool>('select'); // 用户选择的主工具
  const [currentTool, setCurrentTool] = useState<AnnotationTool>('select'); // 当前实际工具（可能是临时的）
  const [currentColor, setCurrentColor] = useState(DEFAULT_ANNOTATION_COLOR);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  // 模式切换确认对话框
  const [pendingMode, setPendingMode] = useState<ViewMode | null>(null);
  const [showModeConfirm, setShowModeConfirm] = useState(false);

  // 退出确认对话框
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // 清除标注确认对话框
  const [showClearAnnotationsConfirm, setShowClearAnnotationsConfirm] = useState(false);

  // 快捷键帮助弹窗
  const [showShortcuts, setShowShortcuts] = useState(false);

  // 历史记录
  const [showRecentDiffs, setShowRecentDiffs] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const { recentDiffs, addRecentDiff, getFileData, removeRecentDiff, clearAllRecentDiffs } = useRecentDiffs();
  const hasAddedToRecent = useRef(false);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
  }, []);

  // 标注回调 - 添加后自动切换回 select 模式
  const handleAnnotationAdd = useCallback((annotation: Annotation) => {
    setAnnotations(prev => [...prev, annotation]);
    // 标注完成后自动切换回 Hand 模式
    setPrimaryTool('select');
    setCurrentTool('select');
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedAnnotationId) {
      setAnnotations(prev => prev.filter(a => a.id !== selectedAnnotationId));
      setSelectedAnnotationId(null);
      // 删除后恢复到主工具
      setCurrentTool(primaryTool);
    }
  }, [selectedAnnotationId, primaryTool]);

  // 工具栏选择工具（更新主工具）
  const handleToolbarToolChange = useCallback((tool: AnnotationTool) => {
    setPrimaryTool(tool);
    setCurrentTool(tool);
  }, []);

  // 悬停在标注上时临时切换到选择模式
  const handleAnnotationHover = useCallback((isHovering: boolean) => {
    if (isHovering) {
      // 悬停时临时切换到选择模式
      setCurrentTool('select');
    } else if (!selectedAnnotationId) {
      // 移出且没有选中元素时，恢复到主工具
      setCurrentTool(primaryTool);
    }
  }, [primaryTool, selectedAnnotationId]);

  // 取消选中时恢复到主工具
  const handleAnnotationSelectWithRestore = useCallback((id: string | null) => {
    setSelectedAnnotationId(id);
    if (id === null) {
      // 取消选中时恢复到主工具
      setCurrentTool(primaryTool);
    }
  }, [primaryTool]);

  // 处理模式切换
  const handleModeChange = useCallback((newMode: ViewMode) => {
    if (newMode === mode) return;

    // 如果有标注，显示确认对话框
    if (annotations.length > 0) {
      setPendingMode(newMode);
      setShowModeConfirm(true);
    } else {
      setMode(newMode);
    }
  }, [mode, annotations.length]);

  // 确认切换模式（清空标注）
  const handleConfirmModeChange = useCallback(() => {
    if (pendingMode) {
      setAnnotations([]);
      setSelectedAnnotationId(null);
      setCurrentTool('select');
      setMode(pendingMode);
    }
    setShowModeConfirm(false);
    setPendingMode(null);
  }, [pendingMode]);

  // 取消切换模式
  const handleCancelModeChange = useCallback(() => {
    setShowModeConfirm(false);
    setPendingMode(null);
  }, []);

  // 键盘快捷键：V 选择，A 箭头，R 矩形，C 圆形
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果在输入框中，不处理快捷键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // 只有在比较模式下才处理快捷键（图片或视频都已上传）
      const inCompareMode = (contentMode === 'image' && beforeImage && afterImage) ||
                           (contentMode === 'video' && beforeVideo && afterVideo);
      if (!inCompareMode) return;

      const key = e.key.toLowerCase();
      if (key === 'v') {
        e.preventDefault();
        setPrimaryTool('select');
        setCurrentTool('select');
      } else if (key === 'a') {
        e.preventDefault();
        setPrimaryTool('arrow');
        setCurrentTool('arrow');
      } else if (key === 'r') {
        e.preventDefault();
        setPrimaryTool('rect');
        setCurrentTool('rect');
      } else if (key === 'c') {
        e.preventDefault();
        setPrimaryTool('circle');
        setCurrentTool('circle');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contentMode, beforeImage, afterImage, beforeVideo, afterVideo]);

  // Cleanup object URLs on unmount or change
  useEffect(() => {
    return () => {
      if (beforeImage) URL.revokeObjectURL(beforeImage);
      if (afterImage) URL.revokeObjectURL(afterImage);
      if (beforeVideo) URL.revokeObjectURL(beforeVideo);
      if (afterVideo) URL.revokeObjectURL(afterVideo);
    };
  }, []);

  const handleImageUpload = (file: File, type: 'before' | 'after', handle?: FileSystemFileHandle) => {
    const url = URL.createObjectURL(file);

    // 获取图片尺寸
    const img = new window.Image();
    img.onload = () => {
      const size = { width: img.naturalWidth, height: img.naturalHeight };
      if (type === 'before') {
        setBeforeSize(size);
      } else {
        setAfterSize(size);
      }
    };
    img.src = url;

    if (type === 'before') {
      if (beforeImage) URL.revokeObjectURL(beforeImage);
      setBeforeImage(url);
      setBeforeFilename(file.name);
      setBeforeImageHandle(handle || null);
    } else {
      if (afterImage) URL.revokeObjectURL(afterImage);
      setAfterImage(url);
      setAfterFilename(file.name);
      setAfterImageHandle(handle || null);
    }
  };

  const handleVideoUpload = (file: File, type: 'before' | 'after', handle?: FileSystemFileHandle) => {
    const url = URL.createObjectURL(file);

    if (type === 'before') {
      if (beforeVideo) URL.revokeObjectURL(beforeVideo);
      setBeforeVideo(url);
      setBeforeVideoHandle(handle || null);
    } else {
      if (afterVideo) URL.revokeObjectURL(afterVideo);
      setAfterVideo(url);
      setAfterVideoHandle(handle || null);
    }
  };

  // 显示退出确认对话框
  const handleExitClick = () => {
    setShowExitConfirm(true);
  };

  // 确认退出（清除文件和标注，返回上传页面）
  const handleConfirmExit = () => {
    if (contentMode === 'image') {
      if (beforeImage) URL.revokeObjectURL(beforeImage);
      if (afterImage) URL.revokeObjectURL(afterImage);
      setBeforeImage(null);
      setAfterImage(null);
      setBeforeSize(null);
      setAfterSize(null);
      setBeforeFilename(null);
      setAfterFilename(null);
      setBeforeImageHandle(null);
      setAfterImageHandle(null);
    } else {
      if (beforeVideo) URL.revokeObjectURL(beforeVideo);
      if (afterVideo) URL.revokeObjectURL(afterVideo);
      setBeforeVideo(null);
      setAfterVideo(null);
      setBeforeVideoHandle(null);
      setAfterVideoHandle(null);
      // 重置视频播放状态
      setVideoPlaybackState({ isPlaying: false, currentTime: 0, playbackRate: 1 });
    }
    // 清除标注
    setAnnotations([]);
    setSelectedAnnotationId(null);
    setCurrentTool('select');
    setPrimaryTool('select');
    setShowExitConfirm(false);
  };

  // 取消退出
  const handleCancelExit = () => {
    setShowExitConfirm(false);
  };

  // 显示清除标注确认对话框
  const handleClearAnnotationsClick = () => {
    if (annotations.length > 0) {
      setShowClearAnnotationsConfirm(true);
    }
  };

  // 确认清除标注（只清除标注，保留文件）
  const handleConfirmClearAnnotations = () => {
    setAnnotations([]);
    setSelectedAnnotationId(null);
    setCurrentTool('select');
    setPrimaryTool('select');
    setShowClearAnnotationsConfirm(false);
  };

  // 取消清除标注
  const handleCancelClearAnnotations = () => {
    setShowClearAnnotationsConfirm(false);
  };

  const hasBothImages = beforeImage && afterImage;
  const hasBothVideos = beforeVideo && afterVideo;

  // 从历史记录加载
  const handleRecentSelect = useCallback(async (item: import('./hooks/useRecentDiffs').RecentDiffItem) => {
    setIsLoadingRecent(true);
    setShowRecentDiffs(false);

    try {
      const fileData = await getFileData(item.id);
      if (!fileData) {
        alert('Failed to load files. The original files may have been moved or deleted.');
        setIsLoadingRecent(false);
        return;
      }

      // 切换到对应模式
      setContentMode(item.contentMode);

      // 清除现有内容
      if (beforeImage) URL.revokeObjectURL(beforeImage);
      if (afterImage) URL.revokeObjectURL(afterImage);
      if (beforeVideo) URL.revokeObjectURL(beforeVideo);
      if (afterVideo) URL.revokeObjectURL(afterVideo);

      // 设置新内容
      if (item.contentMode === 'image') {
        setBeforeImage(fileData.beforeUrl);
        setAfterImage(fileData.afterUrl);
        setBeforeFilename(fileData.beforeName);
        setAfterFilename(fileData.afterName);
        setBeforeImageHandle(fileData.beforeHandle);
        setAfterImageHandle(fileData.afterHandle);
        setBeforeVideo(null);
        setAfterVideo(null);
        setBeforeVideoHandle(null);
        setAfterVideoHandle(null);

        // 获取图片尺寸
        const loadImageSize = (src: string): Promise<ImageSize> => {
          return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
              resolve({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.src = src;
          });
        };

        const [beforeSizeResult, afterSizeResult] = await Promise.all([
          loadImageSize(fileData.beforeUrl),
          loadImageSize(fileData.afterUrl),
        ]);
        setBeforeSize(beforeSizeResult);
        setAfterSize(afterSizeResult);
      } else {
        setBeforeVideo(fileData.beforeUrl);
        setAfterVideo(fileData.afterUrl);
        setBeforeVideoHandle(fileData.beforeHandle);
        setAfterVideoHandle(fileData.afterHandle);
        setBeforeImage(null);
        setAfterImage(null);
        setBeforeFilename(null);
        setAfterFilename(null);
        setBeforeImageHandle(null);
        setAfterImageHandle(null);
        setBeforeSize(null);
        setAfterSize(null);
      }

      // 清除标注
      setAnnotations([]);
      setSelectedAnnotationId(null);
      setCurrentTool('select');

      // 重置标记，允许下次保存到历史记录
      hasAddedToRecent.current = true; // 已经在历史记录中，不需要重新添加
    } finally {
      setIsLoadingRecent(false);
    }
  }, [getFileData, beforeImage, afterImage, beforeVideo, afterVideo]);

  // 进入对比模式时保存到历史记录
  useEffect(() => {
    if (contentMode === 'image' && hasBothImages && !hasAddedToRecent.current) {
      hasAddedToRecent.current = true;
      addRecentDiff('image', beforeImage, afterImage, beforeImageHandle || undefined, afterImageHandle || undefined, beforeFilename || undefined, afterFilename || undefined);
    } else if (contentMode === 'video' && hasBothVideos && !hasAddedToRecent.current) {
      hasAddedToRecent.current = true;
      addRecentDiff('video', beforeVideo, afterVideo, beforeVideoHandle || undefined, afterVideoHandle || undefined);
    } else if (!hasBothImages && !hasBothVideos) {
      hasAddedToRecent.current = false;
    }
  }, [contentMode, hasBothImages, hasBothVideos, beforeImage, afterImage, beforeVideo, afterVideo, beforeImageHandle, afterImageHandle, beforeVideoHandle, afterVideoHandle, beforeFilename, afterFilename, addRecentDiff]);

  // 检测尺寸是否不同
  const sizeMismatch = beforeSize && afterSize &&
    (beforeSize.width !== afterSize.width || beforeSize.height !== afterSize.height);

  // 检查宽高比是否相同（允许 0.1% 的误差）
  const aspectRatioMatch = beforeSize && afterSize &&
    Math.abs((beforeSize.width / beforeSize.height) - (afterSize.width / afterSize.height)) < 0.001;

  return (
    <div className="h-screen bg-md-background text-md-on-background font-sans flex flex-col overflow-hidden">
      {/* Header - Top App Bar */}
      <header className="sticky top-0 z-50 bg-md-surface/80 backdrop-blur-md border-b border-md-outline-variant/50">
        <div className="px-4 h-16 flex items-center justify-between relative">
            {/* Leading Icon/Logo */}
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-md-primary-container text-md-on-primary-container rounded-full flex items-center justify-center">
                 <GitCompare size={24} />
              </div>
              <h1 className="text-xl font-normal text-md-on-surface tracking-tight hidden sm:block">
                Pixel<span className="font-bold">Diff</span>
              </h1>
           </div>

           {/* Center Content - Absolute positioned for true centering */}
           {((contentMode === 'image' && hasBothImages) || (contentMode === 'video' && hasBothVideos)) && (
             <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
               <ViewModeSelector value={mode} onChange={handleModeChange} />
             </div>
           )}

           {/* Trailing Actions */}
           <div className="flex items-center gap-2">
             {/* Clear Annotations - only show in compare mode when has annotations */}
             {((contentMode === 'image' && hasBothImages) || (contentMode === 'video' && hasBothVideos)) && annotations.length > 0 && (
                <>
                  <Button
                      variant="text"
                      label="Clear Annotations"
                      icon={Eraser}
                      onClick={handleClearAnnotationsClick}
                      className="hidden sm:flex text-md-on-surface-variant hover:bg-md-on-surface/10"
                  />
                  <IconButton
                     variant="text"
                     icon={Eraser}
                     onClick={handleClearAnnotationsClick}
                     className="sm:hidden"
                     title="Clear Annotations"
                  />
                </>
             )}
             {/* Exit - only show in compare mode */}
             {((contentMode === 'image' && hasBothImages) || (contentMode === 'video' && hasBothVideos)) && (
                <>
                  <Button
                      variant="text"
                      label="Exit"
                      icon={X}
                      onClick={handleExitClick}
                      className="hidden sm:flex text-md-error hover:bg-md-error/10"
                  />
                  <IconButton
                     variant="text"
                     icon={X}
                     onClick={handleExitClick}
                     className="sm:hidden text-md-error"
                     title="Exit"
                  />
                </>
             )}
             {/* Recent Diffs - only show in compare mode (homepage has RecentDiffsList) */}
             {((contentMode === 'image' && hasBothImages) || (contentMode === 'video' && hasBothVideos)) && (
               <IconButton
                  variant="text"
                  icon={History}
                  onClick={() => setShowRecentDiffs(true)}
                  title="Recent Comparisons"
               />
             )}
             {/* Keyboard Shortcuts */}
             <IconButton
                variant="text"
                icon={Keyboard}
                onClick={() => setShowShortcuts(true)}
                title="Keyboard Shortcuts"
             />
             {/* GitHub - auxiliary link, placed last */}
             <IconButton
                variant="text"
                icon={Github}
                onClick={() => window.open('https://github.com/DangJin/PixelDiff', '_blank')}
                title="View on GitHub"
             />
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Image Mode */}
          {contentMode === 'image' && (
            <>
              {hasBothImages ? (
                <div className="flex-1 flex flex-col min-h-0 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Diff 画布区域 */}
                  <div className="flex-1 overflow-hidden relative">
                    {mode === 'slider' ? (
                      <SliderDiff
                        beforeImage={beforeImage}
                        afterImage={afterImage}
                        zoom={zoom}
                        beforeSize={beforeSize}
                        afterSize={afterSize}
                        beforeFilename={beforeFilename || undefined}
                        afterFilename={afterFilename || undefined}
                        hasTopTip={!!sizeMismatch}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        annotations={annotations}
                        currentTool={currentTool}
                        currentColor={currentColor}
                        selectedAnnotationId={selectedAnnotationId}
                        onAnnotationAdd={handleAnnotationAdd}
                        onAnnotationSelect={handleAnnotationSelectWithRestore}
                        onDeleteSelected={handleDeleteSelected}
                        onToolChange={setCurrentTool}
                        onAnnotationHover={handleAnnotationHover}
                      />
                    ) : mode === 'side-by-side' ? (
                      <SideBySideDiff
                        beforeImage={beforeImage}
                        afterImage={afterImage}
                        zoom={zoom}
                        beforeSize={beforeSize}
                        afterSize={afterSize}
                        beforeFilename={beforeFilename || undefined}
                        afterFilename={afterFilename || undefined}
                        hasTopTip={!!sizeMismatch}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        annotations={annotations}
                        currentTool={currentTool}
                        currentColor={currentColor}
                        selectedAnnotationId={selectedAnnotationId}
                        onAnnotationAdd={handleAnnotationAdd}
                        onAnnotationSelect={handleAnnotationSelectWithRestore}
                        onDeleteSelected={handleDeleteSelected}
                        onToolChange={setCurrentTool}
                        onAnnotationHover={handleAnnotationHover}
                      />
                    ) : (
                      <OverlayDiff
                        beforeImage={beforeImage}
                        afterImage={afterImage}
                        zoom={zoom}
                        beforeSize={beforeSize}
                        afterSize={afterSize}
                        beforeFilename={beforeFilename || undefined}
                        afterFilename={afterFilename || undefined}
                        hasTopTip={!!sizeMismatch}
                        opacity={overlayOpacity}
                        onOpacityChange={setOverlayOpacity}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        annotations={annotations}
                        currentTool={currentTool}
                        currentColor={currentColor}
                        selectedAnnotationId={selectedAnnotationId}
                        onAnnotationAdd={handleAnnotationAdd}
                        onAnnotationSelect={handleAnnotationSelectWithRestore}
                        onDeleteSelected={handleDeleteSelected}
                        onToolChange={setCurrentTool}
                        onAnnotationHover={handleAnnotationHover}
                      />
                    )}
                  </div>

                  {/* 固定的尺寸提示 - 顶部 */}
                  {sizeMismatch && (
                    <div className={`absolute top-0 left-0 right-0 z-20 border-b border-md-outline-variant px-4 py-2 flex items-center justify-center gap-4 backdrop-blur-sm ${aspectRatioMatch ? 'bg-md-tertiary-container/80' : 'bg-md-error-container/80'}`}>
                      <div className={`text-sm ${aspectRatioMatch ? 'text-md-on-tertiary-container' : 'text-md-on-error-container'}`}>
                        <span className="font-medium">
                          {aspectRatioMatch ? 'Different sizes (same aspect ratio, auto-aligned):' : '⚠️ Different aspect ratios, slider comparison may be inaccurate:'}
                        </span>
                        <span className="ml-2">Before {beforeSize?.width}×{beforeSize?.height}</span>
                        <span className="mx-2">→</span>
                        <span>After {afterSize?.width}×{afterSize?.height}</span>
                      </div>
                    </div>
                  )}

                  {/* 标注工具栏 - 左侧 */}
                  <AnnotationToolbar
                    currentTool={primaryTool}
                    currentColor={currentColor}
                    onToolChange={handleToolbarToolChange}
                    onColorChange={setCurrentColor}
                    onDeleteSelected={handleDeleteSelected}
                    hasSelection={!!selectedAnnotationId}
                  />

                  {/* 固定的缩放工具条 - 底部 */}
                  <ZoomToolbar
                    zoom={zoom}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onZoomReset={handleZoomReset}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 relative overflow-y-auto overflow-x-hidden">
                  {/* 装饰性背景 */}
                  <div className="fixed inset-0 top-16 bg-gradient-to-br from-md-primary/5 via-transparent to-md-tertiary/5 pointer-events-none" />
                  <div className="fixed top-1/4 -left-1/4 w-1/2 h-1/2 bg-md-primary/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="fixed bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-md-tertiary/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Spacer for vertical centering on large screens */}
                  <div className="flex-1 min-h-0 lg:min-h-[20px]" />

                  {/* Hero Section */}
                  <div className="relative z-10 text-center mb-4 sm:mb-6 lg:mb-8">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-md-on-surface mb-2 sm:mb-3">
                      Spot Every Difference, Pixel by Pixel
                    </h2>
                    <p className="text-sm sm:text-base text-md-on-surface-variant max-w-lg mx-auto mb-4 sm:mb-6">
                      Compare images or videos across different versions, resolutions, or formats.
                      Ideal for design reviews, QA testing, and visual regression checks.
                    </p>
                    <ContentModeSelector value={contentMode} onChange={setContentMode} />
                  </div>

                  <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 w-full max-w-5xl h-auto lg:h-[400px]">
                    <ImageDropzone
                      label="Original / Before"
                      image={beforeImage}
                      onImageUpload={(f, h) => handleImageUpload(f, 'before', h)}
                      onClear={() => {
                          if (beforeImage) URL.revokeObjectURL(beforeImage);
                          setBeforeImage(null);
                          setBeforeSize(null);
                          setBeforeFilename(null);
                          setBeforeImageHandle(null);
                      }}
                      className="shadow-md-1 hover:shadow-md-3"
                    />
                    <ImageDropzone
                      label="Modified / After"
                      image={afterImage}
                      onImageUpload={(f, h) => handleImageUpload(f, 'after', h)}
                      onClear={() => {
                          if (afterImage) URL.revokeObjectURL(afterImage);
                          setAfterImage(null);
                          setAfterSize(null);
                          setAfterFilename(null);
                          setAfterImageHandle(null);
                      }}
                      className="shadow-md-1 hover:shadow-md-3"
                    />
                  </div>

                  {/* Recent Comparisons */}
                  <RecentDiffsList
                    recentDiffs={recentDiffs.filter(item => item.contentMode === 'image')}
                    onSelect={handleRecentSelect}
                    onRemove={removeRecentDiff}
                    onClearAll={clearAllRecentDiffs}
                    isLoading={isLoadingRecent}
                    className="relative z-10 mt-6 sm:mt-8 lg:mt-12"
                  />

                  {/* Spacer for vertical centering on large screens */}
                  <div className="flex-1 min-h-0 lg:min-h-[20px]" />
                </div>
              )}
            </>
          )}

          {/* Video Mode */}
          {contentMode === 'video' && (
            <>
              {hasBothVideos ? (
                <div className="flex-1 flex flex-col min-h-0 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Video Diff 区域 */}
                  <div className="flex-1 overflow-hidden relative">
                    {mode === 'slider' ? (
                      <VideoSliderDiff
                        beforeVideo={beforeVideo}
                        afterVideo={afterVideo}
                        zoom={zoom}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        videoPlaybackState={videoPlaybackState}
                        onVideoPlaybackStateChange={setVideoPlaybackState}
                        annotations={annotations}
                        currentTool={currentTool}
                        currentColor={currentColor}
                        selectedAnnotationId={selectedAnnotationId}
                        onAnnotationAdd={handleAnnotationAdd}
                        onAnnotationSelect={handleAnnotationSelectWithRestore}
                        onDeleteSelected={handleDeleteSelected}
                        onToolChange={setCurrentTool}
                        onToolSelect={handleToolbarToolChange}
                        onAnnotationHover={handleAnnotationHover}
                      />
                    ) : mode === 'side-by-side' ? (
                      <VideoDiff
                        beforeVideo={beforeVideo}
                        afterVideo={afterVideo}
                        zoom={zoom}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        videoPlaybackState={videoPlaybackState}
                        onVideoPlaybackStateChange={setVideoPlaybackState}
                        annotations={annotations}
                        currentTool={currentTool}
                        currentColor={currentColor}
                        selectedAnnotationId={selectedAnnotationId}
                        onAnnotationAdd={handleAnnotationAdd}
                        onAnnotationSelect={handleAnnotationSelectWithRestore}
                        onDeleteSelected={handleDeleteSelected}
                        onToolChange={setCurrentTool}
                        onToolSelect={handleToolbarToolChange}
                        onAnnotationHover={handleAnnotationHover}
                      />
                    ) : (
                      <VideoOverlayDiff
                        beforeVideo={beforeVideo}
                        afterVideo={afterVideo}
                        zoom={zoom}
                        opacity={overlayOpacity}
                        onOpacityChange={setOverlayOpacity}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        videoPlaybackState={videoPlaybackState}
                        onVideoPlaybackStateChange={setVideoPlaybackState}
                        annotations={annotations}
                        currentTool={currentTool}
                        currentColor={currentColor}
                        selectedAnnotationId={selectedAnnotationId}
                        onAnnotationAdd={handleAnnotationAdd}
                        onAnnotationSelect={handleAnnotationSelectWithRestore}
                        onDeleteSelected={handleDeleteSelected}
                        onToolChange={setCurrentTool}
                        onToolSelect={handleToolbarToolChange}
                        onAnnotationHover={handleAnnotationHover}
                      />
                    )}
                  </div>

                  {/* 标注工具栏 - 左侧 */}
                  <AnnotationToolbar
                    currentTool={primaryTool}
                    currentColor={currentColor}
                    onToolChange={handleToolbarToolChange}
                    onColorChange={setCurrentColor}
                    onDeleteSelected={handleDeleteSelected}
                    hasSelection={!!selectedAnnotationId}
                  />

                  {/* 固定的缩放工具条 - 底部 */}
                  <ZoomToolbar
                    zoom={zoom}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onZoomReset={handleZoomReset}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 relative overflow-y-auto overflow-x-hidden">
                  {/* 装饰性背景 */}
                  <div className="fixed inset-0 top-16 bg-gradient-to-br from-md-primary/5 via-transparent to-md-tertiary/5 pointer-events-none" />
                  <div className="fixed top-1/4 -left-1/4 w-1/2 h-1/2 bg-md-primary/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="fixed bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-md-tertiary/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Spacer for vertical centering on large screens */}
                  <div className="flex-1 min-h-0 lg:min-h-[20px]" />

                  {/* Hero Section */}
                  <div className="relative z-10 text-center mb-4 sm:mb-6 lg:mb-8">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-md-on-surface mb-2 sm:mb-3">
                      Spot Every Difference, Pixel by Pixel
                    </h2>
                    <p className="text-sm sm:text-base text-md-on-surface-variant max-w-lg mx-auto mb-4 sm:mb-6">
                      Compare images or videos across different versions, resolutions, or formats.
                      Ideal for design reviews, QA testing, and visual regression checks.
                    </p>
                    <ContentModeSelector value={contentMode} onChange={setContentMode} />
                  </div>

                  <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 w-full max-w-5xl h-auto lg:h-[400px]">
                    <VideoDropzone
                      label="Original / Before"
                      video={beforeVideo}
                      onVideoUpload={(f, h) => handleVideoUpload(f, 'before', h)}
                      onClear={() => {
                          if (beforeVideo) URL.revokeObjectURL(beforeVideo);
                          setBeforeVideo(null);
                          setBeforeVideoHandle(null);
                          setVideoPlaybackState({ isPlaying: false, currentTime: 0, playbackRate: 1 });
                      }}
                      className="shadow-md-1 hover:shadow-md-3"
                    />
                    <VideoDropzone
                      label="Modified / After"
                      video={afterVideo}
                      onVideoUpload={(f, h) => handleVideoUpload(f, 'after', h)}
                      onClear={() => {
                          if (afterVideo) URL.revokeObjectURL(afterVideo);
                          setAfterVideo(null);
                          setAfterVideoHandle(null);
                          setVideoPlaybackState({ isPlaying: false, currentTime: 0, playbackRate: 1 });
                      }}
                      className="shadow-md-1 hover:shadow-md-3"
                    />
                  </div>

                  {/* Recent Comparisons */}
                  <RecentDiffsList
                    recentDiffs={recentDiffs.filter(item => item.contentMode === 'video')}
                    onSelect={handleRecentSelect}
                    onRemove={removeRecentDiff}
                    onClearAll={clearAllRecentDiffs}
                    isLoading={isLoadingRecent}
                    className="relative z-10 mt-6 sm:mt-8 lg:mt-12"
                  />

                  {/* Spacer for vertical centering on large screens */}
                  <div className="flex-1 min-h-0 lg:min-h-[20px]" />
                </div>
              )}
            </>
          )}
      </main>

      {/* View Mode Switch Confirm Dialog */}
      <ConfirmDialog
        isOpen={showModeConfirm}
        title="Switch View Mode"
        message={`Switching to ${pendingMode === 'slider' ? 'Slider' : pendingMode === 'side-by-side' ? 'Side by Side' : 'Overlay'} mode will clear all annotations (${annotations.length}). Are you sure you want to continue?`}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirmModeChange}
        onCancel={handleCancelModeChange}
      />

      {/* Exit Confirm Dialog */}
      <ConfirmDialog
        isOpen={showExitConfirm}
        title="Exit Comparison"
        message={`This will close the current comparison and return to the upload page. ${annotations.length > 0 ? `All annotations (${annotations.length}) will be lost.` : ''} Are you sure?`}
        confirmText="Exit"
        cancelText="Cancel"
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
      />

      {/* Clear Annotations Confirm Dialog */}
      <ConfirmDialog
        isOpen={showClearAnnotationsConfirm}
        title="Clear Annotations"
        message={`This will clear all ${annotations.length} annotation${annotations.length > 1 ? 's' : ''}. The ${contentMode === 'image' ? 'images' : 'videos'} will be kept. Are you sure?`}
        confirmText="Clear"
        cancelText="Cancel"
        onConfirm={handleConfirmClearAnnotations}
        onCancel={handleCancelClearAnnotations}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Recent Diffs Dialog */}
      <RecentDiffsDialog
        isOpen={showRecentDiffs}
        onClose={() => setShowRecentDiffs(false)}
        recentDiffs={recentDiffs}
        onSelect={handleRecentSelect}
        onRemove={removeRecentDiff}
        onClearAll={clearAllRecentDiffs}
      />
    </div>
  );
}

export default App;
