// Season / episode numbers from a file path of a torrent, for `mapTorrentFiles`.
// The app itself never reads numbers from names: this helper belongs to the
// plugin, which decides whether it fits its source.

export interface EpisodeRef {
  season: number;
  episode: number;
}

/** Both numbers in one name: S01E02, s1.e2, 1x02, «Сезон 1 … Серія 2», «1 сезон 2 серія». */
const both: RegExp[] = [
  /(?:^|[^a-z0-9])s(\d{1,2})[ ._-]?e(\d{1,3})(?![0-9])/i,
  /(?:^|[^a-z0-9])(\d{1,2})x(\d{1,3})(?![0-9])/i,
  /(?:сезон|season)[ ._-]*(\d{1,2}).*?(?:серія|серия|епізод|episode|ep)[ ._-]*(\d{1,3})/i,
  /(\d{1,2})[ ._-]*(?:сезон|season).*?(\d{1,3})[ ._-]*(?:серія|серия|епізод|episode)/i,
];

/** A season in a folder name: «Season 2», «Сезон 2», «2 сезон», «Show.S02.1080p», «S2». */
const seasonIn: RegExp[] = [
  /(?:сезон|season)[ ._-]*(\d{1,2})(?![0-9])/i,
  /(\d{1,2})[ ._-]*(?:сезон|season)/i,
  /(?:^|[^a-z0-9])s(\d{1,2})(?![0-9e])/i,
];

/** An episode in a file name: «Серія 5», «05 серія», «Episode 5», «E05», «ep5». */
const episodeIn: RegExp[] = [
  /(?:серія|серия|епізод|episode|chapter|глава)[ ._-]*(\d{1,3})(?![0-9])/i,
  /(\d{1,3})[ ._-]*(?:серія|серия|епізод|episode)/i,
  /(?:^|[^a-z0-9])e(?:p)?[ ._-]?(\d{1,3})(?![0-9])/i,
];

/** «01.mkv», «01. Назва.mkv», «01 - Назва.mkv»: the number the name starts with. */
const leadingNumber = /^(\d{1,3})(?![0-9])(?:[ ._-]|$)/;

/** «Шоу - 07», «Шоу.07»: the number the name ends with. */
const trailingNumber = /[ ._-](\d{1,3})$/;

const firstNumber = (text: string, res: RegExp[]) => {
  for (const re of res) {
    const m = text.match(re);
    if (m) return Number(m[1]);
  }
  return null;
};

const stem = (name: string) => name.replace(/\.[a-z0-9]{2,4}$/i, '');

/**
 * `{season, episode}` from a path such as `Show/Season 2/Show.S02E05.mkv`,
 * `Show.S02.1080p/05.mkv` or `Шоу/2 сезон/Серія 05.mkv`; null when the path
 * does not tell both. A bare leading or trailing number counts only inside a
 * folder that names the season.
 */
export function episodeFromPath(path: string): EpisodeRef | null {
  const parts = path.split('/');
  const name = stem(parts.pop() ?? path);
  for (const re of both) {
    const m = name.match(re) ?? path.match(re);
    if (m) return { season: Number(m[1]), episode: Number(m[2]) };
  }
  // The deepest folder that names a season.
  let season: number | null = null;
  for (let i = parts.length - 1; i >= 0 && season === null; i--) {
    season = firstNumber(parts[i], seasonIn);
  }
  const episode =
    firstNumber(name, episodeIn) ??
    (season !== null
      ? (name.match(leadingNumber)?.[1] ?? name.match(trailingNumber)?.[1] ?? null)
      : null);
  if (season === null || episode === null) return null;
  return { season, episode: Number(episode) };
}

const videoExtensions = ['.mkv', '.mp4', '.avi', '.m4v', '.mov', '.webm', '.ts'];
const subtitleExtensions = ['.srt', '.vtt', '.ass', '.ssa'];

export const isVideoPath = (path: string) =>
  videoExtensions.some((ext) => path.toLowerCase().endsWith(ext));

export const isSubtitlePath = (path: string) =>
  subtitleExtensions.some((ext) => path.toLowerCase().endsWith(ext));
