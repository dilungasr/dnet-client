// router watches the incoming action and calls the matching handler, watches error
function router(context) {
  let actionHandlers = context._actionHandlers;

  //   listen on the message
  context._conn.onmessage = (ev) => {
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
            (actionHandler) => actionHandler !== actionHandlers[i]
          );

          // re-associate the new context.actionHandlers address with the actionHandlers' address
          context._actionHandlers = actionHandlers;
        }
      }
    }
  };

  //   listen to the error
  context._conn.onerror = (ev) => {
    context.isActive = false;
    context._onErrorHandler(ev);
  };

  //  when the connection open
  context._conn.onopen = (ev) => {
    context.isActive = true;
    context._onOpenHandler(ev);
  };

  // when the connection closes
  context._conn.onclose = (ev) => {
    context.isActive = false;
    context._onCloseHandler(ev);
  };
}

export default router;
