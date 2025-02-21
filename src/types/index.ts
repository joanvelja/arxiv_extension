// Paper metadata types
export interface PaperMetadata {
  id: string;
  title: string;
  authors: string[];
  source: 'arxiv' | 'openreview' | 'pdf';
  url: string;
  published?: Date;
  updated?: Date;
  venue?: string;
  year?: number;
  abstract?: string;
}

// API Response types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}

export interface APIError {
  type: APIErrorType;
  message: string;
  retryAfter?: number;
}

export enum APIErrorType {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_ID = 'INVALID_ID',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  NOT_FOUND = 'NOT_FOUND'
}

// Extension Status
export interface ExtensionStatus {
  isActive: boolean;
  error?: string;
  renamedCount: number;
  cacheSize: number;
}

// Message types
export type Message = 
  | TabUpdateMessage
  | MetadataRequestMessage
  | MetadataResponseMessage
  | CacheCheckMessage
  | CacheUpdateMessage
  | GetStatusMessage
  | ClearCacheMessage
  | UpdateTitleMessage
  | ContentScriptReadyMessage;

export interface TabUpdateMessage {
  type: 'TAB_UPDATED';
  tabId: number;
  url: string;
  status: 'loading' | 'complete';
}

export interface MetadataRequestMessage {
  type: 'METADATA_REQUEST';
  url: string;
  tabId: number;
  source: PaperMetadata['source'];
}

export interface MetadataResponseMessage {
  type: 'METADATA_RESPONSE';
  success: boolean;
  data?: PaperMetadata;
  error?: APIError;
  tabId: number;
}

export interface CacheCheckMessage {
  type: 'CACHE_CHECK';
  url: string;
}

export interface CacheUpdateMessage {
  type: 'CACHE_UPDATE';
  url: string;
  data: PaperMetadata;
}

export interface GetStatusMessage {
  type: 'GET_STATUS';
}

export interface ClearCacheMessage {
  type: 'CLEAR_CACHE';
}

export interface UpdateTitleMessage {
  type: 'UPDATE_TITLE';
  title: string;
}

export interface ContentScriptReadyMessage {
  type: 'CONTENT_SCRIPT_READY';
  url: string;
}

// Cache types
export interface CacheEntry {
  data: PaperMetadata;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  maxSize: number;
  ttl: number;
  cleanupInterval: number;
}

// State types
export interface TabState {
  id: number;
  url: string;
  status: 'loading' | 'complete' | 'error';
  metadata?: PaperMetadata;
  lastUpdate: number;
  retryCount: number;
}

export interface RequestState {
  pending: Set<string>;
  failed: Map<string, APIError>;
  retryQueue: RequestQueueItem[];
}

export interface RequestQueueItem {
  url: string;
  tabId: number;
  timestamp: number;
  retryCount: number;
  priority: number;
} 