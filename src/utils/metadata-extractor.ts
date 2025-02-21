import { PaperMetadata, APIResponse, APIErrorType } from '../types';

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

function extractSchemaOrgData(): Partial<PaperMetadata> {
  const script = document.querySelector(METADATA_SELECTORS.SCHEMA_ORG.title);
  if (script) {
    try {
      const data = JSON.parse(script.textContent || '');
      if (data['@type'] === 'ScholarlyArticle') {
        return {
          title: data.name || data.headline,
          authors: Array.isArray(data.author) 
            ? data.author.map((a: any) => a.name).filter(Boolean)
            : data.author?.name ? [data.author.name] : [],
          abstract: data.description
        };
      }
    } catch (e) {
      console.warn('Failed to parse Schema.org data:', e);
    }
  }
  return {};
}

function extractDublinCoreData(): Partial<PaperMetadata> {
  const titleMeta = document.querySelector(METADATA_SELECTORS.DUBLIN_CORE.title);
  const authorMetas = document.querySelectorAll(METADATA_SELECTORS.DUBLIN_CORE.authors);
  const title = titleMeta?.getAttribute('content') || undefined;
  
  return {
    title,
    authors: Array.from(authorMetas)
      .map(meta => meta.getAttribute('content'))
      .filter((content): content is string => content !== null)
  };
}

function extractOpenGraphData(): Partial<PaperMetadata> {
  const titleMeta = document.querySelector(METADATA_SELECTORS.OPEN_GRAPH.title);
  const title = titleMeta?.getAttribute('content') || undefined;
  return { title };
}

function extractCitationData(): Partial<PaperMetadata> {
  const titleMeta = document.querySelector(METADATA_SELECTORS.CITATION.title);
  const authorMetas = document.querySelectorAll(METADATA_SELECTORS.CITATION.authors);
  const title = titleMeta?.getAttribute('content') || undefined;
  
  return {
    title,
    authors: Array.from(authorMetas)
      .map(meta => meta.getAttribute('content'))
      .filter((content): content is string => content !== null)
  };
}

export function extractMetadata(url: string): APIResponse<PaperMetadata> {
  try {
    // Try each metadata source in order of preference
    const metadata: Partial<PaperMetadata> = {
      ...extractSchemaOrgData(),
      ...extractDublinCoreData(),
      ...extractOpenGraphData(),
      ...extractCitationData()
    };

    // If we couldn't find a title anywhere, fall back to document title
    if (!metadata.title) {
      metadata.title = document.title || undefined;
    }

    // If we still don't have a title, return error
    if (!metadata.title) {
      return {
        success: false,
        error: {
          type: APIErrorType.NOT_FOUND,
          message: 'Could not extract paper title from page metadata'
        }
      };
    }

    // Clean up the title (remove common suffixes, etc.)
    metadata.title = cleanupTitle(metadata.title);

    return {
      success: true,
      data: {
        id: url,
        title: metadata.title,
        authors: metadata.authors || [],
        source: 'pdf',
        url: url,
        abstract: metadata.abstract
      }
    };

  } catch (error) {
    return {
      success: false,
      error: {
        type: APIErrorType.PARSING_ERROR,
        message: 'Failed to extract metadata from page'
      }
    };
  }
}

function cleanupTitle(title: string): string {
  return title
    // Remove common PDF suffixes
    .replace(/\.pdf$/i, '')
    // Remove common paper hosting suffixes
    .replace(/\s*\|\s*arXiv$/i, '')
    .replace(/\s*\|\s*OpenReview$/i, '')
    // Remove common paper title suffixes
    .replace(/\s*\|\s*Papers With Code$/i, '')
    // Trim whitespace
    .trim();
} 