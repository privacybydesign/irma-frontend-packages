# IRMA client

This plugin for `irma-core` allows your IRMA flow to communicate with a back-end. 
It is highly configurable for use in many different setups. This plugin takes
care of initiating most of the transitions to the `irma-core` state machine.

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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        '@context': 'https://irma.app/ld/request/disclosure/v2',
        'disclose': [
          [
            [ 'pbdf.pbdf.email.email' ],
            [ 'pbdf.sidn-pbdf.email.email' ],
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

The `session` options contains three property structs with options for 
starting and finishing IRMA sessions:
 - [`start`](#option-start) dealing with fetching the information needed for a new
   IRMA session (like the session pointer) from a remote server;
 - [`mapping`](#option-mapping) dealing with parsing the needed information out of
   the information fetched during [`start`](#option-start);
 - [`result`](#option-result) dealing with fetching the result from a remote server.
 
More details about these property structs can be found below.

The only separate option `session` contains is the `url` option,
specifying the url of your remote server. This option is required when you
use the `start` and/or the `result` option.

If you want to use another plugin for starting IRMA sessions, you can disable
the session functionality of `irma-client` by saying `session: false`. In this
case `irma-client` will not request the `this._stateMachine.transition('initialize', {canRestart: true/false})`
at the `irma-core` state machine when `irma-core`'s `start()` method is called. It will
also not request the `this._stateMachine.transition('loaded', qr)` transition when it
hits the `Loading` state. This means you have to specify a custom plugin that requests
these transitions instead.

General outline:
```javascript
session: {
  url: 'http://example.com/irmaserver',
  start: {
    ...
  },
  mapping: {
    ...
  },
  result: {
    ...
  }
}
```

##### Option `start`
These options define the HTTP request `irma-client` has to do in order
to fetch the information of the IRMA session that has to be performed.
The response of this endpoint must at least contain an IRMA `sessionPtr`.
A session pointer can be retrieved at the IRMA server by using the [IRMA
server library](https://godoc.org/github.com/privacybydesign/irmago/server/irmaserver#Server.StartSession),
the [IRMA server REST API](https://irma.app/docs/api-irma-server/#post-session)
or using one of the [IRMA backend packages](https://github.com/privacybydesign/irma-backend-packages).

The default values are set for fetching the session pointer
(on `irma-core` state `Loading`) with a GET request on the
endpoints `${o.url}/session`. In here, `o` is the value of
the `session` struct as described above. The response
that is received is parsed using the specified `parseResponse`
function. The default values for `start` can be found below.

```javascript
start: {
    url:           o => `${o.url}/session`,
    parseResponse: r => r.json()
    // And the default settings for fetch()'s init parameter
    // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
}
```

We use the `fetch()` [default settings](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch).
The properties from `start` are passed as custom options
to `fetch()`. This means you can use [all options](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)
of `fetch()`to customize the request `irma-client` does for you. For example,
in case you want a specific POST request to be done instead of the default
GET request, you can do so.

```javascript
start: {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    '@context': 'https://irma.app/ld/request/disclosure/v2',
    'disclose': [
      [
        [ 'pbdf.pbdf.email.email' ],
        [ 'pbdf.sidn-pbdf.email.email' ],
      ]
    ]
  })
}
```

If you don't need your Javascript to fetch the session pointer, you can set
`start` to `false`. This is for example useful when you obtained the
session pointer in another way. Please check the [mapping options](#option-mapping)
how to insert your custom `sessionPtr` into `irma-client`.

Be aware that when you set `start` to false, a user can only handle a session
once. When the user cancels a session or runs into some error, no restart
can be done by the user. **As a developer you are responsible yourself to take
into account alternative flows for these cases. We therefore do not recommend
disabling `start`.**

**It is also recommended to not start sessions or fetch results on the IRMA server
from a web browser directly**. Instead, you mostly have a service in between that starts
the session and checks the result for you. So in the browser the `url` property of
`session` should point to a server that you control, which isn't your IRMA server.

##### Option `mapping`
With the `mapping` properties you can specify how the
session pointer, and possibly other values (like the session token),
can be derived from the start session response. The response received using
the options from [`start`](#option-start) is first parsed by its `parseResponse`. The mapping
functions then specify how to map the parsed response on particular
variables. The result from the `sessionPtr` mapping should be a valid IRMA
`sessionPtr`. All other mappings are free to choose. The resulting variables
can be accessed as second parameter in the `url` option of the [`result` property struct](#option-result).
There it can be used to compose the result endpoint. The result of each
`mapping` function is available there, named after its map key.

In case you obtain a session pointer (and possibly the other values) in
another way than via `start`, you can override the mapping functions to manually
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

In case no mapping option is specified (i.e. the `mapping` option is not
specified within [`session`](#session)), the default mapping is used. The default
mapping can be found below.

```javascript
mapping: {
    sessionPtr:      r => r.sessionPtr,
    sessionToken:    r => r.token
}
```

##### Option `result`
These options define the HTTP request `irma-client` has to do when an IRMA
session succeeds. In this way results of the IRMA session can be fetched.

This option has the same outline as the `start` option.
The default values are set for fetching the session result (on state `Success`)
with a GET request on the endpoint `${o.url}/session/${sessionToken}/result`.
In this, `o` (in `${o.url}`) points to the value of the `session` struct as described above. 

We use the `fetch()` [default settings](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch).
The `result` properties are passed as custom options
to `fetch()`. This means you can use [all options](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)
of `fetch()`to customize the request `irma-client` does for you.

If you don't need your Javascript to fetch a session result, you can set
`result` to `false`. The `irma-core` Promise will then just resolve
when the session is done.

The default values for the `result` options can be found below.

```javascript
result: {
    url:           (o, {sessionPtr, sessionToken}) => `${o.url}/session/${sessionToken}/result`,
    parseResponse: r => r.json()
    // And the default settings for fetch()'s init parameter
    // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
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
rather the `u` property from the QR code object (so `sessionPtr.u`). By
default these URLs **will** point to your IRMA server, which is okay.

## Behaviour
This plugin initiates the following transitions to the `irma-core` state machine.

**When being in state `Loading`:**

If `session` option is set to `false`, the plugin does nothing in this state.

Otherwise this plugin:
 * Fetches the `start` endpoint (unless `start` is explicitly set to `false`).
 * Extracts the session pointer (and the session token if specified) using the functions from the `mapping` option.

| Possible transitions | With payload              | Next state          |
|----------------------|---------------------------|---------------------|
| `loaded`             | `sessionPtr`              | MediumContemplation |
| `fail`               | Error that fetch returned | Error               |

**When being in state `MediumContemplation`, `ShowingQRCode`, `ContinueOn2ndDevice`, `ShowingIrmaButton`
or `ShowingQRCodeInstead`:**

In these states the plugin polls the status at IRMA server using the `state` options.
If status is `DONE` and the `result` endpoint is enabled (so if `result` is not explicitly set to `false`),
then the `result` endpoint is fetched.

| Possible transitions                        | With payload                                              | Next state        |
|---------------------------------------------|-----------------------------------------------------------|-------------------|
| `appConnected` if new status is `CONNECTED` |                                                           | ContinueInIrmaApp |
| `succeed` if new status is `DONE`           | Result from `parseResponse` function of `result` endpoint | Success           |
| `timeout` if new status is `TIMEOUT`        |                                                           | TimedOut          |
| `cancel` if new status is `CANCELLED`       |                                                           | Cancelled         |
| `fail` if sse/polling fails                 | Error that fetch returned                                 | Error             |
| `fail` if fetching of result endpoint fails | Error that fetch returned                                 | Error             |

**When being in state `ContinueInIrmaApp`:**

In this state we continue polling the IRMA server using the `state` options. The only difference with the states
above is that we already processed the status `CONNECTED`, so we do not act on this status anymore. Also in this state 
holds, if status is `DONE` and the `result` endpoint is enabled (so if `result` is not explicitly set to `false`),
then the `result` endpoint is fetched.

| Possible transitions                        | With payload                                              | Next state        |
|---------------------------------------------|-----------------------------------------------------------|-------------------|
| `succeed` if new status is `DONE`           | Result from `parseResponse` function of `result` endpoint | Success           |
| `timeout` if new status is `TIMEOUT`        |                                                           | TimedOut          |
| `cancel` if new status is `CANCELLED`       |                                                           | Cancelled         |
| `fail` if sse/polling fails                 | Error that fetch returned                                 | Error             |
| `fail` if fetching of result endpoint fails | Error that fetch returned                                 | Error             |
