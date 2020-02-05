# IRMA core

This package contains the state machine for implementing IRMA flows. You can
register plugins with this state machine and then start the machine:

```javascript
const IrmaCore = require('irma-core');
const irma     = new IrmaCore(/* options */);

irma.use(/* Plugin A */);
irma.use(/* Plugin B */);

irma.start(/* parameters */);
```

You can pass an options object to the constructor, which will be passed on to
each plugin that you register. Each plugin can choose which of your options to
use or ignore.

```javascript
const irma = new IrmaCore({
  debugging: true,            // Used by state machine and multiple plugins
  detailedErrors: false,      // Used by irma-core what error should be returned when the promise rejects
  element:   '#irma-web-form' // Used by `irma-web` plugin
});
```

The `start` method starts the state machine and returns a Promise. Whatever
parameters you pass to the `start` method get passed to the `start` method of the
plugins too.

```javascript
irma.start(/* parameters */)
    .then(result => console.log("Successful disclosure! 🎉", result))
    .catch(error => console.error("Couldn't do what you asked 😢", error));
```

This Promise only resolves when the state machine reaches the `Success` state
and only rejects when the machine reaches the `BrowserNotSupported`
or the `Aborted` state. In the reject case, 
plugins may already inform the user of this issue, so please
test if you need to catch this state yourself. You may wish to fall back to
another authentication method automatically by catching the rejection and
redirecting the user.

By default, the error you receive by the reject case of the promise is a message
string describing the error it encountered. In some situations you might want to
do some error handling based on the exact error situation irma-core encountered.
Therefore we offer you the `detailedErrors` option. When being set to true, 
you receive the exact state irma-core was in when the error occurred. For example,
below you see the error you get when using the plugin `irma-popup` and the user closed
the popup.

```javascript
{
      newState:   'Aborted',
      oldState:   'Cancelled',
      transition: 'abort',
      payload:    'Popup closed'
}
```