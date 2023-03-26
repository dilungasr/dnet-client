import { ActionHandler } from "./actionHandler";
import { Message } from "./message";
import router from "./router";
import { Subrouter } from "./subrouter";

/**
 * Holds, manages and exposes dnet state and functionalities (API)
 */
class Dnet {
  // actionHandlers are the functions to be executed for the particular action from the server
  _actionHandlers = [];

  /**
   *tells whether the websocket connection is active or not
   * */
  isActive = false;

  // url to connect to the websocket
  url = "";

  // onOpenHandler is called when the ws connection gets opened (The first action to fire)
  _onOpenHandler = () => {
    console.info(`[dnet] Successfully opened connection to ${this.url}`);
  };

  // onCloseHandler is called when the ws connection gets closed
  _onCloseHandler = () => {
    console.info("[dnet] dnet closed");
  };

  // onErrorHandler is called when there is an error in the connection
  _onErrorHandler = (ev) => {
    console.error(`[dnet] ${ev.data}`);
  };

  /**
   *
   * @param {string} url The endpoint of the server-side dnet"
   * @returns
   */
  init(url) {
    if (url === "") {
      throw new Error("[dnet] url cannot be empty");
    }

    if (this.isActive) {
      console.info("[dnet] connection is still active no need to reconnect");
      return;
    }
    this.url = url;
    this._conn = new WebSocket(this.url);
    this._route();
  }

  //  _route initializes the routing process
  _route() {
    router(this);
  }

  /**
   * Sets the function to be called when websocket connection gets opened
   * @param {function} handler Function to call when websocket connection gets opened
   */
  onopen(handler = this.onOpenHandler) {
    //validate the handler
    if (typeof handler != "function") {
      throw new Error("[dnet] handler must be of type function");
    }

    this._onOpenHandler = handler;
  }

  /**
   * Sets the function to be called when websocket connection gets closed
   * @param {function} handler Function to call when websocket connection gets closed
   */
  onclose(handler = this.onCloseHandler) {
    if (typeof handler != "function") {
      throw new Error("[dnet] handler must be of type function");
    }

    this._onCloseHandler = handler;
  }

  /**
   * Sets the function to be called when there is a connection error
   * @param {function} handler Function when there is a connection error
   */
  onerror(handler = this._onErrorHandler) {
    if (typeof handler != "function") {
      throw new Error("[dnet] handler must be of type function");
    }

    this._onCloseHandler = handler;
  }

  /**
   * Attachs handler to the action
   * @param {string} action Holds the action to listen to
   * @param {function} handler Function to call when the action is triggered by the server
   * @returns
   */
  on(action, handler) {
    if (action == "") {
      console.error("[dnet] action cannot be empty ");
      return;
    }

    //validate the handler
    if (typeof handler != "function") {
      console.error(
        "[dnet] handler must be of type function with one argument"
      );
      return;
    }

    this._actionHandlers.push(new ActionHandler(action, handler));
  }

  // _asyncOn is and asynchronous version of the on() method
  _asyncOn(action = "", handler) {
    if (action == "") {
      console.error("[dnet] action cannot be empty ");
      return;
    }

    //validate the handler
    if (typeof handler != "function") {
      console.error(
        "[dnet] handler must be of type function with one argument"
      );
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
  fire(action = "", data, rec = "") {
    if (action == "") {
      console.error("[dnet] action cannot be empty ");
      return;
    }

    // set the defualt data
    if (!data) {
      data = "";
    }

    // create the new message
    const message = new Message(action, data, rec);

    //covert message to json
    const messageJSON = JSON.stringify(message);

    // send the data to the server
    this._conn.send(messageJSON);

    // return the promise for synchronous programming
    return new Promise((resolve, reject) => {
      this._asyncOn(action, (res) => {
        const { ok, isSource } = res;

        //resolve if everyting is fine
        if (isSource && ok) resolve(res);
        else if (isSource) reject(res);
      });
    });
  }

  /**
   * Cleans out dnet for handlers to be loaded anew.
   *
   * This is extemely useful when the root page where your dnet listeners are defined gets revisited. It prevents
   * duplicate listeners from being defined again.
   */
  refresh() {
    const handlers = this._actionHandlers;

    handlers.length = 0;
  }

  /**
   * Creates a subrouter on the dnet root
   * @param {string} basePath base action path for this sub router
   * @returns {Subrouter} Subrouter
   * @example
   * const router = dnet.router("/users");
   *
   * //listen to '/users/online'
   * router.on("/online", ({data}) => {
   * //do something ...
   * })
   */
  router(basePath) {
    return new Subrouter(basePath, this);
  }
}

export default Dnet;
