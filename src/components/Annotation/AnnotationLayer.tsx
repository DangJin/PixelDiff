import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import type { Annotation, AnnotationTool, ArrowAnnotation, RectAnnotation, CircleAnnotation } from '../../types/annotation';

interface AnnotationLayerProps {
  annotations: Annotation[];
  currentTool: AnnotationTool;
  currentColor: string;
  selectedId: string | null;
  onAnnotationAdd: (annotation: Annotation) => void;
  onAnnotationSelect: (id: string | null) => void;
  onDeleteSelected?: () => void;
  onToolChange?: (tool: AnnotationTool) => void;
  onAnnotationHover?: (isHovering: boolean) => void;
  zoom: number;
  pan: { x: number; y: number };
  disabled?: boolean;
}

// 生成唯一 ID
const generateId = () => `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  annotations,
  currentTool,
  currentColor,
  selectedId,
  onAnnotationAdd,
  onAnnotationSelect,
  onDeleteSelected,
  onToolChange,
  onAnnotationHover,
  zoom,
  pan,
  disabled = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [drawEnd, setDrawEnd] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 监听容器尺寸变化
  useEffect(() => {
    if (!svgRef.current) return;

    const updateSize = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(svgRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // 键盘删除功能
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && onDeleteSelected) {
        e.preventDefault();
        onDeleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, onDeleteSelected]);

  // 将屏幕坐标转换为 SVG 坐标（考虑 zoom 和 pan，以中心为原点）
  const screenToSvg = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // 先获取相对于 SVG 的坐标
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    // CSS transform 以中心为原点：
    // 屏幕坐标 = (SVG坐标 - 中心) * zoom + 中心 + pan
    // 反向计算：SVG坐标 = (屏幕坐标 - 中心 - pan) / zoom + 中心
    const x = (relX - centerX - pan.x) / zoom + centerX;
    const y = (relY - centerY - pan.y) / zoom + centerY;

    return { x, y };
  }, [zoom, pan]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || currentTool === 'select') return;

    e.preventDefault();
    e.stopPropagation();

    const pos = screenToSvg(e.clientX, e.clientY);
    setIsDrawing(true);
    setDrawStart(pos);
    setDrawEnd(pos);
    onAnnotationSelect(null);
  }, [disabled, currentTool, screenToSvg, onAnnotationSelect]);

  // 使用 ref 存储最新的绘制状态，避免闭包问题
  const drawingStateRef = useRef({ drawStart, drawEnd, currentTool, currentColor });
  drawingStateRef.current = { drawStart, drawEnd, currentTool, currentColor };

  // 使用 window 级别的事件监听来处理绘制过程中的鼠标移动和释放
  useEffect(() => {
    if (!isDrawing) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const pos = screenToSvg(e.clientX, e.clientY);
      setDrawEnd(pos);
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsDrawing(false);

      const { drawStart, currentTool, currentColor } = drawingStateRef.current;
      const pos = screenToSvg(e.clientX, e.clientY);

      // 检查是否有足够的移动距离
      const dx = Math.abs(pos.x - drawStart.x);
      const dy = Math.abs(pos.y - drawStart.y);
      if (dx < 5 && dy < 5) return;

      if (currentTool === 'arrow') {
        const arrow: ArrowAnnotation = {
          id: generateId(),
          type: 'arrow',
          color: currentColor,
          startX: drawStart.x,
          startY: drawStart.y,
          endX: pos.x,
          endY: pos.y,
        };
        onAnnotationAdd(arrow);
      } else if (currentTool === 'rect') {
        const rect: RectAnnotation = {
          id: generateId(),
          type: 'rect',
          color: currentColor,
          x: Math.min(drawStart.x, pos.x),
          y: Math.min(drawStart.y, pos.y),
          width: Math.abs(pos.x - drawStart.x),
          height: Math.abs(pos.y - drawStart.y),
        };
        onAnnotationAdd(rect);
      } else if (currentTool === 'circle') {
        const radius = Math.sqrt(dx * dx + dy * dy);
        const circle: CircleAnnotation = {
          id: generateId(),
          type: 'circle',
          color: currentColor,
          centerX: drawStart.x,
          centerY: drawStart.y,
          radius: radius,
        };
        onAnnotationAdd(circle);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDrawing, screenToSvg, onAnnotationAdd]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
  }, [isDrawing]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // Window 级别的事件处理器会处理
    e.preventDefault();
  }, []);

  const handleAnnotationClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();

    // 如果在绘制模式下点击标注，自动切换到选择模式
    if (currentTool !== 'select' && onToolChange) {
      onToolChange('select');
    }

    // 选中/取消选中标注
    onAnnotationSelect(selectedId === id ? null : id);
  }, [currentTool, selectedId, onAnnotationSelect, onToolChange]);

  const handleSvgClick = useCallback((e: React.MouseEvent) => {
    if (currentTool === 'select' && e.target === svgRef.current) {
      onAnnotationSelect(null);
    }
  }, [currentTool, onAnnotationSelect]);

  // 判断是否是绘制模式
  const isDrawingMode = currentTool === 'arrow' || currentTool === 'rect' || currentTool === 'circle';

  // 渲染箭头
  const renderArrow = (arrow: ArrowAnnotation, isSelected: boolean) => {
    const markerId = `arrowhead-${arrow.id}`;
    return (
      <g
        key={arrow.id}
        onClick={(e) => handleAnnotationClick(e, arrow.id)}
        onMouseEnter={() => onAnnotationHover?.(true)}
        onMouseLeave={() => onAnnotationHover?.(false)}
        style={{ pointerEvents: 'auto' }}
      >
        <defs>
          <marker
            id={markerId}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill={arrow.color} />
          </marker>
        </defs>
        {/* 选中时的高亮背景 */}
        {isSelected && (
          <line
            x1={arrow.startX}
            y1={arrow.startY}
            x2={arrow.endX}
            y2={arrow.endY}
            stroke="white"
            strokeWidth={6 / zoom}
            strokeLinecap="round"
          />
        )}
        <line
          x1={arrow.startX}
          y1={arrow.startY}
          x2={arrow.endX}
          y2={arrow.endY}
          stroke={arrow.color}
          strokeWidth={3 / zoom}
          strokeLinecap="round"
          markerEnd={`url(#${markerId})`}
          className={cn(
            "cursor-pointer transition-opacity",
            currentTool === 'select' && "hover:opacity-70"
          )}
        />
      </g>
    );
  };

  // 渲染矩形遮罩
  const renderRect = (rect: RectAnnotation, isSelected: boolean) => {
    return (
      <g
        key={rect.id}
        onClick={(e) => handleAnnotationClick(e, rect.id)}
        onMouseEnter={() => onAnnotationHover?.(true)}
        onMouseLeave={() => onAnnotationHover?.(false)}
        style={{ pointerEvents: 'auto' }}
      >
        {/* 选中时的边框 */}
        {isSelected && (
          <rect
            x={rect.x - 2 / zoom}
            y={rect.y - 2 / zoom}
            width={rect.width + 4 / zoom}
            height={rect.height + 4 / zoom}
            fill="none"
            stroke="white"
            strokeWidth={2 / zoom}
            strokeDasharray={`${4 / zoom} ${4 / zoom}`}
          />
        )}
        <rect
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          fill={rect.color}
          fillOpacity={0.3}
          stroke={rect.color}
          strokeWidth={2 / zoom}
          className={cn(
            "cursor-pointer transition-opacity",
            currentTool === 'select' && "hover:opacity-70"
          )}
        />
      </g>
    );
  };

  // 渲染圆形
  const renderCircle = (circle: CircleAnnotation, isSelected: boolean) => {
    return (
      <g
        key={circle.id}
        onClick={(e) => handleAnnotationClick(e, circle.id)}
        onMouseEnter={() => onAnnotationHover?.(true)}
        onMouseLeave={() => onAnnotationHover?.(false)}
        style={{ pointerEvents: 'auto' }}
      >
        {/* 选中时的边框 */}
        {isSelected && (
          <circle
            cx={circle.centerX}
            cy={circle.centerY}
            r={circle.radius + 2 / zoom}
            fill="none"
            stroke="white"
            strokeWidth={2 / zoom}
            strokeDasharray={`${4 / zoom} ${4 / zoom}`}
          />
        )}
        <circle
          cx={circle.centerX}
          cy={circle.centerY}
          r={circle.radius}
          fill={circle.color}
          fillOpacity={0.3}
          stroke={circle.color}
          strokeWidth={2 / zoom}
          className={cn(
            "cursor-pointer transition-opacity",
            currentTool === 'select' && "hover:opacity-70"
          )}
        />
      </g>
    );
  };

  // 渲染正在绘制的标注
  const renderDrawing = () => {
    if (!isDrawing) return null;

    if (currentTool === 'arrow') {
      return (
        <line
          x1={drawStart.x}
          y1={drawStart.y}
          x2={drawEnd.x}
          y2={drawEnd.y}
          stroke={currentColor}
          strokeWidth={3 / zoom}
          strokeLinecap="round"
          strokeDasharray={`${5 / zoom} ${5 / zoom}`}
        />
      );
    }

    if (currentTool === 'rect') {
      return (
        <rect
          x={Math.min(drawStart.x, drawEnd.x)}
          y={Math.min(drawStart.y, drawEnd.y)}
          width={Math.abs(drawEnd.x - drawStart.x)}
          height={Math.abs(drawEnd.y - drawStart.y)}
          fill={currentColor}
          fillOpacity={0.2}
          stroke={currentColor}
          strokeWidth={2 / zoom}
          strokeDasharray={`${5 / zoom} ${5 / zoom}`}
        />
      );
    }

    if (currentTool === 'circle') {
      const dx = drawEnd.x - drawStart.x;
      const dy = drawEnd.y - drawStart.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      return (
        <circle
          cx={drawStart.x}
          cy={drawStart.y}
          r={radius}
          fill={currentColor}
          fillOpacity={0.2}
          stroke={currentColor}
          strokeWidth={2 / zoom}
          strokeDasharray={`${5 / zoom} ${5 / zoom}`}
        />
      );
    }

    return null;
  };

  return (
    <svg
      ref={svgRef}
      className={cn(
        "absolute inset-0 w-full h-full",
        isDrawingMode && "cursor-crosshair"
      )}
      style={{
        zIndex: 10,
        // 绘制模式：SVG 捕获所有事件
        // 选择模式：SVG 不捕获事件，但标注元素可以点击（通过 pointerEvents: auto）
        pointerEvents: isDrawingMode ? 'auto' : 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleSvgClick}
    >
      {/* 应用 zoom 和 pan 变换的组 - 以中心为原点，匹配 CSS transform 行为 */}
      <g transform={`translate(${containerSize.width / 2 + pan.x}, ${containerSize.height / 2 + pan.y}) scale(${zoom}) translate(${-containerSize.width / 2}, ${-containerSize.height / 2})`}>
        {annotations.map((ann) => {
          const isSelected = ann.id === selectedId;
          if (ann.type === 'arrow') {
            return renderArrow(ann as ArrowAnnotation, isSelected);
          }
          if (ann.type === 'rect') {
            return renderRect(ann as RectAnnotation, isSelected);
          }
          if (ann.type === 'circle') {
            return renderCircle(ann as CircleAnnotation, isSelected);
          }
          return null;
        })}
        {renderDrawing()}
      </g>
    </svg>
  );
};
