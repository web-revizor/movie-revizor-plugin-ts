import { ITraktIds, SearchParams } from '@/src/shared/types';
import searchDataGlobal, {
  IFetchFunctionPromise,
} from '@/src/shared/libs/search-data.ts';

async function fetchFunction(
  query: string,
  isSerial?: boolean,
  traktId?: number,
  traktIds?: ITraktIds
): Promise<IFetchFunctionPromise> {
  console.log(query);
  console.log(isSerial);
  console.log(traktId);
  console.log(traktIds);

  return null;
}

async function searchData(params: SearchParams): Promise<string> {
  return searchDataGlobal({ params, fetchFunction });
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
globalThis.searchData = searchData;
