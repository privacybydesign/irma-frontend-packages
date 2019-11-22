_Work in progress - See https://github.com/privacybydesign/irmajs for now_

# IRMA Javascript packages

Building IRMA flows in Javascript has never been as easy or as flexible!

## Quick start guide

__Step one__

Load and initialize `irma-core`:

```javascript
const IrmaCore = require('irma-core');
const irma     = new IrmaCore();
```

__Step two__

Choose and load the [plugins](https://github.com/privacybydesign/irma-js-packages/tree/master/plugins)
that you want, for example:

```javascript
const IrmaServer = require('irma-irmaserver');
const IrmaWeb    = require('irma-web');

irma.use(IrmaServer);
irma.use(IrmaWeb);
```

__Step three__

Start your IRMA flow:

```javascript
irma.start()
.then(result => console.log("Successful disclosure! 🎉", result))
.catch(error => console.error("Couldn't do what you asked 😢", error));
```

## Configuration

The `irma-core` constructor takes an options object. This object is then used by
`irma-core` and any plugins you add to your project. For example:

```javascript
const irma = new IrmaCore({
  debugging: true,            // Used by state machine and multiple plugins
  element:   '#irma-web-form' // Used by `irma-web` plugin
});
```

Also, some plugins take parameters to the `start` method. The advantage of this
is that you can reuse your `irma` object for multiple flows, but start each
flow with a different input. An example of this:

```javascript
irma.start(request)
.then(result => console.log("Successful disclosure! 🎉", result))
.catch(error => console.error("Couldn't do what you asked 😢", error));
```

## Additional documentation

Want to know more about any of the packages? Each package has their own README
file with features, options and purpose of the package:

* [`irma-core`](irma-core)
* Plugins
  * [`irma-console`](plugins/irma-console)
  * [`irma-dummy`](plugins/irma-dummy)

Also, we have several examples available that show how you can use specific
combinations of plugins to achieve different effects:

* Web browser
  * [`irma-console`](examples/browser/irma-console)
* nodejs
  * [`irma-console`](examples/node/irma-console)
