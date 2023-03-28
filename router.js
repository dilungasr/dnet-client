import Dnet from "./dnet";
import { duuid } from "./uuid";

/** router watches the incoming action and calls the matching handler, watches error
 * @param {Dnet} context
 */
function router(context) {
  let actionHandlers = context._actionHandlers;

  //   listen on the message
  context._conn.onmessage = (ev) => {
    const { action, data, status, sender, isSource, asyncId } = JSON.parse(
      ev.data
    );

    // call all actionHandlers matching the incoming action
    let i = actionHandlers.length;
    while (i--) {
      const actionHandler = actionHandlers[i];
      if (actionHandler.action === action) {
        //check async id and source of asynchronous actionHandlers
        if (
          actionHandler.isAsync &&
          (!isSource || actionHandler.asyncId !== asyncId)
        ) {
          continue;
        }

        // ok tells if everything went well not....
        // true for  successfully  the request was successfully received, understood, and accepted
        // false for anything else

        let ok = false;

        //check for the good response
        if (status >= 200 && status < 300) ok = true;

        // remove the ActionHandler if it's asynchronous
        if (actionHandler.isAsync) {
          const res = { data, status, ok, sender, isSource };
          //   call the handler
          actionHandler.handler(res);

          actionHandlers = actionHandlers.filter((actionH) => {
            return actionHandler !== actionH;
          });

          // re-associate the new context.actionHandlers address with the actionHandlers' address
          context._actionHandlers = actionHandlers;

          //  delete the async id
          duuid.delete(actionHandler.asyncId);
        } else if (ok) {
          // only call non-async handlers when ok is true
          const res = { data, status, sender, isSource };

          actionHandler.handler(res);
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
