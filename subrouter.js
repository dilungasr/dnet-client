import { ActionHandler } from "./actionHandler";
import { Message } from "./message";

// Subrouter manages action grouping
export class Subrouter {
  // take path prefix
  constructor(prefix = "", parent) {
    this._prefix = prefix;
    this._actionHandlers = parent._actionHandlers;
    this._conn = parent._conn;
  }
  //   On method adds the actionHandler to the actionHandlers action
  on(action = "", handler) {
    //validate the handler
    if (typeof handler != "function") {
      console.error("Dnet: handler must be of type function with one argument");
      return;
    }

    const fullAction = this._prefix + action;
    this._actionHandlers.push(new ActionHandler(fullAction, handler));
  }

  // _asyncOn is and asynchronous version of the on() method
  _asyncOn(action = "", handler) {
    //validate the handler
    if (typeof handler != "function") {
      console.error("Dnet: handler must be of type function with one argument");
      return;
    }

    this._actionHandlers.push(new ActionHandler(action, handler, true));
  }
  // fire emits an action that is propagated to the server
  // and returns a promise which resolves on success and rejects on bad status code
  fire(action = "", data, rec = "") {
    if (action == "") {
      console.error("Dnet: action cannot be empty ");
      return;
    }

    // set the defualt data
    if (!data) {
      data = "";
    }

    // create the new message
    const fullAction = this._prefix + action;
    const message = new Message(fullAction, data, rec);

    //covert message to json
    const messageJSON = JSON.stringify(message);

    // send the data to the server
    this._conn.send(messageJSON);

    // return the promise for synchronous programming
    return new Promise((resolve, reject) => {
      this._asyncOn(fullAction, (res) => {
        const { ok } = res;

        //resolve if everyting is fine
        if (ok) resolve(res);
        else reject(res);
      });
    });
  }

  //   router creates a child subrouter
  router(childPrefix) {
    const prefix = this._prefix + childPrefix;

    return new Subrouter(prefix, this);
  }
}
