import { useState, useEffect, useCallback } from 'react';
import { ImageDropzone } from './components/ImageDropzone';
import { SliderDiff, SegmentedButton } from './components/DiffViewer/SliderDiff';
import { SideBySideDiff } from './components/DiffViewer/SideBySideDiff';
import { ZoomToolbar, ZOOM_STEP, MIN_ZOOM, MAX_ZOOM } from './components/DiffViewer/ZoomToolbar';
import { AnnotationToolbar } from './components/Annotation/AnnotationToolbar';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import type { Annotation, AnnotationTool } from './types/annotation';
import { DEFAULT_ANNOTATION_COLOR } from './types/annotation';
import { Columns, GitCompare, Trash2, Github } from 'lucide-react';
import { Button, IconButton } from './components/ui/Button';

type ViewMode = 'slider' | 'side-by-side';

interface ImageSize {
  width: number;
  height: number;
}

function App() {
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [beforeSize, setBeforeSize] = useState<ImageSize | null>(null);
  const [afterSize, setAfterSize] = useState<ImageSize | null>(null);
  const [mode, setMode] = useState<ViewMode>('slider');
  const [zoom, setZoom] = useState(1);

  // 标注状态
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [primaryTool, setPrimaryTool] = useState<AnnotationTool>('select'); // 用户选择的主工具
  const [currentTool, setCurrentTool] = useState<AnnotationTool>('select'); // 当前实际工具（可能是临时的）
  const [currentColor, setCurrentColor] = useState(DEFAULT_ANNOTATION_COLOR);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  // 模式切换确认对话框
  const [pendingMode, setPendingMode] = useState<ViewMode | null>(null);
  const [showModeConfirm, setShowModeConfirm] = useState(false);

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

  // 键盘快捷键：A 切换箭头，R 切换矩形
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果在输入框中，不处理快捷键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // 只有在有图片时才处理快捷键
      if (!beforeImage || !afterImage) return;

      const key = e.key.toLowerCase();
      if (key === 'a') {
        e.preventDefault();
        setPrimaryTool('arrow');
        setCurrentTool('arrow');
      } else if (key === 'r') {
        e.preventDefault();
        setPrimaryTool('rect');
        setCurrentTool('rect');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [beforeImage, afterImage]);

  // Cleanup object URLs on unmount or change
  useEffect(() => {
    return () => {
      if (beforeImage) URL.revokeObjectURL(beforeImage);
      if (afterImage) URL.revokeObjectURL(afterImage);
    };
  }, []);

  const handleImageUpload = (file: File, type: 'before' | 'after') => {
    const url = URL.createObjectURL(file);

    // 获取图片尺寸
    const img = new Image();
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
    } else {
      if (afterImage) URL.revokeObjectURL(afterImage);
      setAfterImage(url);
    }
  };

  const handleClear = () => {
    if (beforeImage) URL.revokeObjectURL(beforeImage);
    if (afterImage) URL.revokeObjectURL(afterImage);
    setBeforeImage(null);
    setAfterImage(null);
    setBeforeSize(null);
    setAfterSize(null);
    // 清除标注
    setAnnotations([]);
    setSelectedAnnotationId(null);
    setCurrentTool('select');
  };

  const hasBothImages = beforeImage && afterImage;

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
        <div className="px-4 h-16 flex items-center justify-between">
            {/* Leading Icon/Logo */}
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-md-primary-container text-md-on-primary-container rounded-full flex items-center justify-center">
                 <GitCompare size={24} />
              </div>
              <h1 className="text-xl font-normal text-md-on-surface tracking-tight hidden sm:block">
                Pixel<span className="font-bold">Diff</span>
              </h1>
           </div>
           
           {/* Center Content (Title or Actions) */}
           <div className="flex-1 flex justify-center">
                {hasBothImages && (
                    <SegmentedButton
                        value={mode}
                        onChange={(v) => handleModeChange(v as ViewMode)}
                        options={[
                            { value: 'slider', label: 'Slider', icon: GitCompare },
                            { value: 'side-by-side', label: 'Side by Side', icon: Columns },
                        ]}
                    />
                )}
           </div>

           {/* Trailing Actions */}
           <div className="flex items-center gap-2">
             <IconButton 
                variant="text" 
                icon={Github} 
                onClick={() => window.open('https://github.com', '_blank')}
                title="View on GitHub"
             />
             {(beforeImage || afterImage) && (
                <Button 
                    variant="text" 
                    label="Clear All" 
                    icon={Trash2} 
                    onClick={handleClear}
                    className="hidden sm:flex text-md-error hover:bg-md-error/10"
                />
             )}
              {(beforeImage || afterImage) && (
                 <IconButton 
                 variant="filled" 
                 icon={Trash2} 
                 onClick={handleClear}
                 className="sm:hidden bg-md-error-container text-md-on-error-container hover:bg-md-error-container/80"
              />
              )}
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
          {hasBothImages ? (
             <div className="flex-1 flex flex-col min-h-0 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Diff 画布区域 */}
               <div className="flex-1 overflow-hidden relative">
                 {mode === 'slider' ? (
                   <SliderDiff
                     beforeImage={beforeImage}
                     afterImage={afterImage}
                     zoom={zoom}
                     hasTopTip={!!sizeMismatch}
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
                   <SideBySideDiff
                     beforeImage={beforeImage}
                     afterImage={afterImage}
                     zoom={zoom}
                     beforeSize={beforeSize}
                     afterSize={afterSize}
                     hasTopTip={!!sizeMismatch}
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
                       {aspectRatioMatch ? '尺寸不同（比例相同，已自动对齐）：' : '⚠️ 宽高比不同，Slider 比较可能不准确：'}
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
             <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl h-auto lg:h-[500px]">
                  <ImageDropzone
                    label="Original / Before"
                    image={beforeImage}
                    onImageUpload={(f) => handleImageUpload(f, 'before')}
                    onClear={() => {
                        if (beforeImage) URL.revokeObjectURL(beforeImage);
                        setBeforeImage(null);
                        setBeforeSize(null);
                    }}
                    className="shadow-md-1 hover:shadow-md-3"
                  />
                  <ImageDropzone
                    label="Modified / After"
                    image={afterImage}
                    onImageUpload={(f) => handleImageUpload(f, 'after')}
                    onClear={() => {
                        if (afterImage) URL.revokeObjectURL(afterImage);
                        setAfterImage(null);
                        setAfterSize(null);
                    }}
                     className="shadow-md-1 hover:shadow-md-3"
                  />
                </div>
             </div>
          )}
      </main>

      {/* 模式切换确认对话框 */}
      <ConfirmDialog
        isOpen={showModeConfirm}
        title="切换视图模式"
        message={`切换到${pendingMode === 'slider' ? 'Slider' : 'Side by Side'}模式将清空当前所有标注（${annotations.length}个），确定要继续吗？`}
        confirmText="确认切换"
        cancelText="取消"
        onConfirm={handleConfirmModeChange}
        onCancel={handleCancelModeChange}
      />
    </div>
  );
}

export default App;
