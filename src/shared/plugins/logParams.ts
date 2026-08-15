import { SearchParams } from '@/src/shared/types';
import searchDataGlobal, {
  IFetchFunctionPromise,
} from '@/src/shared/libs/search-data.ts';

async function fetchFunction(
  props: SearchParams
): Promise<IFetchFunctionPromise> {
  console.log(props);

  return null;
}

async function searchData(params: SearchParams): Promise<string> {
  return searchDataGlobal({ params, fetchFunction });
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
globalThis.searchData = searchData;
