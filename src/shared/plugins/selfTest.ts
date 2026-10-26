// selfTest — `testPlugin` that calls every host channel once and reports
// what came back (also the answers of channels the plugin may not use). Not
// started from the app's UI; run it with the app's plugin check tools.
import { fetchFlutter } from '../client/mainClient.ts';
import { itemData, pluginInit, savedFields, toast } from '../libs/host.ts';
import { expose, okResponse } from '../utils/utils.ts';

async function probe(name: string, fn: () => Promise<unknown>): Promise<[string, unknown]> {
  try {
    return [name, await fn()];
  } catch (e) {
    return [name, `error: ${e}`];
  }
}

async function runTest(): Promise<string> {
  const results = await Promise.all([
    probe('pluginRequest', async () => {
      const res = await fetchFlutter(
        'https://archive.org/metadata/Night.Of.The.Living.Dead_1080p/metadata/title'
      );
      return res.statusCode;
    }),
    probe('pluginRequest.blocked', async () => fetchFlutter('https://127.0.0.1/')),
    probe('itemData', async () => {
      const ok = await itemData.set('selftest:key', { at: 1 }, 'Self test');
      const back = await itemData.get<{ at: number }>('selftest:key');
      await itemData.remove('selftest:key');
      return { ok, back };
    }),
    probe('getSavedData', () => savedFields(['login'])),
    probe('showToast', () => toast('self test')),
    probe('pluginInit', async () => {
      await pluginInit.set();
      return pluginInit.get();
    }),
  ]);
  return okResponse(Object.fromEntries(results));
}

expose({ runTest });
