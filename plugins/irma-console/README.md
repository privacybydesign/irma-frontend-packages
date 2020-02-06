# IRMA console

This plugin contains a console based front-end for IRMA flows. It's mostly
useful for testing purposes or for use in `nodejs` applications.

This plugin takes no special options or parameters to the start method. It will
render a QR code to either the local `nodejs` terminal or the browser console.

## Usage

```javascript
const IrmaCore = require('irma-core');
const Console  = require('irma-console');

const irma = new IrmaCore(/* options */);
irma.use(Console);
irma.start();
```
