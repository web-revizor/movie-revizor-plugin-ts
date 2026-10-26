import { FlutterResponse, PlayerData, SearchParams } from '../types/index.ts';
import { cancelledError, notFoundError } from '../utils/utils.ts';
import { askFields, chooseFromList, itemData, titleKey } from './host.ts';

interface ISearchDataGlobal {
  params: SearchParams;
  fetchFunction: (params: SearchParams) => Promise<IFetchFunctionPromise>;
  /**
   * When no title finds anything (and the run is not quiet), ask for a title
   * typed by hand, prefilled with the first one; the title that worked is
   * remembered for the item (`itemData`) and tried first next time.
   * Default true.
   */
  askTitle?: boolean;
}

/**
 * - `PlayerData`: the result;
 * - `null`: nothing found for this `query`, the next title is tried;
 * - `string`: stop with this message (cancelled, or a failure after the user
 *   already chose something).
 */
export type IFetchFunctionPromise = PlayerData | null | string;

function isValidResult(playerData: PlayerData, params: SearchParams): boolean {
  return params.isSerial
    ? !!playerData.playerLangGroup && playerData.playerLangGroup.length > 0
    : !!playerData.file && playerData.file.trim() !== '';
}

/** Index of the title the user picked, or null when cancelled. */
async function chooseTitle(titles: string[]): Promise<number | null> {
  return chooseFromList({
    title: 'Оберіть варіант пошуку',
    cancelText: 'Скасувати',
    items: titles.map((t) => ({ title: t })),
    // The app adds a "Більше не питати" switch and then sends
    // `autoSelectTitle` for this plugin.
    autoSelectTitleOption: true,
  });
}

/** A title typed by hand, or null when cancelled / empty / quiet run. */
async function typeTitle(previous: string): Promise<string | null> {
  const values = await askFields({
    title: 'Нічого не знайдено',
    applyText: 'Шукати',
    cancelText: 'Скасувати',
    items: [{ label: 'Назва', fieldKey: 'query', value: previous }],
  });
  const typed = values?.query?.trim();
  return typed ? typed : null;
}

/** itemData key of the title typed by hand for this item, or null. */
const typedTitleKey = (params: SearchParams) =>
  params.tmdbId && params.mediaType ? titleKey(params.mediaType, params.tmdbId, 'title') : null;

/**
 * Asks which title to search first (unless `autoSelectTitle` is set), runs
 * `fetchFunction` with it as `query`, then with each other title in order
 * until one returns a result or a message; then (see `askTitle`) with titles
 * typed by hand until one works or the user cancels.
 */
export default async function searchDataGlobal({
  params,
  fetchFunction,
  askTitle = true,
}: ISearchDataGlobal): Promise<string> {
  let titles = [params.query, ...(params.fallbackTitles || [])].filter(
    (t, i, arr) => t && t.trim() !== '' && arr.indexOf(t) === i
  );

  const key = askTitle ? typedTitleKey(params) : null;
  const remembered = key ? await itemData.get<string>(key) : null;
  if (remembered) {
    // A title the user typed before for this item: tried first, no picker.
    titles = [remembered, ...titles.filter((t) => t !== remembered)];
  } else if (titles.length > 1 && !params.autoSelectTitle && !params.quiet) {
    const chosen = await chooseTitle(titles);
    if (chosen === null) return cancelledError();
    titles = [titles[chosen], ...titles.filter((_, i) => i !== chosen)];
  }

  const found = (data: PlayerData) =>
    JSON.stringify(new FlutterResponse({ result: JSON.stringify(data), isError: false }));

  for (const title of titles) {
    const response = await fetchFunction({ ...params, query: title });
    if (!response) continue;
    if (typeof response === 'string') return notFoundError(response);
    if (isValidResult(response, params)) return found(response);
  }

  if (askTitle && !params.quiet) {
    let previous = titles[0] ?? params.query;
    for (;;) {
      const typed = await typeTitle(previous);
      if (typed === null) break;
      previous = typed;
      const response = await fetchFunction({ ...params, query: typed });
      if (typeof response === 'string') return notFoundError(response);
      if (response && isValidResult(response, params)) {
        if (key) await itemData.set(key, typed, `Назва для пошуку: ${typed}`);
        return found(response);
      }
    }
  }

  return notFoundError(`Нічого не знайдено: ${titles[0] ?? params.query}`);
}
