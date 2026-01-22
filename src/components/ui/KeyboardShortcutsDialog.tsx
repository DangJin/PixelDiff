import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Annotation Tools',
    shortcuts: [
      { keys: ['V'], description: 'Select tool' },
      { keys: ['A'], description: 'Arrow tool' },
      { keys: ['R'], description: 'Rectangle tool' },
      { keys: ['Delete'], description: 'Delete selected annotation' },
    ],
  },
  {
    title: 'Video Playback',
    shortcuts: [
      { keys: ['Space'], description: 'Play / Pause' },
      { keys: ['\u2190'], description: 'Previous frame' },
      { keys: ['\u2192'], description: 'Next frame' },
    ],
  },
];

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-md-surface rounded-3xl shadow-md-3 w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-md-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-md-secondary-container text-md-on-secondary-container rounded-full flex items-center justify-center">
              <Keyboard size={20} />
            </div>
            <h2 className="text-lg font-medium text-md-on-surface">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-md-on-surface-variant hover:bg-md-on-surface/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {shortcutGroups.map((group, groupIndex) => (
            <div key={group.title} className={groupIndex > 0 ? 'mt-6' : ''}>
              <h3 className="text-sm font-medium text-md-on-surface-variant mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm text-md-on-surface">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={key}>
                          {keyIndex > 0 && (
                            <span className="text-xs text-md-on-surface-variant mx-1">
                              +
                            </span>
                          )}
                          <kbd className="min-w-[28px] h-7 px-2 bg-md-surface-container-high text-md-on-surface text-xs font-medium rounded-lg flex items-center justify-center border border-md-outline-variant shadow-sm">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-md-outline-variant bg-md-surface-container-low">
          <p className="text-xs text-md-on-surface-variant text-center">
            Press <kbd className="px-1.5 py-0.5 bg-md-surface-container-high rounded text-[10px] font-medium border border-md-outline-variant">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
};
