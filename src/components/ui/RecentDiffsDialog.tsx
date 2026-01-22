import { useEffect, useState } from 'react';
import { X, Trash2, Image, Film } from 'lucide-react';
import type { RecentDiffItem } from '../../hooks/useRecentDiffs';

type FilterType = 'all' | 'image' | 'video';

interface RecentDiffsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recentDiffs: RecentDiffItem[];
  onSelect: (item: RecentDiffItem) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

const formatTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  return new Date(timestamp).toLocaleDateString();
};

export const RecentDiffsDialog: React.FC<RecentDiffsDialogProps> = ({
  isOpen,
  onClose,
  recentDiffs,
  onSelect,
  onRemove,
  onClearAll,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');

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

  // Reset filter when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFilter('all');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const imageCount = recentDiffs.filter(item => item.contentMode === 'image').length;
  const videoCount = recentDiffs.filter(item => item.contentMode === 'video').length;

  const filteredDiffs = filter === 'all'
    ? recentDiffs
    : recentDiffs.filter(item => item.contentMode === filter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-md-surface rounded-3xl shadow-md-3 w-full max-w-2xl mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-md-outline-variant">
          <h2 className="text-lg font-medium text-md-on-surface">
            Recent Comparisons
          </h2>
          <div className="flex items-center gap-2">
            {recentDiffs.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-sm text-md-error hover:bg-md-error/10 px-3 py-1.5 rounded-full transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-md-on-surface-variant hover:bg-md-on-surface/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        {recentDiffs.length > 0 && (
          <div className="px-6 pt-4 flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm rounded-full transition-colors ${
                filter === 'all'
                  ? 'bg-md-primary text-md-on-primary'
                  : 'bg-md-surface-container-high text-md-on-surface-variant hover:bg-md-surface-container-highest'
              }`}
            >
              All ({recentDiffs.length})
            </button>
            <button
              onClick={() => setFilter('image')}
              className={`px-4 py-2 text-sm rounded-full transition-colors flex items-center gap-1.5 ${
                filter === 'image'
                  ? 'bg-md-primary text-md-on-primary'
                  : 'bg-md-surface-container-high text-md-on-surface-variant hover:bg-md-surface-container-highest'
              }`}
            >
              <Image size={14} />
              Images ({imageCount})
            </button>
            <button
              onClick={() => setFilter('video')}
              className={`px-4 py-2 text-sm rounded-full transition-colors flex items-center gap-1.5 ${
                filter === 'video'
                  ? 'bg-md-primary text-md-on-primary'
                  : 'bg-md-surface-container-high text-md-on-surface-variant hover:bg-md-surface-container-highest'
              }`}
            >
              <Film size={14} />
              Videos ({videoCount})
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {recentDiffs.length === 0 ? (
            <div className="text-center py-12 text-md-on-surface-variant">
              <p className="text-sm">No recent comparisons</p>
              <p className="text-xs mt-1 opacity-70">Your comparison history will appear here</p>
            </div>
          ) : filteredDiffs.length === 0 ? (
            <div className="text-center py-12 text-md-on-surface-variant">
              <p className="text-sm">No {filter} comparisons</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDiffs.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-md-surface-container rounded-2xl overflow-hidden border border-md-outline-variant hover:border-md-primary transition-colors cursor-pointer"
                  onClick={() => onSelect(item)}
                >
                  {/* Thumbnails */}
                  <div className="flex">
                    <div className="flex-1 relative">
                      <img
                        src={item.beforeThumbnail}
                        alt="Before"
                        className="w-full h-24 object-cover"
                      />
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                        Before
                      </span>
                    </div>
                    <div className="w-px bg-md-outline-variant" />
                    <div className="flex-1 relative">
                      <img
                        src={item.afterThumbnail}
                        alt="After"
                        className="w-full h-24 object-cover"
                      />
                      <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                        After
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-md-on-surface-variant">
                      {item.contentMode === 'image' ? (
                        <Image size={14} />
                      ) : (
                        <Film size={14} />
                      )}
                      <span>{formatTime(item.timestamp)}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item.id);
                      }}
                      className="p-1.5 rounded-full text-md-on-surface-variant hover:text-md-error hover:bg-md-error/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {recentDiffs.length > 0 && (
          <div className="px-6 py-3 border-t border-md-outline-variant bg-md-surface-container-low">
            <p className="text-xs text-md-on-surface-variant text-center">
              Click to reopen comparison
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
