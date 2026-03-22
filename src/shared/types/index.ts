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
  isSerial: boolean;
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

  constructor({
    file = null,
    subtitle = null,
    poster = null,
    playerLangGroup = null,
  }: PlayerDataParams) {
    this.file = file;
    this.subtitle = subtitle;
    this.poster = poster;
    this.playerLangGroup = playerLangGroup;
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
