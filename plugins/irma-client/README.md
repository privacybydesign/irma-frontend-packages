# IRMA client

This plugin allows your IRMA flow to communicate with a back-end. It is highly
configurable for use in many different setups.

## Usage

For a simple demo where you directly start an IRMA session at an IRMA server
(**not recommended in web browsers!**, see [below](#session)) you can use this
snippet:

```javascript
const IrmaCore = require('@privacybydesign/irma-core');
const Client   = require('@privacybydesign/irma-client');

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

irma.use(Client);
irma.start();
```

## Options

### debugging

This plugin listens to the `debugging` option, and will render some basic
information when debugging is enabled.

### session

The `session` option is the only required one. The `session` options contains
three property structs corresponding to the three phases session handling has:
 - `start` dealing with fetching session information from a remote server;
 - `mapping` dealing with parsing the needed information out of the fetched
   session information;
 - `result` dealing with fetching the result from a remote server.

The only separate option the `session` option contains is the `url` option
specifying the url of your remote server. This option is required when you
use the `start` and/or the `result` option.

All property structs have default values set matching the flow when directly using the
[`irma server`](https://irma.app/docs/irma-server/) for handling sessions.
If you need more fine grained control over how the session is started and how
the result from the session is fetched on the server, you can override (parts
of) `start` and/or `result`.

If you don't need your Javascript to fetch the session result, you can set
`result` to `false`. The Promise will then just resolve when the session is done.

With the `mapping` properties you can specify
how respectively the session pointer and the session token can be derived
from the start session response. The response received using the options of
`start` is first parsed `parseResponse`. The mapping function then specify
how to map the `start` response on the particular variable.

In case you obtain a session pointer and/or a session token in a
custom way, you can skip fetching a session by setting `start: false`.
You can then override the mapping functions to manually
specify your session pointer and/or session token.
For example, when you somewhere collected
a session pointer in a variable, say `customQr`,
you can start this session by doing:

```javascript
session: {
  start: false,
  mapping: {
    sessionPtr: () => customQr
  },
  result: false
}
```

Be aware that when you set `start` to false, a user can only handle a session
once. When the user cancels a session or runs into some error, no restart
can be done by the user. **As a developer you are responsible yourself to take
into account alternative flows for these cases. We therefore do not recommend
disabling `start`.**

**It is also recommended to not start sessions or fetch results on the IRMA server
from a web browser**, but have a service in between that starts the session and
checks the result for you. So in the browser the `url` property of `session`
should point to a server that you control, which isn't your IRMA server.

These are the accepted properties and their defaults on the `session` object:

```javascript
session: {
  url: '',

  start: {
    url:           o => `${o.url}/session`,
    body:          null,
    method:        'POST',
    headers:       { 'Content-Type': 'application/json' },
    parseResponse: r => r.json()
  },

  mapping: {
    sessionPtr:      r => r.sessionPtr,
    sessionToken:    r => r.token
  },

  result: {
    url:           (o, {sessionPtr, sessionToken}) => `${o.url}/session/${sessionToken}/result`,
    body:          null,
    method:        'GET',
    headers:       { 'Content-Type': 'application/json' },
    parseResponse: r => r.json()
  }
}
```

### state

The `state` option tells the plugin how to subscribe to state changes on the
server. By default the plugin tries to use Server Sent Events, and if that fails
it will fall back to basic polling. You can disable either feature by setting
them to `false` instead of an object.

Finally we have the cancel endpoint that is being used to communicate a cancellation
initiated by the user via this library itself. Automatic cancellation can also be
disabled by setting it to `false`.

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
  },
  
  cancel: {
    url:        o => o.url
  }
}
```

Note that in the `url` functions, `o.url` in this case isn't `session.url`, but
rather the `u` property from the QR code object (or `sessionPtr.u`). So by
default these URLs **will** point to your IRMA server, which is okay.
