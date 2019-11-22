# IRMA dummy

This plugin contains a test dummy back-end for IRMA flows. With the dummy you
can simulate different issues that may be hard to test otherwise, which is
especially useful for developing front-end IRMA flow plugins.

This plugin takes no special parameters to the start method, but it can be
configured through the options. See below.

## Usage

```javascript
const IrmaCore = require('irma-core');
const Dummy    = require('irma-dummy');

const irma = new IrmaCore({
  debugging: true,
  dummy: 'happy path'
});

irma.use(Dummy);
irma.start(/* parameters */);
```

## Options

The dummy option can take one of these values:

 * `happy path`          ⸺ Fake everything just working™️
 * `timeout`             ⸺ Fake a session time out on the server
 * `cancel`              ⸺ Fake cancellation in the IRMA app (don't have attributes or reject disclosure)
 * `connection error`    ⸺ Fake error connecting to the server on the initial session start
 * `browser unsupported` ⸺ Fake an unsupported browser detected

This plugin also listens to the `debugging` option, and will render some basic
information when debugging is enabled.
