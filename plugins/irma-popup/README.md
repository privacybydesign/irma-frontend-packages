# IRMA popup

This plugin contains a popup for IRMA flows in the web browser. It is a pop-up
variant of the irma-web plugin.

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
avoid unnecessary confusion for your users.

```javascript
const irma = new IrmaCore({
  translations: {
    Common: {
      Cancel: 'Never mind!'
    }
  }
});
```

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
