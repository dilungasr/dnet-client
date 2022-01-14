import { ActionHandler } from "./actionHandler";
import { Message } from "./message";
import router from "./router";
import { Subrouter } from "./subrouter";

// Dnet holds infos about the connection
class Dnet {
  // actionHandlers are the functions to be executed for the particular action from the server
  _actionHandlers = [];

  //isActive tells whether the dnet connection is active or not
  isActive = false;

  // url to connect to the websocket
  url = "";

  // onOpenHandler is called when the ws connection gets opened (The first action to fire)
  _onOpenHandler = () => {
    console.info(`Dnet: Successfully opened connection to ${this.url}`);
  };

  // onCloseHandler is called when the ws connection gets closed
  _onCloseHandler = () => {
    console.info("Dnet: dnet closed");
  };

  // onErrorHandler is called when there is an error in the connection
  _onErrorHandler = (ev) => {
    console.error(`Dnet: ${ev.data}`);
  };
  // initialize the connection
  init(url = "") {
    if (url === "") {
      throw new Error("Dnet: url cannot be empty");
    }

    if (this.isActive) {
      console.info("Dnet: connection is still active no need to reconnect");
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

  //   onopen sets the onOpenHandler which is called when the ws is opened
  onopen(handler = this.onOpenHandler) {
    //validate the handler
    if (typeof handler != "function") {
      throw new Error("Dnet: handler must be of type function");
    }

    this._onOpenHandler = handler;
  }

  //onclose set the oonCloseHandler which is called when ws connection gets closed
  onclose(handler = this.onCloseHandler) {
    if (typeof handler != "function") {
      throw new Error("Dnet: handler must be of type function");
    }

    this._onCloseHandler = handler;
  }

  //onclose set the oonCloseHandler which is called when ws connection gets closed
  onerror(handler = this._onErrorHandler) {
    if (typeof handler != "function") {
      throw new Error("Dnet: handler must be of type function");
    }

    this._onCloseHandler = handler;
  }

  //   On method adds the actionHandler to the actionHandlers slice
  on(action = "", handler) {
    if (action == "") {
      console.error("Dnet: action cannot be empty ");
      return;
    }

    //validate the handler
    if (typeof handler != "function") {
      console.error("Dnet: handler must be of type function with one argument");
      return;
    }

    this._actionHandlers.push(new ActionHandler(action, handler));
  }

  // _asyncOn is and asynchronous version of the on() method
  _asyncOn(action = "", handler) {
    if (action == "") {
      console.error("Dnet: action cannot be empty ");
      return;
    }

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
    const message = new Message(action, data, rec);

    //covert message to json
    const messageJSON = JSON.stringify(message);

    // send the data to the server
    this._conn.send(messageJSON);

    // return the promise for synchronous programming
    return new Promise((resolve, reject) => {
      this._asyncOn(action, (res) => {
        const { ok } = res;

        //resolve if everyting is fine
        if (ok) resolve(res);
        else reject(res);
      });
    });
  }

  // resets dnet before  actionHandlers are loaded again
  // when root component is revisited again before ws connection get closed
  refresh() {
    const handlers = this._actionHandlers;

    handlers.length = 0;
  }

  // router creates a subrouter
  router(prefix) {
    return new Subrouter(prefix, this);
  }
}

export default Dnet;
