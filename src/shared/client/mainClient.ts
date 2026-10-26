import { HttpMethod } from '../types/index.ts';

export interface FlutterHttpResponse {
  statusCode: number;
  /** Body text; JSON bodies arrive already parsed (object / array). */
  data: unknown;
  headers: Record<string, string>;
}

/**
 * The request did not give a usable answer. `statusCode` is set for HTTP
 * errors (≥ 400); without it the host refused or failed the request (bad
 * URL, local address, permission `network` off, network error, status ≥ 500).
 */
export class PluginRequestError extends Error {
  constructor(
    message: string,
    readonly statusCode: number | null = null
  ) {
    super(message);
    this.name = 'PluginRequestError';
  }
}

export interface FetchOptions {
  method?: HttpMethod;
  /** Added to the host's defaults (`User-Agent: Mozilla/5.0` unless given). */
  headers?: Record<string, string>;
  /** Object (form-encoded with `Content-Type: application/x-www-form-urlencoded`) or string. */
  data?: unknown;
  /** Encoded by the host and appended to the URL. */
  queryParameters?: Record<string, string> | null;
  /** Up to 5 redirects, each checked like the request itself. Default true. */
  followRedirects?: boolean;
  /** Statuses ≥ 400 are returned instead of thrown (e.g. to read an error page). */
  allowErrorStatus?: boolean;
}

/**
 * HTTP through the host (`pluginRequest`): HTTPS only, public addresses
 * only, per-plugin cookies. Throws [PluginRequestError] when there is no
 * usable answer, so the message can reach the user.
 */
export async function fetchFlutter(
  url: string,
  {
    method = 'GET',
    headers = {},
    data = null,
    queryParameters = null,
    followRedirects = true,
    allowErrorStatus = false,
  }: FetchOptions = {}
): Promise<FlutterHttpResponse> {
  const raw = await sendMessage(
    'pluginRequest',
    JSON.stringify({ url, method, headers, data, queryParameters, followRedirects })
  );
  const parsed = (typeof raw === 'string' ? JSON.parse(raw) : raw) as
    | (Partial<FlutterHttpResponse> & { error?: string })
    | null;
  if (!parsed || parsed.error) throw new PluginRequestError(parsed?.error ?? 'no response');
  const statusCode = parsed.statusCode ?? 0;
  if (statusCode >= 400 && !allowErrorStatus) {
    throw new PluginRequestError(`HTTP ${statusCode}`, statusCode);
  }
  return { statusCode, data: parsed.data, headers: parsed.headers ?? {} };
}

/** The body as text (HTML pages); JSON bodies are serialized back. */
export async function fetchText(url: string, options: FetchOptions = {}): Promise<string> {
  const { data } = await fetchFlutter(url, options);
  if (typeof data === 'string') return data;
  return data == null ? '' : JSON.stringify(data);
}

/** The body as JSON. */
export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { data } = await fetchFlutter(url, options);
  return (typeof data === 'string' ? JSON.parse(data) : data) as T;
}
