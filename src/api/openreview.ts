import { PaperMetadata, APIResponse, APIErrorType } from '../types';

const OPENREVIEW_API_CONFIG = {
  BASE_URL: 'https://api2.openreview.net/notes',
  TIMEOUT: 10000
};

export async function fetchOpenReviewMetadata(id: string): Promise<APIResponse<PaperMetadata>> {
  const apiUrl = `${OPENREVIEW_API_CONFIG.BASE_URL}?id=${encodeURIComponent(id)}`;
  console.log('[OpenReview API] Fetching metadata:', {
    id,
    apiUrl,
    timeout: OPENREVIEW_API_CONFIG.TIMEOUT
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      console.log('[OpenReview API] Request timed out after', OPENREVIEW_API_CONFIG.TIMEOUT, 'ms');
    }, OPENREVIEW_API_CONFIG.TIMEOUT);

    console.log('[OpenReview API] Sending request...');
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    clearTimeout(timeout);

    console.log('[OpenReview API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok
    });

    if (!response.ok) {
      return {
        success: false,
        error: {
          type: APIErrorType.NETWORK_ERROR,
          message: `OpenReview API returned status ${response.status} (${response.statusText})`
        }
      };
    }

    const data = await response.json();
    console.log('[OpenReview API] Raw response data:', {
      data,
      dataType: typeof data,
      hasNotes: Array.isArray(data.notes),
      noteCount: data.notes?.length
    });
    
    if (!data.notes || data.notes.length === 0) {
      return {
        success: false,
        error: {
          type: APIErrorType.NOT_FOUND,
          message: 'Paper not found in OpenReview'
        }
      };
    }

    const note = data.notes[0];
    console.log('[OpenReview API] Processing note:', {
      id: note.id,
      content: note.content,
      contentType: typeof note.content,
      titleType: typeof note.content.title,
      rawTitle: note.content.title,
      rawAuthors: note.content.authors
    });

    // Extract title properly based on OpenReview's API structure
    let title: string;
    if (typeof note.content.title === 'string') {
      title = note.content.title;
    } else if (typeof note.content.title === 'object' && note.content.title !== null) {
      // Handle the case where title is an object (might have a 'value' property)
      const titleObj = note.content.title as Record<string, unknown>;
      title = String(titleObj.value || titleObj.text || titleObj || 'Untitled');
    } else {
      title = 'Untitled';
    }

    // Extract authors properly
    let authors: string[] = [];
    if (Array.isArray(note.content.authors)) {
      authors = note.content.authors.map((author: unknown) => {
        if (typeof author === 'string') {
          return author;
        } else if (typeof author === 'object' && author !== null) {
          // Handle the case where author is an object
          const authorObj = author as Record<string, unknown>;
          return String(authorObj.value || authorObj.name || author);
        }
        return String(author);
      });
    }

    const metadata: PaperMetadata = {
      id: String(note.id),
      title,
      authors,
      source: 'openreview',
      url: `https://openreview.net/forum?id=${note.id}`,
      abstract: note.content.abstract ? String(note.content.abstract) : undefined,
      venue: note.content.venue ? String(note.content.venue) : note.invitation ? String(note.invitation) : undefined,
      year: note.cdate ? new Date(note.cdate * 1000).getFullYear() : undefined
    };

    console.log('[OpenReview API] Processed metadata:', {
      id: metadata.id,
      title: metadata.title,
      titleType: typeof metadata.title,
      authorCount: metadata.authors.length,
      hasAbstract: !!metadata.abstract,
      venue: metadata.venue
    });

    return {
      success: true,
      data: metadata
    };

  } catch (error) {
    console.error('[OpenReview API] Request failed:', {
      error,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      url: apiUrl
    });

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            type: APIErrorType.NETWORK_ERROR,
            message: 'OpenReview API request timed out'
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