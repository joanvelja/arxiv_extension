# API Integration Details

## Arxiv API Integration

### Endpoint Structure
```typescript
const ARXIV_API_CONFIG = {
  BASE_URL: 'http://export.arxiv.org/api/query',
  RATE_LIMIT: 3000, // 3 seconds between requests
  TIMEOUT: 5000,    // 5 second timeout
  MAX_RETRIES: 3
};
```

### Response Processing
```typescript
interface ArxivPaperMetadata {
  id: string;           // Paper ID
  title: string;        // Paper title
  authors: string[];    // Author list
  published: Date;      // Publication date
  updated: Date;        // Last update date
  abstract?: string;    // Optional abstract
}

// Example XML response structure
/*
<entry>
  <id>http://arxiv.org/abs/2106.05963</id>
  <title>Paper Title Here</title>
  <author>
    <name>Author Name</name>
  </author>
  <published>2021-06-10T17:45:00Z</published>
  <updated>2021-06-11T12:30:00Z</updated>
</entry>
*/
```

### Error Handling
```typescript
enum ArxivAPIError {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_ID = 'INVALID_ID',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSING_ERROR = 'PARSING_ERROR'
}

interface APIErrorResponse {
  type: ArxivAPIError;
  message: string;
  retryAfter?: number;
}
```

## OpenReview API Integration

### Endpoint Structure
```typescript
const OPENREVIEW_API_CONFIG = {
  BASE_URL: 'https://api.openreview.net/notes',
  RATE_LIMIT: 1000,  // 1 second between requests
  TIMEOUT: 5000,     // 5 second timeout
  MAX_RETRIES: 2
};
```

### Response Processing
```typescript
interface OpenReviewPaperMetadata {
  id: string;
  title: string;
  authors: string[];
  venue?: string;      // Conference/journal
  year?: number;
  keywords?: string[];
}
```

## Fallback HTML Metadata Extraction

### Priority Order
1. Schema.org metadata
2. Dublin Core
3. Open Graph
4. Citation metadata
5. Basic HTML title

### Extraction Patterns
```typescript
const METADATA_SELECTORS = {
  SCHEMA_ORG: {
    title: 'script[type="application/ld+json"]',
    fallback: 'meta[property="schema:name"]'
  },
  DUBLIN_CORE: {
    title: 'meta[name="DC.title"]',
    authors: 'meta[name="DC.creator"]'
  },
  OPEN_GRAPH: {
    title: 'meta[property="og:title"]'
  },
  CITATION: {
    title: 'meta[name="citation_title"]',
    authors: 'meta[name="citation_author"]'
  }
};
```

## Request Queue Management

### Queue Structure
```typescript
interface RequestQueueItem {
  url: string;
  tabId: number;
  timestamp: number;
  retryCount: number;
  priority: number;    // Higher priority for visible tabs
}

class RequestQueue {
  private queue: RequestQueueItem[] = [];
  private processing: boolean = false;
  private lastRequestTime: Record<string, number> = {};  // Per domain tracking
}
```

### Rate Limiting Strategy
```typescript
interface RateLimitConfig {
  requestsPerMinute: number;
  burstSize: number;
  minimumGap: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'arxiv.org': {
    requestsPerMinute: 20,
    burstSize: 3,
    minimumGap: 3000
  },
  'openreview.net': {
    requestsPerMinute: 60,
    burstSize: 5,
    minimumGap: 1000
  }
};
```

## Caching Strategy

### Cache Structure
```typescript
interface CacheConfig {
  maxSize: number;        // Maximum number of entries
  ttl: number;           // Time to live in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
}

interface CacheEntry {
  data: PaperMetadata;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}
```

### LRU Implementation
```typescript
class LRUCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  
  private evict(): void {
    // Remove least recently used entries when cache is full
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    // Remove oldest 10% of entries
    const toRemove = Math.ceil(this.maxSize * 0.1);
    entries.slice(0, toRemove).forEach(([key]) => this.cache.delete(key));
  }
}
``` 