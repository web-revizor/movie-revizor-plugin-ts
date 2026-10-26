export type HttpMethod = 'GET' | 'POST';

/** Permission ids a plugin declares in its repository entry (`permissions`). */
export type PluginPermission =
  | 'network'
  | 'network.background'
  | 'itemData'
  | 'savedFields'
  | 'dialogs'
  | 'toast'
  | 'toast.background'
  | 'torrent'
  | 'event.detailsOpened';

/** One plugin of a repository JSON (`plugins[]`). */
export interface RepositoryPlugin {
  title: string;
  description: string;
  shortDescription?: string;
  version: string;
  src: string;
  type?: 'playerData' | 'dataList' | 'testPlugin';
  supported_types: ('movie' | 'show' | 'person')[];
  pluginSettingsKey?: string;
  sha256?: string;
  permissions?: PluginPermission[];
}

export type SubtitleFormat = 'srt' | 'vtt' | 'ass' | 'ttml';

export interface SubtitleItem {
  title: string;
  url: string;
  /** BCP 47 language code (`uk`, `en`, …); `null` when unknown. */
  lang: string | null;
  /** `null` = WebVTT. The app does not guess it from the URL. */
  format: SubtitleFormat | null;
}

export type SubtitleResult = SubtitleItem[] | null;

export class PlayerEpisode {
  title: string;
  file: string;
  /** The episode's own number; `null` for specials and merged «1-2». */
  number: number | null;
  id: string | null;
  poster: string | null;
  subtitle: SubtitleResult;

  constructor(e: {
    title: string;
    file: string;
    number: number | null;
    id?: string | null;
    poster?: string | null;
    subtitle?: SubtitleResult;
  }) {
    this.title = e.title;
    this.file = e.file;
    this.number = e.number;
    this.id = e.id ?? null;
    this.poster = e.poster ?? null;
    this.subtitle = e.subtitle ?? null;
  }
}

export class PlayerSeason {
  title: string;
  /** The season's own number; `null` for a season without one (specials). */
  number: number | null;
  episodes: PlayerEpisode[];

  constructor(s: { title: string; number: number | null; episodes: PlayerEpisode[] }) {
    this.title = s.title;
    this.number = s.number;
    this.episodes = s.episodes;
  }
}

export class PlayerLangGroup {
  title: string;
  seasons: PlayerSeason[];

  constructor(g: { title: string; seasons: PlayerSeason[] }) {
    this.title = g.title;
    this.seasons = g.seasons;
  }
}

/** Where «Продовжити» should start: indexes into the returned `playerLangGroup`. */
export interface PlayerStart {
  langGroup: number;
  season: number;
  episode: number;
}

export class PlayerData {
  file: string | null;
  subtitle: SubtitleResult;
  poster: string | null;
  playerLangGroup: PlayerLangGroup[] | null;
  /** Optional pointer for a `resume` run; out of range = ignored. */
  start: PlayerStart | null;

  constructor(d: {
    file?: string | null;
    subtitle?: SubtitleResult;
    poster?: string | null;
    playerLangGroup?: PlayerLangGroup[] | null;
    start?: PlayerStart | null;
  }) {
    this.file = d.file ?? null;
    this.subtitle = d.subtitle ?? null;
    this.poster = d.poster ?? null;
    this.playerLangGroup = d.playerLangGroup ?? null;
    this.start = d.start ?? null;
  }
}

export class FlutterResponse {
  result: string;
  isError: boolean;

  constructor({ result = '', isError = false }: { result?: string; isError?: boolean }) {
    this.result = result;
    this.isError = isError;
  }
}

/** Params of every run started from a details screen. */
export interface RunParams {
  query: string;
  isSerial?: boolean;
  isMovie?: boolean;
  isPerson?: boolean;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  /** Series title on season / episode screens; `query` is then «<series> <season/episode>». */
  seriesTitle?: string | null;
  /** TMDB id of the title (the series on season / episode screens). */
  tmdbId?: number | null;
  mediaType?: 'movie' | 'tv';
  /** The run was not started by the user: dialogs answer `null` at once. */
  quiet?: boolean;
  /**
   * true = «Продовжити»: use what you remembered and ask nothing if you can;
   * false = a fresh choice: ignore it, ask again, remember the new answer;
   * absent = old app version.
   */
  resume?: boolean;
}

