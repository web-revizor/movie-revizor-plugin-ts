// demoDataList — `dataList` example: public domain films of the Internet
// Archive (only items whose licence is a public domain mark / dedication).
//
// Shows: rows with `fields` + `poster`, `link`, `torrentUrl` (archive.org
// serves its own torrent of every item), «Продовжити» (`resume` row +
// itemData), the «nothing found» form with an initial `value`,
// `onItemSelected`, and `mapTorrentFiles` (which video of a multi-file torrent
// to play, series by file names).
import {
  DataListItem,
  DataListParams,
  ItemSelectedParams,
  MapTorrentFilesParams,
  TorrentEpisode,
  TorrentPlaylist,
  TorrentSeason,
} from '../types/index.ts';
import { fetchJson } from '../client/mainClient.ts';
import { askFields, itemData, titleKey } from '../libs/host.ts';
import { episodeFromPath, isSubtitlePath, isVideoPath } from '../libs/episode-from-path.ts';
import { errorResponse, expose, okResponse } from '../utils/utils.ts';

interface Doc {
  identifier: string;
  title: string;
  year?: number;
  downloads?: number;
}

const keyOf = (p: { mediaType?: 'movie' | 'tv'; tmdbId?: number | null }) =>
  p.tmdbId && p.mediaType ? titleKey(p.mediaType, p.tmdbId, 'release') : null;

async function search(query: string): Promise<Doc[]> {
  const title = query.replace(/["\\]/g, ' ').trim();
  const res = await fetchJson<{ response: { docs: Doc[] } }>(
    'https://archive.org/advancedsearch.php',
    {
      queryParameters: {
        q: `title:("${title}") AND mediatype:movies AND licenseurl:*publicdomain*`,
        'fl[]': 'identifier,title,year,downloads',
        rows: '10',
        'sort[]': 'downloads desc',
        output: 'json',
      },
    }
  );
  return res.response.docs;
}

const row = (d: Doc, resume: boolean): DataListItem => ({
  title: d.year ? `${d.title} (${d.year})` : d.title,
  link: `https://archive.org/details/${d.identifier}`,
  torrentUrl: `https://archive.org/download/${d.identifier}/${d.identifier}_archive.torrent`,
  fields: {
    Рік: d.year ? String(d.year) : '—',
    Завантажень: String(d.downloads ?? 0),
    Ліцензія: 'Суспільне надбання',
    poster: `https://archive.org/services/img/${d.identifier}`,
  },
  ...(resume ? { resume: true } : {}),
});

async function getDataList(params: DataListParams): Promise<string> {
  try {
    let query = params.query;
    let docs = await search(query);
    if (docs.length === 0 && !params.quiet) {
      // Let the user fix the title, starting from the one just searched.
      const fixed = await askFields({
        title: 'Нічого не знайдено',
        applyText: 'Шукати',
        cancelText: 'Скасувати',
        items: [{ label: 'Назва', fieldKey: 'query', value: query }],
      });
      if (!fixed?.query) return errorResponse(`Нічого не знайдено: ${query}`);
      query = fixed.query;
      docs = await search(query);
    }
    if (docs.length === 0) return errorResponse(`Нічого не знайдено: ${query}`);
    const key = keyOf(params);
    const remembered =
      key && params.resume ? await itemData.get<{ identifier: string }>(key) : null;
    return okResponse(docs.map((d) => row(d, d.identifier === remembered?.identifier)));
  } catch (e) {
    return errorResponse(`Internet Archive недоступний: ${e}`);
  }
}

async function onItemSelected(params: ItemSelectedParams): Promise<void> {
  const key = keyOf(params);
  if (!key || params.selected.kind !== 'dataListItem') return;
  const id = params.selected.item.link?.split('/').pop();
  if (id) await itemData.set(key, { identifier: id }, `Реліз: ${params.selected.item.title}`);
}

/**
 * Series when the video files carry episode numbers, else one film: the
 * largest h.264 MP4 that is not the 512 kb preview (archive.org torrents hold
 * several encodings of the same film).
 */
function mapTorrentFiles(params: MapTorrentFilesParams): string {
  const videos = params.files.filter((f) => isVideoPath(f.path));
  const subtitles = params.files.filter((f) => isSubtitlePath(f.path));
  const numbered = videos
    .map((f) => ({ file: f, ref: episodeFromPath(f.path) }))
    .filter((x) => x.ref !== null);

  if (numbered.length > 1) {
    const seasons = new Map<number, TorrentEpisode[]>();
    for (const { file, ref } of numbered) {
      const list = seasons.get(ref!.season) ?? [];
      list.push({
        title: `Серія ${ref!.episode}`,
        number: ref!.episode,
        torrentFile: file.index,
      });
      seasons.set(ref!.season, list);
    }
    const list: TorrentSeason[] = [...seasons.entries()]
      .sort(([a], [b]) => a - b)
      .map(([number, episodes]) => ({
        title: `Сезон ${number}`,
        number,
        episodes: episodes.sort((a, b) => (a.number ?? 0) - (b.number ?? 0)),
      }));
    const playlist: TorrentPlaylist = { playerLangGroup: [{ title: 'Оригінал', seasons: list }] };
    return okResponse(playlist);
  }

  const mp4 = videos
    .filter((f) => f.path.toLowerCase().endsWith('.mp4') && !/512kb/i.test(f.path))
    .sort((a, b) => b.size - a.size);
  const film = mp4[0] ?? [...videos].sort((a, b) => b.size - a.size)[0];
  if (!film) return errorResponse('У торенті немає відео');
  const playlist: TorrentPlaylist = {
    torrentFile: film.index,
    subtitle: subtitles.map((s) => ({
      title: s.path.split('/').pop() ?? 'Субтитри',
      torrentFile: s.index,
      lang: null,
      format: s.path.toLowerCase().endsWith('.srt') ? 'srt' : null,
    })),
  };
  return okResponse(playlist);
}

expose({ getDataList, onItemSelected, mapTorrentFiles });
