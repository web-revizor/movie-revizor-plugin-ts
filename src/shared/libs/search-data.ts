import { FlutterResponse, PlayerData, SearchParams } from '../types/index.ts';
import { cancelledError, notFoundError } from '../utils/utils.ts';

interface ISearchDataGlobal {
  params: SearchParams;
  fetchFunction: (params: SearchParams) => Promise<IFetchFunctionPromise>;
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
  const dialogData = {
    title: 'Оберіть варіант пошуку',
    cancelText: 'Скасувати',
    items: titles.map((t) => ({ title: t })),
    // The app adds a "Більше не питати" switch and then sends
    // `autoSelectTitle` for this plugin.
    autoSelectTitleOption: true,
  };
  // eslint-disable-next-line no-undef
  const index = await sendMessage(
    'showDialogData',
    JSON.stringify({ dialogData })
  );
  return typeof index === 'number' && index >= 0 && index < titles.length
    ? index
    : null;
}

/**
 * Asks which title to search first (unless `autoSelectTitle` is set), runs
 * `fetchFunction` with it as `query`, then with each other title in order
 * until one returns a result or a message.
 */
export default async function searchDataGlobal({
  params,
  fetchFunction,
}: ISearchDataGlobal): Promise<string> {
  let titles = [params.query, ...(params.fallbackTitles || [])].filter(
    (t, i, arr) => t && t.trim() !== '' && arr.indexOf(t) === i
  );

  if (titles.length > 1 && !params.autoSelectTitle) {
    const chosen = await chooseTitle(titles);
    if (chosen === null) return cancelledError();
    titles = [titles[chosen], ...titles.filter((_, i) => i !== chosen)];
  }

  for (const title of titles) {
    const response = await fetchFunction({ ...params, query: title });

    if (!response) continue;

    if (typeof response === 'string') return notFoundError(response);

    if (isValidResult(response, params)) {
      return JSON.stringify(
        new FlutterResponse({
          result: JSON.stringify(response),
          isError: false,
        })
      );
    }
  }

  return notFoundError(`Нічого не знайдено: ${titles[0] ?? params.query}`);
}
