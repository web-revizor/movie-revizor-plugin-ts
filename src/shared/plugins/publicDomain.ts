// publicDomain — `playerData` example with real requests (`pluginRequest`).
//
// Finds the film by its TMDB id in Wikidata (P4947 «TMDB movie ID») and plays
// its video from Wikimedia Commons (P10) or the Internet Archive (P724). Only
// items Wikidata marks as public domain (P6216 copyright status = Q19652) are
// played; anything else answers «not found». No title search, no key.
import { PlayerData, SearchParams } from '../types/index.ts';
import { fetchJson, PluginRequestError } from '../client/mainClient.ts';
import { errorResponse, expose, okResponse } from '../utils/utils.ts';

const userAgent =
  'MovieRevizorPluginExample/1.0 (https://github.com/web-revizor/movie-revizor-plugin-ts)';
const publicDomain = 'http://www.wikidata.org/entity/Q19652';

interface Binding {
  video?: { value: string };
  ia?: { value: string };
  status?: { value: string };
}

async function wikidata(tmdbId: number): Promise<Binding[]> {
  const query = `SELECT ?video ?ia ?status WHERE {
    ?item wdt:P4947 "${tmdbId}".
    OPTIONAL { ?item wdt:P10 ?video }
    OPTIONAL { ?item wdt:P724 ?ia }
    OPTIONAL { ?item wdt:P6216 ?status }
  }`;
  const res = await fetchJson<{ results: { bindings: Binding[] } }>(
    'https://query.wikidata.org/sparql',
    {
      headers: { Accept: 'application/sparql-results+json', 'User-Agent': userAgent },
      queryParameters: { query, format: 'json' },
    }
  );
  return res.results.bindings;
}

/** An MP4 of the archive.org item (h.264, not the 512 kb preview), or null. */
async function archiveVideo(id: string): Promise<string | null> {
  const meta = await fetchJson<{ files?: { name: string; format?: string; size?: string }[] }>(
    `https://archive.org/metadata/${encodeURIComponent(id)}`,
    { headers: { 'User-Agent': userAgent } }
  );
  const mp4 = (meta.files ?? [])
    .filter((f) => f.name.toLowerCase().endsWith('.mp4') && !/512kb/i.test(f.name))
    .sort((a, b) => Number(a.size ?? 0) - Number(b.size ?? 0));
  const file = mp4[mp4.length - 1];
  return file
    ? `https://archive.org/download/${encodeURIComponent(id)}/${encodeURIComponent(file.name)}`
    : null;
}

async function searchData(params: SearchParams): Promise<string> {
  if (params.isSerial || !params.tmdbId) {
    return errorResponse('Цей приклад шукає лише фільми за TMDB id');
  }
  try {
    const rows = await wikidata(params.tmdbId);
    if (!rows.some((r) => r.status?.value === publicDomain)) {
      return errorResponse('Фільм не позначено у Wikidata як суспільне надбання');
    }
    const commons = rows
      .map((r) => r.video?.value)
      .find((v): v is string => !!v && !/trailer|трейлер/i.test(decodeURIComponent(v)));
    const ia = rows.map((r) => r.ia?.value).find((v): v is string => !!v);
    const file =
      commons?.replace(/^http:/, 'https:') ?? (ia ? await archiveVideo(ia) : null);
    if (!file) return errorResponse('Для фільму немає відео у Commons чи Internet Archive');
    return okResponse(new PlayerData({ file }));
  } catch (e) {
    return errorResponse(
      e instanceof PluginRequestError ? `Wikidata недоступна: ${e.message}` : String(e)
    );
  }
}

expose({ searchData });
