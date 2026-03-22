import { FlutterResponse } from '@/src/shared/types';

export const cancelledError = () =>
  JSON.stringify(
    new FlutterResponse({
      result: `Скасовано користувачем`,
      isError: true,
    })
  );
export const notFoundError = (query: string) =>
  JSON.stringify(
    new FlutterResponse({
      result: `${query}`,
      isError: true,
    })
  );

export function serializeFormData(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
    .join('&');
}
