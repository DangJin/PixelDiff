import { Trash2, Image, Film } from 'lucide-react';
import type { RecentDiffItem } from '../../hooks/useRecentDiffs';

interface RecentDiffsListProps {
  recentDiffs: RecentDiffItem[];
  onSelect: (item: RecentDiffItem) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  isLoading?: boolean;
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

export const RecentDiffsList: React.FC<RecentDiffsListProps> = ({
  recentDiffs,
  onSelect,
  onRemove,
  onClearAll,
  isLoading = false,
}) => {
  if (recentDiffs.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-md-on-surface-variant">
          Recent Comparisons
        </h3>
        <button
          onClick={onClearAll}
          className="text-xs text-md-on-surface-variant hover:text-md-error transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* List */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-md-outline-variant scrollbar-track-transparent">
        {recentDiffs.map((item) => (
          <div
            key={item.id}
            className={`group relative flex-shrink-0 w-48 bg-md-surface-container rounded-2xl overflow-hidden border border-md-outline-variant/50 hover:border-md-primary transition-all cursor-pointer ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={() => onSelect(item)}
          >
            {/* Thumbnails */}
            <div className="flex h-20">
              <div className="flex-1 relative overflow-hidden">
                <img
                  src={item.beforeThumbnail}
                  alt="Before"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-px bg-md-outline-variant/50" />
              <div className="flex-1 relative overflow-hidden">
                <img
                  src={item.afterThumbnail}
                  alt="After"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Info */}
            <div className="px-3 py-2 flex items-center justify-between bg-md-surface-container-low">
              <div className="flex items-center gap-1.5 text-xs text-md-on-surface-variant">
                {item.contentMode === 'image' ? (
                  <Image size={12} />
                ) : (
                  <Film size={12} />
                )}
                <span>{formatTime(item.timestamp)}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
                className="p-1 rounded-full text-md-on-surface-variant hover:text-md-error hover:bg-md-error/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
