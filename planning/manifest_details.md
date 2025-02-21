# Manifest.json Detailed Specification

## Basic Configuration
```json
{
  "manifest_version": 3,
  "name": "Academic Paper Tab Renamer",
  "version": "1.0.0",
  "description": "Automatically renames browser tabs containing academic papers to their actual titles",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

## Extension Architecture Components
```json
{
  "background": {
    "service_worker": "background/background.js",
    "type": "module"
  },
  "content_scripts": [{
    "matches": [
      "*://*.arxiv.org/*",
      "*://*.openreview.net/*",
      "*://*.*.pdf"
    ],
    "js": ["content/content.js"],
    "run_at": "document_idle"
  }]
}
```

## Permissions Breakdown
```json
{
  "permissions": [
    "tabs",              // For tab title manipulation
    "storage",           // For caching paper metadata
    "webRequest",        // For API requests
    "webNavigation"      // For precise page load detection
  ],
  "host_permissions": [
    "*://*.arxiv.org/*",      // Arxiv API access
    "*://*.openreview.net/*", // OpenReview access
    "*://*/*.pdf"            // General PDF detection
  ]
}
```

## Web Accessible Resources
```json
{
  "web_accessible_resources": [{
    "resources": [
      "icons/*"
    ],
    "matches": ["<all_urls>"]
  }]
}
```

## Content Security Policy
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self';"
  }
}
```

## Action Configuration
```json
{
  "action": {
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png"
    },
    "default_title": "Paper Tab Renamer"
  }
}
```

## Optional Features
```json
{
  "options_page": "options/options.html",  // For future user preferences
  "minimum_chrome_version": "88",          // Required for MV3
  "incognito": "split"                    // Separate incognito behavior
}
``` 