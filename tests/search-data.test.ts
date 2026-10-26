// searchDataGlobal: titles in order, then titles typed by hand, remembered per item.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import searchDataGlobal from '../src/shared/libs/search-data.ts';
import { PlayerData, SearchParams } from '../src/shared/types/index.ts';

/** Fake host: queued form answers, item data in memory. */
function fakeHost(forms: (Record<string, string> | null)[]) {
  const store = new Map<string, string>();
  const asked: string[] = [];
  (globalThis as unknown as { sendMessage: unknown }).sendMessage = async (
    method: string,
    payload: string
  ) => {
    const args = JSON.parse(payload);
    if (method === 'showDialogFields') {
      asked.push(args.dialogFields.items[0].value);
      return forms.shift() ?? null;
    }
    if (method === 'getItemData') return store.get(args.key) ?? null;
    if (method === 'setItemData') {
      store.set(args.key, args.value);
      return true;
    }
    return null;
  };
  return { store, asked };
}

const movie = (query: string, extra: Partial<SearchParams> = {}): SearchParams => ({
  query,
  isMovie: true,
  tmdbId: 603,
  mediaType: 'movie',
  autoSelectTitle: true,
  ...extra,
});

/** A site that knows only «The Matrix». */
const site = async (p: SearchParams) =>
  p.query === 'The Matrix' ? new PlayerData({ file: 'https://x/m.m3u8' }) : null;

const ok = (answer: string) => !JSON.parse(answer).isError;

test('a typed title is searched and remembered for the item', async () => {
  const host = fakeHost([{ query: 'Матриця 1999' }, { query: 'The Matrix' }]);
  const answer = await searchDataGlobal({ params: movie('Матриця'), fetchFunction: site });
  assert.ok(ok(answer));
  assert.deepEqual(host.asked, ['Матриця', 'Матриця 1999']);
  assert.equal(JSON.parse(host.store.get('movie:603:title')!), 'The Matrix');

  // Next run: the remembered title comes first, no form.
  const again = await searchDataGlobal({ params: movie('Матриця'), fetchFunction: site });
  assert.ok(ok(again));
  assert.equal(host.asked.length, 2);
});

test('cancelling the form ends with «нічого не знайдено»', async () => {
  const host = fakeHost([null]);
  const answer = await searchDataGlobal({ params: movie('Матриця'), fetchFunction: site });
  assert.match(JSON.parse(answer).result, /Нічого не знайдено: Матриця/);
  assert.equal(host.store.size, 0);
});

test('quiet runs and askTitle: false never show the form', async () => {
  const host = fakeHost([{ query: 'The Matrix' }]);
  await searchDataGlobal({ params: movie('Матриця', { quiet: true }), fetchFunction: site });
  await searchDataGlobal({ params: movie('Матриця'), fetchFunction: site, askTitle: false });
  assert.deepEqual(host.asked, []);
});
