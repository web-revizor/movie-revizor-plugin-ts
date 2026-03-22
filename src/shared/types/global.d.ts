export {};

type sendMessageMethod =
  | 'showDialogData'
  | 'pluginRequest'
  | 'showDialogFields'
  | 'getSavedData'
  | 'setPluginInit'
  | 'isPluginInit';

declare global {
  function sendMessage(
    method: sendMessageMethod,
    payload: string
  ): Promise<number | string | Record<string, never> | null | undefined>;
}
