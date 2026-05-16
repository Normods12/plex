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
 * a Strapi 4 nested "attributes" structure for backward compatibility.
 *
 * Strapi 5 returns: { id: 1, name: "foo", relation: { id: 2, title: "bar" } }
 * Strapi 4 returns: { id: 1, attributes: { name: "foo", relation: { data: { id: 2, attributes: { title: "bar" } } } } }
 *
 * This transformer converts Strapi 5 → Strapi 4 shape so all existing
 * component code that reads `.attributes.*` continues to work.
 */
function transformStrapi5To4(data: any): any {
  if (data === null || data === undefined) return data;

  // Arrays: transform each element
  if (Array.isArray(data)) {
    return data.map(transformStrapi5To4);
  }

  if (typeof data === 'object') {
    // Already in V4 format (has .attributes) — recurse into values only
    if ('attributes' in data && data.attributes !== null && typeof data.attributes === 'object') {
      const result: any = { id: data.id };
      if (data.documentId !== undefined) result.documentId = data.documentId;
      result.attributes = {};
      for (const key in data.attributes) {
        result.attributes[key] = transformStrapi5To4(data.attributes[key]);
      }
      return result;
    }

    // Has an id — it's a Strapi 5 entity: lift fields into .attributes
    if ('id' in data) {
      const { id, documentId, ...fields } = data;
      const attributes: any = {};
      for (const key in fields) {
        const val = fields[key];
        // Nested relation: single object with id → wrap in { data: ... }
        // Nested relation: array of objects with id → wrap in { data: [...] }
        if (val !== null && typeof val === 'object' && !Array.isArray(val) && 'id' in val) {
          attributes[key] = { data: transformStrapi5To4(val) };
        } else if (Array.isArray(val) && val.length > 0 && val[0] !== null && typeof val[0] === 'object' && 'id' in val[0]) {
          attributes[key] = { data: val.map(transformStrapi5To4) };
        } else {
          attributes[key] = transformStrapi5To4(val);
        }
      }
      const result: any = { id };
      if (documentId !== undefined) result.documentId = documentId;
      result.attributes = attributes;
      return result;
    }

    // Plain object (no id) — recurse into values
    const result: any = {};
    for (const key in data) {
      result[key] = transformStrapi5To4(data[key]);
    }
    return result;
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
