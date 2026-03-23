import { FlutterResponse, ITraktIds } from '@/src/shared/types';
import { notFoundError } from '@/src/shared/utils/utils.ts';
import { fetchFlutter } from '@/src/shared/client/mainClient.ts';

interface IGetDataList {
  query: string;
  isSerial?: boolean;
  traktId?: number;
  traktIds?: ITraktIds;
}

async function getDataList({
  query,
  isSerial,
  traktIds,
  traktId,
}: IGetDataList) {
  console.log(query);
  console.log(isSerial);
  console.log(traktId);
  console.log(traktIds);

  const rootUrl = 'https://example.com';

  const searchResponse = await fetchFlutter(
    `${rootUrl}/?query=${encodeURIComponent(query)}&is_serial=${isSerial}`
  );

  if (!searchResponse) return null;

  const items: {
    title: string;
    link?: string;
    fields?: {
      size?: string;
      status?: string;
    };
  }[] = [];

  items.push({ title: 'test 1' }, { title: 'test 1' });

  if (items.length > 0) {
    const stringItems = JSON.stringify(items);
    return JSON.stringify(
      new FlutterResponse({
        result: stringItems,
        isError: false,
      })
    );
  } else {
    return notFoundError(`Нічого не знайдено: ${query}`);
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
globalThis.getDataList = getDataList;
