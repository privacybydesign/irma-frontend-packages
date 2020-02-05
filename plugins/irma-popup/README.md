# IRMA popup

This plugin contains a popup for IRMA flows in the web browser. It is a pop-up
variant of the irma-web plugin.

Because this plugin is based on irma-web, it is also designed to be used with 
[`irma-css`](https://github.com/privacybydesign/irma-frontend-packages/tree/master/irma-css).
It can be used with different styling. `irma-web-frontend` is not a dependency
of this package by design, so you are free to use other styling.

If you *do* want to use `irma-css` (which is recommended), you can check the
[the `irma-popup` example](https://github.com/privacybydesign/irma-frontend-packages/tree/master/examples/browser/irma-popup)
on how to use it. Otherwise you can take a look at
[the `irma-web` plugin](https://github.com/privacybydesign/irma-frontend-packages/tree/master/examples/browser/irma-web)
for more information about how to specify your own CSS.

## Usage

```javascript
const IrmaCore = require('irma-core');
const Popup    = require('irma-popup');

const irma = new IrmaCore(/* options */);
irma.use(Popup);
irma.start(/* parameters */);
```

## Options

### language

You can set the interface language by setting the `language` option. Currently
supported values: `en` and `nl`. Default is `nl`.

### translations

If you have more specific translation requirements, or if your use-case is not
logging a user in, you can override any of the strings in the interface using
the `translations` option. It is good practice to be specific in these texts to
avoid unnecessary confusion for your users. All the translation options from irma-web
can be used in this plug-in too.

```javascript
const irma = new IrmaCore({
  translations: {
    cancel: 'Never mind!'
  }
});
```

You can find the default values of irma-plugin [in the translation files of irma-web](https://github.com/privacybydesign/irma-frontend-packages/tree/master/plugins/irma-web/translations),
combined with the additional translation strings from [the translation files of irma-plugin](https://github.com/privacybydesign/irma-frontend-packages/tree/master/plugins/irma-plugin/translations).

## Development of this plugin

In contrast to the other plugins, this plugin needs to be built using Webpack.
For development, this means that you will want to run this in a console for this
directory:

```bash
npm install
webpack --mode development --watch
```

...while you have the example (or your own project) running using its own
Webpack dev server in a second console. This way, changes to this plugin will
trigger a rebuild, which will in turn trigger a rebuild of the project depending
on this plugin.
