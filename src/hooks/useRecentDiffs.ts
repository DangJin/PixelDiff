import { useState, useEffect, useCallback } from 'react';

const DB_NAME = 'pixeldiff_db';
const DB_VERSION = 2; // 升级版本以支持文件句柄
const STORE_NAME = 'recent_diffs';
const META_KEY = 'pixeldiff_recent_meta';
const MAX_ITEMS = 10;
const THUMBNAIL_SIZE = 120;

export interface RecentDiffItem {
  id: string;
  contentMode: 'image' | 'video';
  beforeThumbnail: string;
  afterThumbnail: string;
  beforeName?: string;
  afterName?: string;
  timestamp: number;
}

// IndexedDB 中存储的文件句柄
interface StoredFileHandles {
  id: string;
  beforeHandle: FileSystemFileHandle;
  afterHandle: FileSystemFileHandle;
}

// 打开 IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // 删除旧的存储（如果存在）
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
  });
};

// 保存文件句柄到 IndexedDB
const saveHandlesToDB = async (data: StoredFileHandles): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// 从 IndexedDB 读取文件句柄
const loadHandlesFromDB = async (id: string): Promise<StoredFileHandles | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
};

// 从 IndexedDB 删除数据
const deleteFromDB = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// 清空 IndexedDB
const clearDB = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// 生成缩略图
const generateThumbnail = (
  source: string,
  type: 'image' | 'video'
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    if (type === 'image') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const scale = Math.min(THUMBNAIL_SIZE / img.width, THUMBNAIL_SIZE / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => resolve('');
      img.src = source;
    } else {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.onloadeddata = () => {
        video.currentTime = 0;
      };
      video.onseeked = () => {
        const scale = Math.min(THUMBNAIL_SIZE / video.videoWidth, THUMBNAIL_SIZE / video.videoHeight);
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      video.onerror = () => resolve('');
      video.src = source;
    }
  });
};

// 请求文件权限并读取
const requestFileAccess = async (
  handle: FileSystemFileHandle
): Promise<File | null> => {
  try {
    // 检查权限状态
    const permission = await handle.queryPermission({ mode: 'read' });

    if (permission === 'granted') {
      return await handle.getFile();
    }

    // 请求权限
    const requestResult = await handle.requestPermission({ mode: 'read' });
    if (requestResult === 'granted') {
      return await handle.getFile();
    }

    return null;
  } catch (e) {
    console.error('Failed to access file:', e);
    return null;
  }
};

export const useRecentDiffs = () => {
  const [recentDiffs, setRecentDiffs] = useState<RecentDiffItem[]>([]);

  // 从 localStorage 加载元数据
  useEffect(() => {
    try {
      const stored = localStorage.getItem(META_KEY);
      if (stored) {
        setRecentDiffs(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent diffs:', e);
    }
  }, []);

  // 保存元数据到 localStorage
  const saveMetaToStorage = useCallback((items: RecentDiffItem[]) => {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save recent diffs meta:', e);
    }
  }, []);

  // 添加新记录
  const addRecentDiff = useCallback(async (
    contentMode: 'image' | 'video',
    beforeSource: string,
    afterSource: string,
    beforeHandle?: FileSystemFileHandle,
    afterHandle?: FileSystemFileHandle,
    beforeName?: string,
    afterName?: string
  ) => {
    try {
      // 生成缩略图
      const [beforeThumbnail, afterThumbnail] = await Promise.all([
        generateThumbnail(beforeSource, contentMode),
        generateThumbnail(afterSource, contentMode),
      ]);

      if (!beforeThumbnail || !afterThumbnail) {
        return; // 生成缩略图失败，不保存
      }

      const id = `diff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 如果有文件句柄，保存到 IndexedDB
      if (beforeHandle && afterHandle) {
        await saveHandlesToDB({ id, beforeHandle, afterHandle });
      }

      const newItem: RecentDiffItem = {
        id,
        contentMode,
        beforeThumbnail,
        afterThumbnail,
        beforeName,
        afterName,
        timestamp: Date.now(),
      };

      setRecentDiffs((prev) => {
        // 移除重复项（基于缩略图内容）
        const filtered = prev.filter(
          (item) => item.beforeThumbnail !== beforeThumbnail || item.afterThumbnail !== afterThumbnail
        );

        // 删除被移除项的 IndexedDB 数据
        const removedItems = prev.filter(
          (item) => item.beforeThumbnail === beforeThumbnail && item.afterThumbnail === afterThumbnail
        );
        removedItems.forEach(item => deleteFromDB(item.id).catch(console.error));

        // 如果超过最大数量，删除最旧的
        const toRemove = filtered.slice(MAX_ITEMS - 1);
        toRemove.forEach(item => deleteFromDB(item.id).catch(console.error));

        const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
        saveMetaToStorage(updated);
        return updated;
      });
    } catch (e) {
      console.error('Failed to add recent diff:', e);
    }
  }, [saveMetaToStorage]);

  // 获取文件数据
  const getFileData = useCallback(async (id: string): Promise<{
    beforeUrl: string;
    afterUrl: string;
    beforeHandle: FileSystemFileHandle;
    afterHandle: FileSystemFileHandle;
  } | null> => {
    try {
      const handles = await loadHandlesFromDB(id);
      if (!handles) {
        return null;
      }

      // 请求权限并读取文件
      const [beforeFile, afterFile] = await Promise.all([
        requestFileAccess(handles.beforeHandle),
        requestFileAccess(handles.afterHandle),
      ]);

      if (!beforeFile || !afterFile) {
        return null;
      }

      // 创建 blob URL
      const beforeUrl = URL.createObjectURL(beforeFile);
      const afterUrl = URL.createObjectURL(afterFile);

      return {
        beforeUrl,
        afterUrl,
        beforeHandle: handles.beforeHandle,
        afterHandle: handles.afterHandle,
      };
    } catch (e) {
      console.error('Failed to load file data:', e);
      return null;
    }
  }, []);

  // 删除记录
  const removeRecentDiff = useCallback((id: string) => {
    deleteFromDB(id).catch(console.error);
    setRecentDiffs((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveMetaToStorage(updated);
      return updated;
    });
  }, [saveMetaToStorage]);

  // 清空所有记录
  const clearAllRecentDiffs = useCallback(() => {
    clearDB().catch(console.error);
    setRecentDiffs([]);
    localStorage.removeItem(META_KEY);
  }, []);

  return {
    recentDiffs,
    addRecentDiff,
    getFileData,
    removeRecentDiff,
    clearAllRecentDiffs,
  };
};
