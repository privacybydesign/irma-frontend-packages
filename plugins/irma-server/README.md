# IRMA server

This plugin allows your IRMA flow to communicate with a back-end. It is highly
configurable for use in many different setups.

## Usage

For a simple demo where you directly start an IRMA session at an IRMA server
(**not recommended in web browsers!**, see [below](#session)) you can use this
snippet:

```javascript
const IrmaCore = require('irma-core');
const Server   = require('irma-server');

const irma = new IrmaCore({
  session: {
    // Point this to your IRMA server:
    url: 'http://localhost:8088',

    // Define your disclosure request:
    start: {
      body: JSON.stringify({
        "@context": "https://irma.app/ld/request/disclosure/v2",
        "disclose": [
          [
            [ "pbdf.pbdf.email.email" ]
          ]
        ]
      })
    }
  }
});

irma.use(Server);
irma.start();
```

## Options

### debugging

This plugin listens to the `debugging` option, and will render some basic
information when debugging is enabled.

### session

The `session` option is the only required one. It needs at least a `url`
property to point to a service where it can start a new session.

If you need more fine grained control over how the session is started and how
the result from the session is fetched on the server, you can override (parts
of) the `start` and/or `result` properties.

With the option `handle` you can specify a particular session pointer.
This can be used to handle an already existing session. This option does
not override the default `start` properties. This means that in case of
an error a session might still be restarted using the properties from `start`.
If you do not want any restart to be possible, you can set `start` to false.

**It is recommended to not start sessions or fetch results on the IRMA server
from a web browser**, but have a service in between that starts the session and
checks the result for you. So in the browser the `url` property of `session`
should point to a server that you control, which isn't your IRMA server.

These are the accepted properties and their defaults on the `session` object:

```javascript
session: {
  url: '',

  start: {
    url:          o => `${o.url}/session`,
    body:         null,
    method:       'POST',
    headers:      { 'Content-Type': 'application/json' },
    qrFromResult: r => r.sessionPtr
  },

  handle: false,

  result: {
    url:          o => `${o.url}/session/${o.session.token}/result`,
    body:         null,
    method:       'GET',
    headers:      { 'Content-Type': 'application/json' }
  }
}
```

If you don't need your Javascript to fetch the session result, you can set
`result` to `false`. The Promise will then just resolve when the session is done.

### state

The `state` option tells the plugin how to subscribe to state changes on the
server. By default the plugin tries to use Server Sent Events, and if that fails
it will fall back to basic polling. You can disable either feature by setting
them to `false` instead of an object.

These are the accepted properties and their defaults on the `state` object:

```javascript
state: {
  serverSentEvents: {
    url:        o => `${o.url}/statusevents`,
    timeout:    2000,
  },

  polling: {
    url:        o => `${o.url}/status`,
    interval:   500,
    startState: 'INITIALIZED'
  }
}
```

Note that in the `url` functions, `o.url` in this case isn't `session.url`, but
rather the `u` property from the QR code object (or `sessionPtr.u`). So by
default these URLs **will** point to your IRMA server, which is okay.
