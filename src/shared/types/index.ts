export type HttpMethod = 'GET' | 'POST';

export interface SubtitleItem {
  title: string;
  url: string;
}

export type SubtitleResult = SubtitleItem[] | null;

export interface PlayerEpisodeParams {
  title?: string;
  file?: string;
  id?: number | string | null;
  poster?: string | null;
  subtitle?: SubtitleResult;
}

export interface PlayerSeasonParams {
  title?: string;
  episodes?: PlayerEpisode[];
}

export interface PlayerLangGroupParams {
  title?: string;
  seasons?: PlayerSeason[];
}

export interface PlayerDataParams {
  file?: string | null;
  subtitle?: SubtitleResult;
  poster?: string | null;
  playerLangGroup?: PlayerLangGroup[] | null;
  /** Optional pointer for a `resume` run; out of range = ignored. */
  start?: PlayerStart | null;
}

export interface FlutterResponseParams {
  result?: string;
  isError?: boolean;
}

export interface CardItem {
  title: string | null;
  href?: string | null;
  img?: string | null;
  rating?: number | null;
  year?: string | null;
  genre?: string | null;
}

export interface SearchParams {
  query: string;
  fallbackTitles?: string[];
  /** The user turned the title picker off for this plugin: search the titles in order without asking. */
  autoSelectTitle?: boolean;
  isSerial?: boolean;
  isPerson?: boolean;
  isMovie?: boolean;
  seasonNumber: number;
  episodeNumber: number;
  seriesTitle?: string;
  /** TMDB id of the title (the series on season / episode screens); absent in old app versions. */
  tmdbId?: number | null;
  mediaType?: 'movie' | 'tv';
  /** The run was not started by the user: no dialogs. */
  quiet?: boolean;
  /**
   * true = «Продовжити»: use what you remembered and ask nothing if you can;
   * false = a fresh choice: ignore it, ask again, remember the new answer;
   * absent = old app version.
   */
  resume?: boolean;
}

/** Where «Продовжити» should start: indexes into the returned `playerLangGroup`. */
export interface PlayerStart {
  langGroup: number;
  season: number;
  episode: number;
}

/** A `dataList` row. */
export interface DataListItem {
  title: string;
  link?: string | null;
  fields?: Record<string, string>;
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

export class PlayerEpisode {
  title: string;
  file: string;
  id: number | string | null;
  poster: string | null;
  subtitle: SubtitleResult;

  constructor({
    title = '',
    file = '',
    id = null,
    poster = null,
    subtitle = null,
  }: PlayerEpisodeParams) {
    this.title = title;
    this.file = file;
    this.id = id;
    this.poster = poster;
    this.subtitle = subtitle;
  }
}

export class PlayerSeason {
  title: string;
  episodes: PlayerEpisode[];

  constructor({ title = '', episodes = [] }: PlayerSeasonParams) {
    this.title = title;
    this.episodes = episodes;
  }
}

export class PlayerLangGroup {
  title: string;
  seasons: PlayerSeason[];

  constructor({ title = '', seasons = [] }: PlayerLangGroupParams) {
    this.title = title;
    this.seasons = seasons;
  }
}

export class PlayerData {
  file: string | null;
  subtitle: SubtitleResult;
  poster: string | null;
  playerLangGroup: PlayerLangGroup[] | null;
  start: PlayerStart | null;

  constructor({
    file = null,
    subtitle = null,
    poster = null,
    playerLangGroup = null,
    start = null,
  }: PlayerDataParams) {
    this.file = file;
    this.subtitle = subtitle;
    this.poster = poster;
    this.playerLangGroup = playerLangGroup;
    this.start = start;
  }
}

export class FlutterResponse {
  result: string;
  isError: boolean;

  constructor({ result = '', isError = false }: FlutterResponseParams) {
    this.result = result;
    this.isError = isError;
  }
}
