# Privacy Policy for Academic Paper Tab Renamer

Last updated: February 21, 2025

## Overview

Academic Paper Tab Renamer is committed to protecting your privacy. This Privacy Policy explains how our Chrome extension handles information.

## Data Collection

### What We DO NOT Collect
- Personal information
- Browsing history
- Search queries
- Login credentials
- Any form of user analytics
- Any form of tracking data

### What We DO Access
The extension only accesses:
1. Tab URLs and titles (only for supported academic websites)
2. Paper metadata from official academic APIs
3. Local storage for caching paper information

## Data Usage

### Local Storage
- Paper metadata is cached locally in your browser
- Cache can be cleared at any time through the extension popup
- No data is transmitted to external servers except official academic APIs

### API Calls
The extension makes API calls to:
- api.arxiv.org (for arXiv papers)
- api2.openreview.net (for OpenReview papers)

These calls are made only to fetch paper metadata (title, authors, etc.) and are not used for tracking.

## Permissions

The extension requires minimal permissions:
1. `activeTab` permission:
   - Used only to rename the current tab's title
   - Only activates when you interact with the extension
   - Cannot access browsing history
   - Cannot access other tabs
   - More privacy-friendly than broad tabs permission

2. `storage` permission:
   - Used only for local caching
   - Data never leaves your browser

3. Host permissions:
   - Limited to specific academic websites
   - Used only to detect and rename paper tabs
   - No access to other websites

## Security

### Data Protection
- All processing happens locally in your browser
- Strong Content Security Policy (CSP) implemented
- No external scripts or resources loaded
- No cookies used or required

### Updates
- Updates are delivered through the Chrome Web Store
- Each update undergoes security review
- Update mechanism is secured by Chrome

## Changes to Privacy Policy

We will update this Privacy Policy as needed and notify users of significant changes through:
1. Chrome Web Store listing
2. GitHub repository
3. Extension changelog

## Contact

If you have questions about this Privacy Policy, please:
1. Open an issue on our GitHub repository
2. Contact the developer through GitHub

## Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- Google's Privacy Requirements for Chrome Extensions
- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act) 