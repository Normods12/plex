const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiError {
  status: number;
  name: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface FetchStrapiOptions extends RequestInit {
  /** Query string params, e.g. { populate: '*', 'filters[slug][$eq]': 'my-slug' } */
  params?: Record<string, string | number | boolean>;
}

/**
 * Typed fetch helper for the Strapi REST API.
 * Automatically attaches the API token and base URL.
 */
export async function fetchStrapi<T>(
  path: string,
  options: FetchStrapiOptions = {}
): Promise<StrapiResponse<T>> {
  const { params, ...fetchOptions } = options;

  // Build query string
  const queryString = params
    ? '?' + new URLSearchParams(
        Object.entries(params).reduce(
          (acc, [k, v]) => ({ ...acc, [k]: String(v) }),
          {} as Record<string, string>
        )
      ).toString()
    : '';

  const url = `${STRAPI_URL}/api${path}${queryString}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
    ...(fetchOptions.headers || {}),
  };

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    // Default to no-store for server components to always get fresh data
    cache: fetchOptions.cache ?? 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error: StrapiError = {
      status: response.status,
      name: errorBody?.error?.name || 'FetchError',
      message: errorBody?.error?.message || `HTTP ${response.status}`,
      details: errorBody?.error?.details,
    };
    throw error;
  }

  const json = await response.json();

  // Strapi 5 returns a flattened structure. The existing frontend code expects
  // the Strapi 4 nested "attributes" structure. This transformer restores that
  // structure to maintain compatibility without rewriting every component.
  if (json.data) {
    json.data = transformStrapi5To4(json.data);
  }

  return json as StrapiResponse<T>;
}

/**
 * Recursively transforms a Strapi 5 flattened object/array back into 
 * a Strapi 4 nested "attributes" structure.
 */
function transformStrapi5To4(data: any): any {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map(transformStrapi5To4);
  }

  if (typeof data === 'object') {
    // If it's already in V4 format or doesn't have an ID, just recurse on values
    if (data.attributes || !data.id) {
      const transformed: any = {};
      for (const key in data) {
        transformed[key] = transformStrapi5To4(data[key]);
      }
      return transformed;
    }

    // It's a Strapi 5 flattened object: { id, ...fields }
    const { id, documentId, ...fields } = data;
    const attributes: any = {};
    
    for (const key in fields) {
      attributes[key] = transformStrapi5To4(fields[key]);
    }

    return {
      id,
      documentId, // Keep documentId if present
      attributes,
    };
  }

  return data;
}


/**
 * Build a Strapi media URL from a relative path.
 */
export function getStrapiMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url}`;
}
