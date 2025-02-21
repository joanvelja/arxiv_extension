import { parseString } from 'xml2js';
import { PaperMetadata, APIResponse, APIErrorType } from '../types';
import { normalizeArxivID } from '../utils/url-parser';

const ARXIV_API_CONFIG = {
  BASE_URL: 'http://export.arxiv.org/api/query',
  RATE_LIMIT: 3000, // 3 seconds between requests
  TIMEOUT: 5000,    // 5 second timeout
  MAX_RETRIES: 3
};

let lastRequestTime = 0;

async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < ARXIV_API_CONFIG.RATE_LIMIT) {
    await wait(ARXIV_API_CONFIG.RATE_LIMIT - timeSinceLastRequest);
  }
  
  lastRequestTime = Date.now();
}

function parseArxivResponse(xml: string): Promise<PaperMetadata> {
  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) {
        reject({
          type: APIErrorType.PARSING_ERROR,
          message: 'Failed to parse arXiv API response'
        });
        return;
      }

      try {
        const entry = result.feed.entry[0];
        const metadata: PaperMetadata = {
          id: normalizeArxivID(entry.id[0].split('/abs/')[1]),
          title: entry.title[0].trim(),
          authors: entry.author.map((author: any) => author.name[0]),
          source: 'arxiv',
          url: entry.id[0],
          published: new Date(entry.published[0]),
          updated: new Date(entry.updated[0]),
          abstract: entry.summary[0]
        };
        resolve(metadata);
      } catch (error) {
        reject({
          type: APIErrorType.PARSING_ERROR,
          message: 'Invalid arXiv API response format'
        });
      }
    });
  });
}

export async function fetchArxivMetadata(id: string): Promise<APIResponse<PaperMetadata>> {
  try {
    await enforceRateLimit();

    const normalizedId = normalizeArxivID(id);
    const url = `${ARXIV_API_CONFIG.BASE_URL}?id_list=${normalizedId}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ARXIV_API_CONFIG.TIMEOUT);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 429) {
        return {
          success: false,
          error: {
            type: APIErrorType.RATE_LIMIT_EXCEEDED,
            message: 'ArXiv API rate limit exceeded',
            retryAfter: parseInt(response.headers.get('Retry-After') || '3000')
          }
        };
      }

      return {
        success: false,
        error: {
          type: APIErrorType.NETWORK_ERROR,
          message: `ArXiv API returned status ${response.status}`
        }
      };
    }

    const xml = await response.text();
    const metadata = await parseArxivResponse(xml);

    return {
      success: true,
      data: metadata
    };

  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            type: APIErrorType.NETWORK_ERROR,
            message: 'ArXiv API request timed out'
          }
        };
      }

      return {
        success: false,
        error: {
          type: APIErrorType.NETWORK_ERROR,
          message: error.message || 'Unknown error occurred'
        }
      };
    }

    return {
      success: false,
      error: {
        type: APIErrorType.NETWORK_ERROR,
        message: 'Unknown error occurred'
      }
    };
  }
} 