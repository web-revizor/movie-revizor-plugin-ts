import { FlutterResponse } from '../types/index.ts';

/** An entry point's answer: `data` serialized into `result` (the host parses it twice). */
export const okResponse = (data: unknown) =>
  JSON.stringify(new FlutterResponse({ result: JSON.stringify(data), isError: false }));

/** An error / message the app shows (for `playerData` as a toast). */
export const errorResponse = (message: string) =>
  JSON.stringify(new FlutterResponse({ result: message, isError: true }));

export const cancelledError = () => errorResponse('Скасовано користувачем');

export const notFoundError = (message: string) => errorResponse(message);

export function serializeFormData(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
    .join('&');
}

/** Makes [fns] the script's global entry points (the host calls them by name). */
export function expose(fns: Record<string, (params: never) => unknown>): void {
  Object.assign(globalThis, fns);
}
