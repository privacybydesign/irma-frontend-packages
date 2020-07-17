# IRMA core

This package contains the state machine for implementing IRMA flows. You can
register plugins with this state machine and then start the machine:

```javascript
const IrmaCore = require('@privacybydesign/irma-core');
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

## API
### `use` method
With the `use` method, new plugins can be added to the IRMA core instance.
This method takes care of instantiating the plugin. You simply pass the
plugin class as an argument to this function; you must not instantiate
the plugin yourself.

```javascript
irma.use(/* Plugin A */);
irma.use(/* Plugin B */);
```

### `start` method
The `start` method starts the state machine and returns a Promise. Whatever
parameters you pass to the `start` method get passed to the `start` method of
the plugins too, but no plugins currently make use of that.

```javascript
irma.start()
    .then(result => console.log("Successful disclosure! 🎉", result))
    .catch(error => console.error("Couldn't do what you asked 😢", error));
```

The returned Promise only resolves when the state machine reaches the `Success` state
and only rejects when the machine reaches a state with a final transaction.
The end states `BrowserNotSupported` and `Ended` always lead to a reject.
The other possible end states are `Cancelled`, `Timeout` and `Error`.
The reject message indicates what the reason for rejection was:
`BrowserNotSupported`, `Cancelled`, `Timeout`, `Error` or `ManualAbort`.
Plugins might add possible reject messages to this list.

```javascript
irma.start()
    .then(result => console.log("Successful disclosure! 🎉", result))
    .catch(error => {
      if (error === 'ManualAbort') {
        console.log('We called abort ourselves, so no problem 😅');
        return;
      }   
      console.error("Couldn't do what you asked 😢", error);
    });
```

In the reject case, plugins may already inform the user of this issue, so please
test if you need to catch the state yourself. You may wish to fall back to
another authentication method automatically by catching the rejection and
redirecting the user.

### `abort` method
The `abort` method forces an `irma-core` instance to abort the session and
all associated plugins should clean their state. In this way you can stop
the instance from being active when it is not relevant anymore. The promise
returned by the `start` method will be rejected with a `ManualAbort` message
when `abort` is called. When `start` has not been called yet or when the
`start` promise has already finished, then calling `abort` has no effect.

```javascript
irma.abort();
```
## Documentation
More elaborate documentation on how to use this module can be found in the
[IRMA documentation](https://irma.app/docs/irma-frontend/#irma-core).
