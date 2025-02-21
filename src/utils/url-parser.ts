import { PaperMetadata } from '../types';

const URL_PATTERNS = {
  ARXIV: {
    PDF: /arxiv\.org\/pdf\/([0-9.]+)(\.pdf)?$/i,
    ABSTRACT: /arxiv\.org\/abs\/([0-9.]+)$/i
  },
  OPENREVIEW: {
    PDF: /openreview\.net\/pdf\?id=([\w\d]+)$/i,
    FORUM: /openreview\.net\/forum\?id=([\w\d]+)$/i
  }
};

export interface ParsedURL {
  type: PaperMetadata['source'];
  id: string;
  isPDF: boolean;
}

export function parseURL(url: string): ParsedURL | null {
  // Try Arxiv patterns
  const arxivPDF = url.match(URL_PATTERNS.ARXIV.PDF);
  if (arxivPDF) {
    return {
      type: 'arxiv',
      id: arxivPDF[1],
      isPDF: true
    };
  }

  const arxivAbs = url.match(URL_PATTERNS.ARXIV.ABSTRACT);
  if (arxivAbs) {
    return {
      type: 'arxiv',
      id: arxivAbs[1],
      isPDF: false
    };
  }

  // Try OpenReview patterns
  const openreviewPDF = url.match(URL_PATTERNS.OPENREVIEW.PDF);
  if (openreviewPDF) {
    return {
      type: 'openreview',
      id: openreviewPDF[1],
      isPDF: true
    };
  }

  const openreviewForum = url.match(URL_PATTERNS.OPENREVIEW.FORUM);
  if (openreviewForum) {
    return {
      type: 'openreview',
      id: openreviewForum[1],
      isPDF: false
    };
  }

  // Check if it's a generic PDF
  if (url.toLowerCase().endsWith('.pdf')) {
    return {
      type: 'pdf',
      id: url,
      isPDF: true
    };
  }

  return null;
}

export function isPaperURL(url: string): boolean {
  return parseURL(url) !== null;
}

export function normalizeArxivID(id: string): string {
  // Remove version number if present (e.g., v1, v2)
  return id.replace(/v\d+$/, '');
}

export function getCanonicalURL(parsed: ParsedURL): string {
  switch (parsed.type) {
    case 'arxiv':
      return `https://arxiv.org/abs/${normalizeArxivID(parsed.id)}`;
    case 'openreview':
      return `https://openreview.net/forum?id=${parsed.id}`;
    case 'pdf':
      return parsed.id;
    default:
      return '';
  }
} 