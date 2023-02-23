import { ActionHandler } from "./actionHandler";
import { Message } from "./message";

/**
 * Subrouter models the sub router and creates its final base path by combining the parent's
 *  base path with the given base path
 * @example
 * const router = dnet.router("/users");
 * const updateRouter = router.router("/update")
 *
 * //listen to '/users/update/name'
 * updateRouter.on("/name", ({data}) => {
 * //do something ...
 * })
 */
export class Subrouter {
  /**
   * Subrouter models the sub router and creates its final base path by combining the parent's
   *  base path with the given base path
   * @param {string} base The base path for this sub router
   * @param {Dnet | Subrouter} parent The parent router.
   *
   * @example
   * const router = dnet.router("/users");
   * const updateRouter = router.router("/update")
   *
   * //listen to '/users/update/name'
   * updateRouter.on("/name", ({data}) => {
   * //do something ...
   * })
   */
  constructor(base, parent) {
    this._base = base;
    this._actionHandlers = parent._actionHandlers;
    this._conn = parent._conn;
  }
  /**
   * Attachs handler to the action
   * @param {string} action Holds the action to listen to
   * @param {function} handler Function that is called when the action is triggered by the server
   * @returns
   */
  on(action, handler) {
    //validate the handler
    if (typeof handler != "function") {
      console.error("[dnet] handler must be of type function");
      return;
    }

    const fullAction = this._base + action || "";
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

  /**
   * Triggers an action to the server i.e sends data to the server by hitting the given action endpoint
   * @param {string} action The action to fire
   * @param {Object} data Data to send to the server
   * @param {string} rec You can pass the ID of the recipient here if your server
   *  expects to access it using the dnet context
   * @returns
   */
  fire(action, data, rec) {
    if (action == "") {
      console.error("[dnet] action cannot be empty ");
      return;
    }

    // set the defualt data
    if (!data) {
      data = "";
    }

    // create the new message
    const fullAction = this._base + action;
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

  /**
   * Creates a subrouter on the parent router
   * @param {string} basePath sub-base path for this sub router
   * @returns {Subrouter} Subrouter
   * @example
   * const router = dnet.router("/users");
   * const updateRouter = router.router("/update")
   *
   * //listen to '/users/update/name'
   * updateRouter.on("/name", ({data}) => {
   * //do something ...
   * })
   */

  router(basePath) {
    const base = this._base + basePath;

    return new Subrouter(base, this);
  }
}
