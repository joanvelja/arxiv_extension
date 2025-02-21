import { CacheEntry, CacheConfig, PaperMetadata } from '../types';

const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 1000,
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  cleanupInterval: 60 * 60 * 1000 // 1 hour
};

export class Cache {
  public readonly cache: Map<string, CacheEntry>;
  private config: CacheConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();
    this.cleanupTimer = null;
    this.startCleanupTimer();
  }

  public async get(url: string): Promise<PaperMetadata | null> {
    const entry = this.cache.get(url);
    if (!entry) return null;

    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.cache.delete(url);
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    return entry.data;
  }

  public async set(url: string, data: PaperMetadata): Promise<void> {
    // Evict entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }

    this.cache.set(url, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    });
  }

  public async clear(): Promise<void> {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.config.ttl;
  }

  private evict(): void {
    // Remove oldest 10% of entries
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    const toRemove = Math.ceil(this.config.maxSize * 0.1);
    entries.slice(0, toRemove).forEach(([key]) => this.cache.delete(key));
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [url, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(url);
      }
    }
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    // Use setInterval directly (available in service worker context)
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Create a singleton instance
export const paperCache = new Cache(); 