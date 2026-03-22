import { FlutterResponse, PlayerData, SearchParams } from '@/src/shared/types';
import { cancelledError, notFoundError } from '@/src/shared/utils/utils.ts';

interface ISearchDataGlobal {
  params: SearchParams;
  fetchFunction: (
    query: string,
    isSerial: boolean
  ) => Promise<IFetchFunctionPromise>;
}

export type IFetchFunctionPromise = PlayerData | null | string;

export default async function searchDataGlobal({
  params,
  fetchFunction,
}: ISearchDataGlobal): Promise<string> {
  const allTitles = [params.query, ...(params.fallbackTitles || [])].filter(
    (t, i, arr) => t && t.trim() !== '' && arr.indexOf(t) === i
  );

  let selectedTitleIndex = 0;

  if (allTitles.length > 1) {
    const titleDialogData = {
      title: 'Оберіть варіант пошуку',
      cancelText: 'Скасувати',
      items: allTitles.map((t) => ({ title: t })),
    };

    // eslint-disable-next-line no-undef
    const chosenIndex = await sendMessage(
      'showDialogData',
      JSON.stringify({ dialogData: titleDialogData })
    );

    if (
      chosenIndex === null ||
      chosenIndex === undefined ||
      typeof chosenIndex !== 'number'
    ) {
      return cancelledError();
    }

    selectedTitleIndex = chosenIndex;
  }

  const title = allTitles[selectedTitleIndex];

  const response = await fetchFunction(title, params.isSerial);

  if (!response) return notFoundError(`Нічого не знайдено: ${title}`);

  if (typeof response === 'string') {
    return notFoundError(response);
  }

  const playerData = response;
  const isValid = params.isSerial
    ? playerData.playerLangGroup && playerData.playerLangGroup.length > 0
    : playerData.file && playerData.file.trim() !== '';

  if (isValid) {
    return JSON.stringify(
      new FlutterResponse({
        result: JSON.stringify(playerData),
        isError: false,
      })
    );
  }

  return notFoundError(params.query ?? '');
}
