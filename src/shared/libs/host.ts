// Typed wrappers of the host channels (docs/plugin-api.md → «Функції хоста»).
// A channel the plugin did not declare in `permissions` (or the user switched
// off) answers as a cancelled dialog / missing value / `false`.
import { DialogData, DialogFields } from '../types/index.ts';

const call = (method: Parameters<typeof sendMessage>[0], args: unknown) =>
  sendMessage(method, JSON.stringify(args));

/** Index of the picked row, or `null` (cancelled, quiet run, no `dialogs`). */
export async function chooseFromList(dialogData: DialogData): Promise<number | null> {
  const index = await call('showDialogData', { dialogData });
  return typeof index === 'number' && index >= 0 && index < dialogData.items.length
    ? index
    : null;
}

/** Values by `fieldKey`, or `null` when cancelled. */
export async function askFields(
  dialogFields: DialogFields
): Promise<Record<string, string> | null> {
  const values = await call('showDialogFields', { dialogFields });
  return values && typeof values === 'object' ? (values as Record<string, string>) : null;
}

/** Saved form values (`saveData`) by key; missing ones are `null`. */
export async function savedFields(keys: string[]): Promise<Record<string, string | null>> {
  const values = await call('getSavedData', { savedFields: keys });
  return values && typeof values === 'object'
    ? (values as Record<string, string | null>)
    : Object.fromEntries(keys.map((k) => [k, null]));
}

/**
 * Per-title data the plugin keeps (local, not synced, removed with the
 * plugin). Keys: 1..128 chars, no newline; value + label ≤ 8 KB; ≤ 2000 keys.
 * The user sees `label` (else the key) in the plugin's saved data.
 */
export const itemData = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await call('getItemData', { key });
    if (typeof raw !== 'string') return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async set(key: string, value: unknown, label?: string): Promise<boolean> {
    return (await call('setItemData', { key, value: JSON.stringify(value), label })) === true;
  },
  async remove(key: string): Promise<boolean> {
    return (await call('setItemData', { key, value: null })) === true;
  },
};

/** A readable `itemData` key for a title. */
export const titleKey = (mediaType: 'movie' | 'tv', tmdbId: number, slot = 'choice') =>
  `${mediaType}:${tmdbId}:${slot}`;

/** One line under the plugin's name; false when not shown (limit, no permission). */
export async function toast(text: string): Promise<boolean> {
  return (await call('showToast', { text })) === true;
}

/** «Signed in» flag for this app run. */
export const pluginInit = {
  set: () => call('setPluginInit', {}),
  get: async () => (await call('isPluginInit', {})) === true,
};
