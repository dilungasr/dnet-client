// Message  models the data to be sent to the server
export class Message {
    constructor(action, data, rec) {
      this.action = action;
      this.data = data;
      this.rec = rec;
    }
  }
  