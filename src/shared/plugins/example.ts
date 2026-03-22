import { CardItem, PlayerData, SearchParams } from '@/src/shared/types';
import searchDataGlobal, {
  IFetchFunctionPromise,
} from '@/src/shared/libs/search-data.ts';
import { fetchFlutter } from '@/src/shared/client/mainClient.ts';

async function fetchFunction(
  query: string,
  isSerial: boolean
): Promise<IFetchFunctionPromise> {
  const rootUrl = 'https://example.com';

  const searchResponse = await fetchFlutter(
    `${rootUrl}/?query=${encodeURIComponent(query)}&is_serial=${isSerial}`
  );

  if (!searchResponse) return null;
  // const dataString = searchResponse.data;
  // const cards: CardItem[] | null = JSON.parse(dataString);

  const cards: CardItem[] = [
    {
      title: 'example title 1',
      href: '',
      rating: 5,
      year: '2026',
    },
    {
      title: 'example title 2',
      href: '',
      rating: 10,
      year: '2026',
    },
  ];

  if (!cards || cards.length === 0) return null;

  let href: string | null | undefined;

  if (cards.length > 1) {
    const dialogData = {
      title: `Уточніть пошук для "${query}"`,
      cancelText: 'Скасувати',
      items: cards.map((c) => ({
        title: c.title,
      })),
    };

    // eslint-disable-next-line no-undef
    const index = await sendMessage(
      'showDialogData',
      JSON.stringify({ dialogData: dialogData })
    );
    if (index === null || index === undefined || typeof index !== 'number') {
      return 'Скасовано користувачем';
    }

    href = cards[index].href;
  } else {
    href = cards[0].href;
  }

  if (!href || !href.trim()) return null;

  const secondResponse = await fetchFlutter(href);

  if (!secondResponse) return null;

  const playerDataString = searchResponse.data;

  const playerData: PlayerData | null = JSON.parse(playerDataString);

  return playerData;
}

async function searchData(params: SearchParams): Promise<string> {
  return searchDataGlobal({ params, fetchFunction });
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
globalThis.searchData = searchData;
