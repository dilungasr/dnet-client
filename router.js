// router watches the incoming action and calls the matching handler, watches error
function router(context) {
  let actionHandlers = context.actionHandlers;

  //   listen on the message
  context.conn.onmessage = ev => {
    const { action, data, status, sender } = JSON.parse(ev.data);

    // call all actionHandlers matching the incoming action
    let i = actionHandlers.length;
    while (i--) {
      if (actionHandlers[i].action === action) {
        // ok tells if everything went well not....
        // true for  successfully  the request was successfully received, understood, and accepted
        // false for anything else

        let ok = false;

        //check for the good response
        if (status >= 200 && status < 300) ok = true;

        // take the response data from the server
        const res = { data, status, ok, sender };

        //   call the given handler
        actionHandlers[i].handler(res);

        // remove the ActionHandler if it's asynchronous

        if (actionHandlers[i].isAsync) {
          actionHandlers = actionHandlers.filter(
            actionHandler => actionHandler !== actionHandlers[i]
          );

          // re-associate the new context.actionHandlers address with the actionHandlers' address
          context.actionHandlers = actionHandlers;
        }
      }
    }
  };

  //   listen to the error
  context.conn.onerror = ev => {
    context.isActive = false;
    context.onErrorHandler(ev);
  };

  //  when the connection open
  context.conn.onopen = ev => {
    context.isActive = true;
    context.onOpenHandler(ev);
  };

  // when the connection closes
  context.conn.onclose = ev => {
    context.isActive = false;
    context.onCloseHandler(ev);
  };
}

export default router;
