import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* 对话框 */}
      <div className="relative bg-md-surface rounded-3xl shadow-md-3 p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-md-error-container rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-md-on-error-container" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-md-on-surface mb-1">
              {title}
            </h3>
            <p className="text-sm text-md-on-surface-variant">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-md-primary hover:bg-md-primary/10 rounded-full transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium bg-md-error text-md-on-error hover:bg-md-error/90 rounded-full transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