/** `searchData(params)` of a `playerData` plugin. */
export interface SearchParams extends RunParams {
  fallbackTitles?: string[];
  /** The user turned the title picker off for this plugin: search the titles in order without asking. */
  autoSelectTitle?: boolean;
}

/** `getDataList(params)` of a `dataList` plugin. */
export interface DataListParams extends RunParams {
  /** TMDB id of the series (null for movies). */
  serialID?: number | null;
}

/** A `dataList` row. */
export interface DataListItem {
  title: string;
  link?: string | null;
  /** Shown as «key: value» (up to 4); `poster` (https image URL) is shown as a picture. */
  fields?: Record<string, string>;
  /** HTTPS `.torrent` file; needs the `torrent` permission. */
  torrentUrl?: string;
  /** In a `resume` run: the app plays this row at once (its `torrentUrl`, else `link`). */
  resume?: boolean;
}

/** Params of the optional `onItemSelected` entry point. */
export interface ItemSelectedParams {
  tmdbId?: number | null;
  mediaType?: 'movie' | 'tv';
  isSerial?: boolean;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  selected:
    | { kind: 'dataListItem'; item: DataListItem }
    | {
        kind: 'playerData';
        langGroup: { title: string; index: number } | null;
        season: { title: string; index: number } | null;
        episode: { title: string; index: number } | null;
      };
}

/** Params of the optional `onDetailsOpened` entry point (`event.detailsOpened`). */
export interface DetailsOpenedParams {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  isSerial: boolean;
  seasonNumber: number | null;
  episodeNumber: number | null;
  quiet: true;
}

/** One file of a torrent, as `mapTorrentFiles` gets it. */
export interface TorrentFileInfo {
  index: number;
  path: string;
  size: number;
}

/** Params of the optional `mapTorrentFiles` entry point of a `dataList` plugin. */
export interface MapTorrentFilesParams {
  files: TorrentFileInfo[];
  tmdbId: number | null;
  mediaType: 'movie' | 'tv';
  isSerial: boolean;
  seasonNumber: number | null;
  episodeNumber: number | null;
  /** The `dataList` row that was played, as the plugin returned it. */
  item: DataListItem | null;
  quiet: true;
}

/** A subtitle inside the torrent (`torrentFile`) or at a URL. */
export type TorrentSubtitle = Omit<SubtitleItem, 'url'> &
  ({ url: string } | { torrentFile: number });

export interface TorrentEpisode {
  title: string;
  number: number | null;
  torrentFile: number;
  subtitle?: TorrentSubtitle[] | null;
}

export interface TorrentSeason {
  title: string;
  number: number | null;
  episodes: TorrentEpisode[];
}

/** `mapTorrentFiles` answer: a playlist of torrent files, or one file (movie). */
export type TorrentPlaylist =
  | {
      playerLangGroup: { title: string; seasons: TorrentSeason[] }[];
      start?: PlayerStart | null;
    }
  | { torrentFile: number; subtitle?: TorrentSubtitle[] | null };

/** A row of a `showDialogData` list: `title`, optional `poster`, other keys shown as «key: value». */
export interface DialogDataItem {
  title: string;
  poster?: string;
  [field: string]: string | undefined;
}

export interface DialogData {
  title: string;
  cancelText?: string;
  items: DialogDataItem[];
  /** Adds the «Більше не питати» switch (title picker of `searchDataGlobal`). */
  autoSelectTitleOption?: boolean;
}

export interface DialogField {
  label: string;
  fieldKey: string;
  obscureText?: boolean;
  /** Text the field opens with; a saved value (`saveData`) wins. */
  value?: string;
}

export interface DialogFields {
  title: string;
  applyText?: string;
  cancelText?: string;
  /** Keep the values in secure storage (needs `pluginSettingsKey` and `savedFields`). */
  saveData?: boolean;
  items: DialogField[];
}

/** A search result card (used by plugins that parse site search pages). */
export interface CardItem {
  title: string | null;
  href?: string | null;
  img?: string | null;
  rating?: number | null;
  year?: string | null;
  genre?: string | null;
}
