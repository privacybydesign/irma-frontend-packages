# IRMA popup

This plugin contains a popup for IRMA flows in the web browser. It is a pop-up
variant of the [`irma-web` plugin](../irma-web).

Because this plugin is based on `irma-web`, it is also designed to be used with
[`irma-css`](../../irma-css) but can be used with different styling. `irma-css`
is not a dependency of this package by design, so you are free to use other
styling.

If you *do* want to use `irma-css` (which is recommended), you can check the
[the `irma-popup` example](../../examples/browser/irma-popup) on how to use it.

## Usage

```javascript
const IrmaCore = require('@privacybydesign/irma-core');
const Popup    = require('@privacybydesign/irma-popup');

const irma = new IrmaCore(/* options */);
irma.use(Popup);
irma.start();
```

## Options

This plugin can handle all the options that the [`irma-web` plugin](../irma-web)
accepts.

## Extensions

The `irma-popup` plugin makes it possible for users to abort the session by closing
the popup. Therefore, when using this plugin, the `start` method of `irma-core` can
also reject its promise using the callback message `ClosedByUser`.

