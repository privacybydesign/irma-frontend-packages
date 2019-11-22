# IRMA Javascript packages

Building web-based IRMA flows has never been as easy or as flexible!

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
irma.start('http://localhost:8088', {
  "@context": "https://irma.app/ld/request/disclosure/v2",
  "disclose": [
    [
      [ "pbdf.pbdf.email.email" ]
    ]
  ]
})
.then(result => console.log("Successful disclosure! 🎉", result))
.catch(error => console.error("Couldn't do what you asked 😢", error));
```
