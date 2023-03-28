/**
 * Action holds the information about the handlers to be executed on the particular action
 *
 */
export class ActionHandler {
  /**
   *
   * @param {string} action
   * @param {(res: {data: any, sender: string, status: number, ok: boolean, isSource: boolean}) => void} handler
   * @param {bool} isAsync
   * @param {string} asyncId
   */
  constructor(action, handler, isAsync = false, asyncId) {
    this.action = action;
    this.handler = handler;
    this.isAsync = isAsync;
    this.asyncId = asyncId;
  }
}
