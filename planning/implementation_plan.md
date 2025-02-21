# Implementation Plan: Arxiv Tab Renamer Extension

## Repository Structure
```
arxiv_extension/
├── src/
│   ├── manifest.json           # Extension manifest
│   ├── background/
│   │   ├── background.js       # Service worker for API calls & tab management
│   │   └── api/
│   │       ├── arxiv.js        # Arxiv API integration
│   │       ├── openreview.js   # OpenReview API integration
│   │       └── metadata.js     # HTML metadata extraction utilities
│   ├── content/
│   │   └── content.js         # Content script for DOM manipulation
│   └── utils/
│       ├── url-parser.js      # URL pattern matching and parsing
│       ├── cache.js           # Local storage cache management
│       └── constants.js       # Configuration and constants
├── tests/                     # Test files
├── dist/                      # Built extension
├── docs/                      # Documentation
└── package.json              # Dependencies and scripts
```

## Component Architecture

### 1. Service Worker (background.js)
- **Purpose**: Central coordinator running in the background
- **Responsibilities**:
  - Listen for tab updates and URL changes
  - Coordinate API calls and metadata extraction
  - Manage tab title updates
  - Handle local storage caching
- **Constraints**:
  - Must be lightweight (Chrome limits service worker memory)
  - Use event-driven architecture to minimize resource usage
  - Cache results to avoid repeated API calls

### 2. API Integration Layer (api/)
- **Primary: Arxiv API Integration**
  ```javascript
  // Example structure
  class ArxivAPI {
    // Extract ID from URL patterns:
    // - arxiv.org/pdf/2106.05963.pdf
    // - arxiv.org/abs/2106.05963
    async extractPaperInfo(url) {...}
    
    // Fetch metadata from Arxiv API
    async fetchMetadata(paperId) {...}
  }
  ```
- **Secondary: OpenReview Integration**
  ```javascript
  class OpenReviewAPI {
    // Handle patterns like:
    // - openreview.net/pdf?id=RhEND1litL
    async extractPaperInfo(url) {...}
  }
  ```

### 3. Metadata Extraction (metadata.js)
- **Fallback Strategy**
- **Capabilities**:
  - Parse common metadata tags:
    - citation_title
    - og:title
    - DC.title
  - Extract PDF metadata when possible
  - Handle different page structures

### 4. URL Parser (url-parser.js)
```javascript
const URL_PATTERNS = {
  ARXIV: {
    PDF: /arxiv\.org\/pdf\/([0-9.]+)(\.pdf)?$/i,
    ABSTRACT: /arxiv\.org\/abs\/([0-9.]+)$/i
  },
  OPENREVIEW: {
    PDF: /openreview\.net\/pdf\?id=([\w\d]+)$/i
  }
  // Add more patterns as needed
};
```

### 5. Caching Layer (cache.js)
- **Structure**:
  ```javascript
  interface CacheEntry {
    title: string;
    source: 'arxiv' | 'openreview' | 'metadata';
    timestamp: number;
    url: string;
  }
  ```
- **Storage Strategy**:
  - Use Chrome's storage.local API
  - Implement LRU cache with size limits
  - Cache expiration after 24 hours

## Processing Flow

1. **Tab Update Detection**:
   ```javascript
   chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
     if (changeInfo.status === 'complete' && isPotentiallyPaper(tab.url)) {
       processPaperTab(tabId, tab.url);
     }
   });
   ```

2. **Title Resolution Pipeline**:
   ```mermaid
   graph TD
     A[New Tab URL] --> B{URL Pattern Match?}
     B -->|Yes| C[Check Cache]
     C -->|Hit| D[Update Tab Title]
     C -->|Miss| E{Try Arxiv API}
     E -->|Success| F[Cache & Update Title]
     E -->|Fail| G{Try OpenReview}
     G -->|Success| F
     G -->|Fail| H[Extract HTML Metadata]
     H -->|Success| F
     H -->|Fail| I[Keep Original Title]
   ```

## Performance Considerations

1. **Memory Management**:
   - Limit cache size to 1000 entries
   - Periodic cache cleanup
   - Use lightweight data structures

2. **API Rate Limiting**:
   - Implement exponential backoff
   - Respect API limits (arxiv: 1 request/3 seconds)
   - Queue requests when needed

3. **Error Handling**:
   - Graceful degradation through fallbacks
   - Error logging for debugging
   - User feedback for persistent failures

## Security Considerations

1. **Permission Model**:
   ```json
   {
     "permissions": [
       "tabs",
       "storage",
       "*://*.arxiv.org/*",
       "*://*.openreview.net/*"
     ],
     "host_permissions": [
       "*://*.arxiv.org/*",
       "*://*.openreview.net/*"
     ]
   }
   ```

2. **Data Safety**:
   - No sensitive data collection
   - Local-only storage
   - Clear cache on uninstall

## Development Workflow

1. **Setup Phase**:
   - Initialize with `manifest.json`
   - Set up TypeScript/ESLint
   - Configure build pipeline (webpack)

2. **Testing Strategy**:
   - Unit tests for parsers
   - Integration tests for API calls
   - End-to-end tests with Chrome extension API mocks

3. **Deployment Pipeline**:
   - Build and minify
   - Package extension
   - Chrome Web Store submission

## Future Extensibility

1. **Plugin System**:
   - Allow adding new paper source handlers
   - Pluggable metadata extractors
   - Custom title formatting rules

2. **Feature Expansion**:
   - User preferences for title format
   - Support for more paper repositories
   - Citation export integration

## Success Metrics

1. **Performance**:
   - Title update within 500ms for cached entries
   - < 2s for API-based resolution
   - < 100MB memory usage

2. **Reliability**:
   - 95% success rate for arxiv papers
   - 80% success rate for other sources
   - < 1% error rate

3. **User Experience**:
   - Seamless title updates
   - No visible performance impact
   - Clear feedback on failures 