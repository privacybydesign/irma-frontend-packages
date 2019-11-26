# IRMA console

This plugin contains a front-end for IRMA flows in the web browser. It is based
on [`irma-web-frontend`](https://github.com/nuts-foundation/irma-web-frontend),
but can be used with different styling. `irma-web-frontend` is not a dependency
of this package by design, so you are free to use other styling. If you do want
to use `irma-web-frontend` (which is recommended), take a look at
[the provided instructions](https://github.com/nuts-foundation/irma-web-frontend#embedding-in-your-application)
or the [`irma-web` example](https://github.com/privacybydesign/irma-js-packages/tree/master/examples/browser/irma-web).

## Usage

```javascript
const IrmaCore = require('irma-core');
const Web      = require('irma-web');

const irma = new IrmaCore({
  element: '#irma-web-form'
});

irma.use(Web);
irma.start(/* parameters */);
```

## Options

### element

The element option should contain a selector that points to an element in which
to render the IRMA form. This is a required option.

### showHelper

### translations
