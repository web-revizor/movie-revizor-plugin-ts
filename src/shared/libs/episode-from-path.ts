// Season / episode numbers from a file path of a torrent, for `mapTorrentFiles`.
// The app itself never reads numbers from names: this helper belongs to the
// plugin, which decides whether it fits its source.

export interface EpisodeRef {
  season: number;
  episode: number;
}

const patterns: RegExp[] = [
  /\bs(\d{1,2})[ ._-]?e(\d{1,3})\b/i, // S01E02, s1.e2
  /\b(\d{1,2})x(\d{1,3})\b/i, // 1x02
  /сезон[ ._-]*(\d{1,2}).*?(?:серія|епізод|episode)[ ._-]*(\d{1,3})/i,
  /season[ ._-]*(\d{1,2}).*?(?:episode|ep)[ ._-]*(\d{1,3})/i,
];

const seasonFolder = /(?:^|\/)(?:season|сезон|s)[ ._-]*(\d{1,2})(?:\/|$)/i;
const episodeOnly = /(?:серія|епізод|episode|ep|e|chapter|глава)[ ._-]*(\d{1,3})\b/i;

/** `{season, episode}` from a path such as `Show/Season 2/Show.S02E05.mkv`, or null. */
export function episodeFromPath(path: string): EpisodeRef | null {
  const name = path.split('/').pop() ?? path;
  for (const re of patterns) {
    const m = name.match(re) ?? path.match(re);
    if (m) return { season: Number(m[1]), episode: Number(m[2]) };
  }
  const folder = path.match(seasonFolder);
  const ep = name.match(episodeOnly);
  if (folder && ep) return { season: Number(folder[1]), episode: Number(ep[1]) };
  return null;
}

const videoExtensions = ['.mkv', '.mp4', '.avi', '.m4v', '.mov', '.webm', '.ts'];
const subtitleExtensions = ['.srt', '.vtt', '.ass', '.ssa'];

export const isVideoPath = (path: string) =>
  videoExtensions.some((ext) => path.toLowerCase().endsWith(ext));

export const isSubtitlePath = (path: string) =>
  subtitleExtensions.some((ext) => path.toLowerCase().endsWith(ext));
