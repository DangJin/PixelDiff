import React from 'react';
import { MousePointer2, MoveRight, Square, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { AnnotationTool } from '../../types/annotation';
import { ANNOTATION_COLORS } from '../../types/annotation';

interface AnnotationToolbarProps {
  currentTool: AnnotationTool;
  currentColor: string;
  onToolChange: (tool: AnnotationTool) => void;
  onColorChange: (color: string) => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
}

export const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  currentTool,
  currentColor,
  onToolChange,
  onColorChange,
  onDeleteSelected,
  hasSelection,
}) => {
  const tools: { tool: AnnotationTool; icon: React.ElementType; label: string }[] = [
    { tool: 'select', icon: MousePointer2, label: '选择' },
    { tool: 'arrow', icon: MoveRight, label: '箭头' },
    { tool: 'rect', icon: Square, label: '矩形遮罩' },
  ];

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 bg-md-surface/95 backdrop-blur-md rounded-2xl shadow-md-3 border border-md-outline-variant p-2">
      {/* 工具选择 */}
      <div className="flex flex-col gap-1">
        {tools.map(({ tool, icon: Icon, label }) => (
          <button
            key={tool}
            onClick={() => onToolChange(tool)}
            className={cn(
              "p-2.5 rounded-xl transition-colors",
              currentTool === tool
                ? "bg-md-primary text-md-on-primary"
                : "text-md-on-surface hover:bg-md-on-surface/10"
            )}
            title={label}
          >
            <Icon size={20} />
          </button>
        ))}
      </div>

      {/* 分隔线 */}
      <div className="h-px bg-md-outline-variant mx-1" />

      {/* 颜色选择 */}
      <div className="flex flex-col gap-1 p-1">
        {ANNOTATION_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={cn(
              "w-6 h-6 rounded-full transition-transform hover:scale-110",
              currentColor === color && "ring-2 ring-offset-2 ring-md-primary ring-offset-md-surface"
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* 分隔线 */}
      <div className="h-px bg-md-outline-variant mx-1" />

      {/* 删除按钮 */}
      <button
        onClick={onDeleteSelected}
        disabled={!hasSelection}
        className={cn(
          "p-2.5 rounded-xl transition-colors",
          hasSelection
            ? "text-md-error hover:bg-md-error/10"
            : "text-md-on-surface/30 cursor-not-allowed"
        )}
        title="删除选中"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
};
