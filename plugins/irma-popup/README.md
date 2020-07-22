# IRMA popup

This plugin contains a popup for IRMA flows in the web browser. It is a pop-up
variant of the [`irma-web` plugin](https://github.com/privacybydesign/irma-frontend-packages/tree/master/plugins/irma-web).

Because this plugin is based on `irma-web`, it is also designed to be used with
[`irma-css`](https://github.com/privacybydesign/irma-frontend-packages/tree/master/plugins/irma-css). 
`irma-css` is not a dependency of this package by design. This means that the CSS must be imported
separately. How to do this, you can check in the README of `irma-css`. In this way you can also
adapt `irma-css` to your own design and import this custom style instead.

If you *do* want to use `irma-css` (which is recommended), you may also consider using
[the `irma-frontend` package](https://github.com/privacybydesign/irma-frontend-packages/tree/master/irma-frontend)
instead for ease of use, or take a look at
[the `irma-popup` example](https://github.com/privacybydesign/irma-frontend-packages/tree/master/examples/browser/irma-web)
for a more hands-on implementation example.

## Usage

```javascript
const IrmaCore = require('@privacybydesign/irma-core');
const Popup    = require('@privacybydesign/irma-popup');

require('@privacybydesign/irma-css');

const irma = new IrmaCore(/* options */);
irma.use(Popup);
irma.start();
```

## Options

This plugin can handle all the options that the [`irma-web` plugin](https://github.com/privacybydesign/irma-frontend-packages/tree/master/plugins/irma-web#options)
accepts. It introduces one additional option:

### closePopupDelay
This option determines how long the popup will remain open, after a session has been
succeeded or got into some other irrecoverable end state, before it automatically closes.
In this way the user can see the animation that indicates the reason why the popup is closing.
The default is `2000` milliseconds.

## Extra behaviour
The `irma-popup` plugin makes it possible for users to abort the session by closing
the popup. When using this plugin, the `start` method of `irma-core` will
reject its promise in this scenario using the callback message `Aborted`.
