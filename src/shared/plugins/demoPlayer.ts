// demoPlayer — `playerData` example without network requests.
//
// Content: Blender Foundation open movies, licensed CC BY 3.0
// (© Blender Foundation, www.blender.org): Big Buck Bunny, Sintel, Tears of
// Steel. Streams and subtitles are the publicly hosted copies listed below.
//
// Shows: title picker (searchDataGlobal), choice list, «Продовжити»
// (`resume` + itemData + `start`), required season / episode `number`,
// subtitles with `lang` / `format`, `onItemSelected`, and `onDetailsOpened`
// + `showToast` that use only the plugin's own saved data.
import {
  DetailsOpenedParams,
  ItemSelectedParams,
  PlayerData,
  PlayerEpisode,
  PlayerLangGroup,
  PlayerSeason,
  SearchParams,
  SubtitleItem,
} from '../types/index.ts';
import searchDataGlobal, { IFetchFunctionPromise } from '../libs/search-data.ts';
import { chooseFromList, itemData, titleKey, toast } from '../libs/host.ts';
import { cancelledError, expose, okResponse } from '../utils/utils.ts';

interface Film {
  id: string;
  title: string;
  year: string;
  /** TMDB movie ids of the same films, so the demo answers on their pages. */
  tmdbId: number;
  file: string;
  subtitle: SubtitleItem[];
}

const blenderSubs = 'https://download.blender.org';

const films: Film[] = [
  {
    id: 'bbb',
    title: 'Big Buck Bunny',
    year: '2008',
    tmdbId: 10378,
    file: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    subtitle: [],
  },
  {
    id: 'sintel',
    title: 'Sintel',
    year: '2010',
    tmdbId: 45745,
    file: 'https://download.blender.org/demo/movies/Sintel.2010.1080p.mkv',
    subtitle: [
      { title: 'Українські', url: `${blenderSubs}/durian/subs/sintel_uk.srt`, lang: 'uk', format: 'srt' },
      { title: 'Français', url: `${blenderSubs}/durian/subs/sintel_fr.srt`, lang: 'fr', format: 'srt' },
    ],
  },
  {
    id: 'tos',
    title: 'Tears of Steel',
    year: '2012',
    tmdbId: 133701,
    file: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    subtitle: [
      { title: 'English', url: `${blenderSubs}/demo/movies/ToS/subtitles/TOS-en.srt`, lang: 'en', format: 'srt' },
      { title: 'Deutsch', url: `${blenderSubs}/demo/movies/ToS/subtitles/TOS-de.srt`, lang: 'de', format: 'srt' },
    ],
  },
];

const movieData = (film: Film) => new PlayerData({ file: film.file, subtitle: film.subtitle });

/**
 * A «series» made of the films, to show the voice → season → episode
 * structure: two groups, two seasons, numbered episodes.
 */
function demoSeries(start: PlayerData['start'] = null): PlayerData {
  const episode = (film: Film, number: number) =>
    new PlayerEpisode({
      title: `Серія ${number}: ${film.title}`,
      file: film.file,
      number,
      id: film.id,
      subtitle: film.subtitle,
    });
  const season = (number: number, list: Film[]) =>
    new PlayerSeason({
      title: `Сезон ${number}`,
      number,
      episodes: list.map((f, i) => episode(f, i + 1)),
    });
  return new PlayerData({
    playerLangGroup: [
      new PlayerLangGroup({
        title: 'Оригінал',
        seasons: [season(1, films), season(2, [films[2], films[0]])],
      }),
      new PlayerLangGroup({
        title: 'Оригінал, лише HLS',
        seasons: [season(1, [films[0], films[2]])],
      }),
    ],
    start,
  });
}

interface Remembered {
  filmId?: string;
  /** Last episode opened (`onItemSelected`), as indexes. */
  at?: { langGroup: number; season: number; episode: number };
}

const keyOf = (p: { mediaType?: 'movie' | 'tv'; tmdbId?: number | null }) =>
  p.tmdbId && p.mediaType ? titleKey(p.mediaType, p.tmdbId, 'demo') : null;

async function pickFilm(query: string): Promise<Film | null> {
  const index = await chooseFromList({
    title: `«${query}» немає в демо. Оберіть фільм`,
    cancelText: 'Скасувати',
    items: films.map((f) => ({ title: f.title, Рік: f.year, Ліцензія: 'CC BY 3.0' })),
  });
  return index === null ? null : films[index];
}

async function fetchFunction(params: SearchParams): Promise<IFetchFunctionPromise> {
  const key = keyOf(params);
  const saved = key ? await itemData.get<Remembered>(key) : null;

  if (params.isSerial) {
    // «Продовжити» opens where the user stopped; a fresh choice ignores it.
    return demoSeries(params.resume && saved?.at ? saved.at : null);
  }

  const byId = films.find((f) => f.tmdbId === params.tmdbId);
  if (byId) return movieData(byId);
  const remembered = params.resume ? films.find((f) => f.id === saved?.filmId) : undefined;
  if (remembered) return movieData(remembered);
  const byTitle = films.find((f) => params.query.toLowerCase().includes(f.title.toLowerCase()));
  // null: nothing for this title, searchDataGlobal tries the next one.
  return byTitle ? movieData(byTitle) : null;
}

async function searchData(params: SearchParams): Promise<string> {
  // Its own film picker replaces the typed-title form.
  const answer = await searchDataGlobal({ params, fetchFunction, askTitle: false });
  const found = !(JSON.parse(answer) as { isError: boolean }).isError;
  if (found || params.isSerial || params.quiet) return answer;
  // No title matched a demo film: let the user pick one and remember it.
  const film = await pickFilm(params.query);
  if (!film) return cancelledError();
  const key = keyOf(params);
  if (key) {
    const saved = (await itemData.get<Remembered>(key)) ?? {};
    await itemData.set(key, { ...saved, filmId: film.id }, `Демо: ${film.title}`);
  }
  return okResponse(movieData(film));
}

async function onItemSelected(params: ItemSelectedParams): Promise<void> {
  const key = keyOf(params);
  const s = params.selected;
  if (!key || s.kind !== 'playerData' || !s.langGroup || !s.season || !s.episode) return;
  const saved = (await itemData.get<Remembered>(key)) ?? {};
  await itemData.set(
    key,
    { ...saved, at: { langGroup: s.langGroup.index, season: s.season.index, episode: s.episode.index } },
    `Демо: ${s.season.title}, ${s.episode.title}`
  );
}

/** Background event: looks only at its own saved data, sends no request. */
async function onDetailsOpened(params: DetailsOpenedParams): Promise<void> {
  const key = keyOf(params);
  const saved = key ? await itemData.get<Remembered>(key) : null;
  if (!saved?.at) return;
  const episode = demoSeries().playerLangGroup?.[saved.at.langGroup]?.seasons[saved.at.season]
    ?.episodes[saved.at.episode];
  if (episode) await toast(`продовжите з «${episode.title}»`);
}

expose({ searchData, onItemSelected, onDetailsOpened });
