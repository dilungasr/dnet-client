import { ActionHandler } from "./actionHandler";
import { Message } from "./message";
import router from "./router";

// Dnet holds infos about the connection
class Dnet {
  // actionHandlers are the functions to be execeuted for the particular action from the server
  actionHandlers = [];

  //isActive tells whether the dnet connection is active or not
  isActive = false;

  // url to connect to the websocket
  url = "";

  // onOpenHandler is called when the ws connection gets opened (The first action to fire)
  onOpenHandler = () => {
    console.info(`Dnet: Successfully opened connection to ${this.url}`);
  };

  // onCloseHandler is called when the ws connection gets closed
  onCloseHandler = () => {
    console.info("Dnet: dnet closed");
  };

  // onErrorHandler is called when there is an error in the connection
  onErrorHandler = (ev) => {
    console.error(`Dnet: ${ev.data}`);
  };
  // initialize the connection
  init(url = "") {
    if (url === "") {
      console.error("Dnet: url cannot be empty");
      return;
    }

    if (this.isActive) {
      console.info("Dnet: connection is still active no need to reconnect");
      return;
    }
    this.url = url;
    this.conn = new WebSocket(this.url);
    this.route();
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

    this.actionHandlers.push(new ActionHandler(action, handler));
  }

  //  fire emits the action to the server
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
    this.conn.send(messageJSON);
  }

  //  route call the handler in the actionHandlers which matches the incoming action
  route() {
    router(this);
  }

  //   onopen sets the onOpenHandler which is called when the ws is opened
  onopen(handler = this.onOpenHandler) {
    //validate the handler
    if (typeof handler != "function") {
      console.error("Dnet: handler must be of type function");
      return;
    }

    this.onOpenHandler = handler;
  }

  //onclose set the oonCloseHandler which is called when ws connection gets closed
  onclose(handler = this.onCloseHandler) {
    if (typeof handler != "function") {
      console.error("Dnet: handler must be of type function");
      return;
    }

    this.onCloseHandler = handler;
  }

  //async for working with asynchronous programming
  async = {
    fire: (action = "", data, rec = "") => {
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
      this.conn.send(messageJSON);

      // return the promise for asynchronous programming
      return new Promise((resolve, reject) => {
        this.async.on(action, (res) => {
          const { ok } = res;

          //resolve if everyting is fine
          if (ok) resolve(res);
          else reject(res);
        });
      });
    },
    //   On method adds the actionHandler to the actionHandlers slice
    on: (action = "", handler) => {
      if (action == "") {
        console.error("Dnet: action cannot be empty ");
        return;
      }

      //validate the handler
      if (typeof handler != "function") {
        console.error(
          "Dnet: handler must be of type function with one argument"
        );
        return;
      }

      this.actionHandlers.push(new ActionHandler(action, handler, true));
    },
    onopen: () => {
      //   return promise for working in async pattern
      return new Promise((resolve) => {
        this.onOpenHandler = (ev) => {
          resolve(ev);
        };
      });
    },
  };

  // resets dnet before  actionHandlers are loaded again
  // when root component is revisited again before ws connection get closed
  refresh() {
    const handlers = this.actionHandlers;

    let i = handlers.length;

    while (i--) {
      handlers.pop();
    }
  }
}

export default Dnet;
