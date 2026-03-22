import { HttpMethod } from '@/src/shared/types';

export async function fetchFlutter(
  url: string,
  method: HttpMethod = 'GET',
  extraHeaders: Record<string, string> = {},
  data: unknown = null,
  followRedirects: boolean = false
) {
  const isDebug = false;

  const config = {
    url: url,
    method: method,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0',
      ...extraHeaders,
    },
    data: data,
    followRedirects: followRedirects,
  };
  if (isDebug) console.log('config', config);

  // eslint-disable-next-line no-undef
  const secondResponseString = await sendMessage(
    'pluginRequest',
    JSON.stringify(config)
  );

  if (isDebug) console.log('secondResponseString', secondResponseString);
  if (!secondResponseString || typeof secondResponseString !== 'string')
    return null;

  const parsed = JSON.parse(secondResponseString);
  if (isDebug) console.log('parsed', parsed);
  return {
    data: parsed.data as string,
    headers: parsed.headers as Record<string, string>,
  };
}
