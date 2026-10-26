export {};

/** Host channels; each takes `JSON.stringify(args)` and answers as listed in docs/plugin-api.md. */
type SendMessageMethod =
  | 'pluginRequest'
  | 'showDialogData'
  | 'showDialogFields'
  | 'getSavedData'
  | 'getItemData'
  | 'setItemData'
  | 'showToast'
  | 'setPluginInit'
  | 'isPluginInit';

declare global {
  // The answer's shape depends on the channel (docs/plugin-api.md); kept as
  // this union for plugins written against earlier versions of the SDK.
  function sendMessage(
    method: SendMessageMethod,
    payload: string
  ): Promise<number | string | boolean | Record<string, never> | null | undefined>;
}
