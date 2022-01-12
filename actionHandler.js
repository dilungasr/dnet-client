// Action holds the information about the handlers to be executed on the particular returned action from the server
export class ActionHandler {
    constructor(action, handler, isAsync = false) {
      this.action = action;
      this.handler = handler;
      this.isAsync = isAsync;
    }
  }
  