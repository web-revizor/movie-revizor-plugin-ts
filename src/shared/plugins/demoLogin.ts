// demoLogin — sign-in flow without a real site: `showDialogFields` with
// `saveData` (needs `pluginSettingsKey` + `savedFields`), `getSavedData`,
// `setPluginInit` / `isPluginInit`. The «account» is checked locally: any
// login with the password `demo`. After signing in it plays Big Buck Bunny
// (CC BY 3.0, © Blender Foundation).
import { PlayerData, SearchParams } from '../types/index.ts';
import { askFields, pluginInit, savedFields, toast } from '../libs/host.ts';
import { cancelledError, errorResponse, expose, okResponse } from '../utils/utils.ts';

const film = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

const valid = (login?: string | null, password?: string | null) =>
  !!login?.trim() && password === 'demo';

async function signIn(quiet: boolean | undefined): Promise<boolean | 'cancelled'> {
  if (await pluginInit.get()) return true;
  // Saved values first: no form when they still work.
  const saved = await savedFields(['login', 'password']);
  if (valid(saved.login, saved.password)) {
    await pluginInit.set();
    return true;
  }
  if (quiet) return false;
  const values = await askFields({
    title: 'Вхід (демо: будь-який логін, пароль demo)',
    applyText: 'Увійти',
    cancelText: 'Скасувати',
    saveData: true,
    items: [
      { label: 'Логін', fieldKey: 'login', value: saved.login ?? '' },
      { label: 'Пароль', fieldKey: 'password', obscureText: true },
    ],
  });
  if (!values) return 'cancelled';
  if (!valid(values.login, values.password)) return false;
  await pluginInit.set();
  await toast(`вхід як ${values.login.trim()}`);
  return true;
}

async function searchData(params: SearchParams): Promise<string> {
  const signedIn = await signIn(params.quiet);
  if (signedIn === 'cancelled') return cancelledError();
  if (!signedIn) return errorResponse('Невірний логін або пароль');
  return okResponse(new PlayerData({ file: film }));
}

expose({ searchData });
