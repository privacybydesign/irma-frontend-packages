# IRMA core

This package contains the state machine for implementing IRMA flows. You can
register plugins with this state machine and then start the machine:

```javascript
const IrmaCore = require('irma-core');
const irma     = new IrmaCore(/* options */);

irma.use(/* Plugin A */);
irma.use(/* Plugin B */);

irma.start();
```

You can pass an options object to the constructor, which will be passed on to
each plugin that you register. Each plugin can choose which of your options to
use or ignore.

```javascript
const irma = new IrmaCore({
  debugging: true,            // Used by state machine and multiple plugins
  element:   '#irma-web-form' // Used by `irma-web` plugin
});
```

The `start` method starts the state machine and returns a Promise. Whatever
parameters you pass to the `start` method get passed to the `start` method of
the plugins too, but no plugins currently make use of that.

```javascript
irma.start()
    .then(result => console.log("Successful disclosure! 🎉", result))
    .catch(error => console.error("Couldn't do what you asked 😢", error));
```

This Promise only resolves when the state machine reaches the `Success` state
and only rejects when the machine reaches a state with a final transaction.
The end states `BrowserNotSupported` and `Ended` always lead to a reject.
The other possible end states are `Cancelled`, `Timeout` and `Error`.
In the reject case, plugins may already inform the user of this issue, so please
test if you need to catch the state yourself. You may wish to fall back to
another authentication method automatically by catching the rejection and
redirecting the user.
