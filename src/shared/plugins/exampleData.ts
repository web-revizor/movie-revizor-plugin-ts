import { FlutterResponse } from '../types/index.ts';
import { notFoundError } from '../utils/utils.ts';
import { fetchFlutter } from '../client/mainClient.ts';

interface IGetDataList {
  query: string;
  isSerial?: boolean;
}

async function getDataList({ query, isSerial }: IGetDataList) {
  console.log(query);
  console.log(isSerial);

  const rootUrl = 'https://example.com';

  const searchResponse = await fetchFlutter(
    `${rootUrl}/?query=${encodeURIComponent(query)}&is_serial=${isSerial}`
  );

  if (!searchResponse) return null;

  const items: {
    title: string;
    link: string;
    fields?: {
      size?: string;
      status?: string;
    };
  }[] = [];

  items.push({ title: 'test 1', link: '' }, { title: 'test 1', link: '' });

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
