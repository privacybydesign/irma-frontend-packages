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
variables. By default, the following mappings are present:
 - `sessionPtr`: the result from the `sessionPtr` mapping should be a valid IRMA
   `sessionPtr`, [as being received from the `irma server`](https://irma.app/docs/api-irma-server/#post-session).
   This mapping is mandatory. It defaults to using the `sessionPtr` field from the parsed JSON
   response of the [`start` endpoint](#option-start).
 - `sessionToken`: the result from the `sessionToken` mapping should be a valid IRMA
   requestor token, [as being received from the `irma server`](https://irma.app/docs/api-irma-server/#post-session).
   This mapping is only mandatory if the token is required by the specified [`result` endpoint](#option-result).
   It defaults to using the `token` field from the parsed JSON response of the [`start` endpoint](#option-start) (if present).
 - `frontendAuth`: the result from the `frontendAuth` mapping should be a valid IRMA
   frontend authentication token, [as being received from the `irma server`](https://irma.app/docs/api-irma-server/#post-session).
   It defaults to using the `frontendAuth` field from the parsed JSON response of the [`start` endpoint](#option-start) (if present).
   If not present, pairing functionality cannot be used. This might be a security risk. A warning in the (browser) console
   will be visible when there is a risk. This can be resolved by either include the `frontendAuth` anyway or by
   accepting the security risk by explicitly disabling the pairing state in the [pairing state options](#pairing).

Additional mappings can also be added. Their names are free to choose (as long as there is no name collision).

The resulting variables are given as payload to the `loaded` transition of the `irma-core`
state machine. In this way the mappings can be accessed by all other plugins.
Within `irma-client` the mappings can also be accessed as second parameter in the `url` option of
the [`result` property struct](#option-result). There it can be used to compose
the result endpoint. The result of each `mapping` function is available there,
named after its map key. Furthermore, the mappings are used in several [state options](#state).

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
    sessionToken:    r => r.token,
    frontendAuth:    r => r.frontendAuth
}
```

##### Option `result`
These options define the HTTP request `irma-client` has to do when an IRMA
session succeeds. In this way results of the IRMA session can be fetched.

This option has the same outline as the `start` option.
The default values are set for fetching the session result (when `close()` is called in a `Success` state)
with a GET request on the endpoint `${o.url}/session/${sessionToken}/result`.
In this, `o` (in `${o.url}`) points to the value of the `session` struct as described above. 

We use the `fetch()` [default settings](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch).
The `result` properties are passed as custom options
to `fetch()`. This means you can use [all options](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)
of `fetch()`to customize the request `irma-client` does for you.

If you don't need your Javascript to fetch a session result, you can set
`result` to `false`. The `irma-core` Promise will then just resolve
with the `mapping` values as result when the session is done.

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

The `state` option tells the plugin what states it should use and how to subscribe for
listeners that monitor state changes on the IRMA server.

```javascript
state: {
  ...
}
```

#### State monitoring
For state monitoring, we offer the options `serverSentEvents` and `polling`.
By default, the plugin tries to use Server Sent Events for receiving state changes, and if
that fails it will fall back to basic polling. You can disable either feature by setting
the option to `false` instead of an object.

These are the accepted properties and their defaults for state monitoring:

```javascript
state: {
    serverSentEvents: {
      url:      m => `${m.sessionPtr['u']}/statusevents`,
      timeout:  2000
    },

    polling: {
      url:        m => `${m.sessionPtr['u']}/status`,
      interval:   500,
      startState: 'INITIALIZED'
    }
}
```

The URL from `m.sessionPtr['u']` will point directly to your IRMA server.
This is intentional; the IRMA app should be able to access those endpoints too.

#### Cancellation
The `irma server` knows an endpoint to delete sessions. This endpoint is being
used to communicate session cancellation initiated by the user via this library.
Communicating cancellation to the `irma server` can be disabled by
setting the `cancel` option to `false` instead of an object.

These are the accepted properties and their defaults for cancellation:

```javascript
state: {
    cancel: {
      url: m => m.sessionPtr['u']
    },
}
```

The URL from `m.sessionPtr['u']` will point directly to your IRMA server.
This is intentional; the IRMA app should be able to access those endpoints too.

#### Pairing
The pairing state is an optional state that can be introduced to prevent QR theft,
added between scanning a IRMA QR code and actually performing the session.
In this state, a pairing code is visible in the IRMA app. The user should enter
that pairing code in the frontend to continue.
For the following session types it is important that the right user
scans the QR, since the session might contain sensitive information.
 - Issuing sessions
 - Disclosing sessions with fixed attribute values (e.g. show that your email address is example@example.com)
 - Signing sessions (the message that needs signing might contain sensitive information)

For these session types, the `sessionPtr` will include an extra field `"pairingHint": true`.
When this happens, pairing will be enabled by default when a QR is scanned. In case
of a mobile session, a pairing state is never introduced.

In case you do not want a pairing state to happen for the above session
types, the pairing state can be disabled by setting the `pairing` option to `false`
instead of an object. You can also change the condition in which pairing is enabled
by modifying the `onlyEnableIf` option. For example, you can enable pairing
unconditionally by doing `onlyEnableIf: () => true`.

These are the accepted properties and their defaults for pairing. You can
overrule options one by one. For the options you don't specify, the default
value is used.

```javascript
state: {
  frontendOptions: {
    url:               m => `${m.sessionPtr['u']}/frontend/options`,
    requestContext:    'https://irma.app/ld/request/options/v1'
   },

   pairing: {
     onlyEnableIf:     m => m.sessionPtr['pairingHint'],
     completedUrl:     m => `${m.sessionPtr['u']}/frontend/pairingcompleted`,
     minCheckingDelay: 500, // Minimum delay before accepting or rejecting a pairing code, for better user experience.
     pairingMethod:    'pin'
   }
}
```

The URL from `m.sessionPtr['u']` will point directly to your IRMA server.
This is intentional; the IRMA app should be able to access those endpoints too.

As an example on how to use the pairing options, you can specify the following options
if you want to disable pairing in all cases. Only do this if you are aware of the
security implications!

```javascript
state: {
   pairing: false
}
```

## Behaviour
This plugin initiates the following transitions to the `irma-core` state machine.

**When being in state `Loading`:**

If `session` option is set to `false`, the plugin does nothing in this state.

Otherwise this plugin:
 * Fetches the `start` endpoint (unless `start` is explicitly set to `false`).
 * Extracts the session pointer (and, if specified, the session token and frontend authentication token)
   using the functions from the `mapping` option.

| Possible transitions | With payload              | Next state          |
|----------------------|---------------------------|---------------------|
| `loaded`             | mappings                  | CheckingUserAgent   |
| `fail`               | Error that fetch returned | Error               |

**When being in state `CheckingUserAgent`:**

Determines which flow should be started: the QR flow or the mobile flow.

| Possible transitions | With payload              | Next state          |
|----------------------|---------------------------|---------------------|
| `prepareQRCode`      |                           | PreparingQRCode     |
| `prepareButton`      |                           | PreparingIrmaButton |
| `fail`               | Error that fetch returned | Error               |

**When being in state `PreparingQRCode` or `PreparingIrmaButton`:**

In these states the plugin prepares for showing a QR or a button to a mobile session.
This includes enabling or disabling the pairing state if necessary.
In these states the plugin also polls the status at IRMA server using the `state` options, which
might result in some transitions either.

| Possible transitions                               | With payload                                             | Next state        |
|----------------------------------------------------|----------------------------------------------------------|-------------------|
| `showQRCode` if state is `PreparingQRCode`         | `{qr: <payload for in QRs>, showBackButton: true/false}` | ShowQRCode        |
| `showIrmaButton` if state is `PreparingIrmaButton` | `{mobile: <app link for launching the IRMA app>}`        | ShowIrmaButton    |
| `fail` if updating pairing state fails             | Error that fetch returned                                | Error             |

**When being in state `ShowingQRCode` or `ShowingIrmaButton`:**

In these states the plugin polls the status at IRMA server using the `state` options.

| Possible transitions                        | With payload              | Next state                              |
|---------------------------------------------|---------------------------|-----------------------------------------|
| `appConnected` if new status is `CONNECTED` |                           | ContinueOn2ndDevice / ContinueInIrmaApp |
| `appPairing` if new status is `PAIRING`     |                           | EnterPairingCode                        |
| `timeout` if new status is `TIMEOUT`        |                           | TimedOut                                |
| `cancel` if new status is `CANCELLED`       |                           | Cancelled                               |
| `fail` if sse/polling fails                 | Error that fetch returned | Error                                   |

**When being in state `EnterPairingCode`:**

In these states the plugin polls the status at IRMA server using the `state` options.

| Possible transitions                        | With payload              | Next state                              |
|---------------------------------------------|---------------------------|-----------------------------------------|
| `timeout` if new status is `TIMEOUT`        |                           | TimedOut                                |
| `cancel` if new status is `CANCELLED`       |                           | Cancelled                               |
| `fail` if sse/polling fails                 | Error that fetch returned | Error                                   |

**When being in state `Pairing`:**

In these states the plugin polls the status at IRMA server using the `state` options.

| Possible transitions                                   | With payload              | Next state          |
|--------------------------------------------------------|---------------------------|---------------------|
| `pairingRejected` if entered pairing code is incorrect | Rejected pairing code     | EnterPairingCode    |
| `appConnected` if new status is `CONNECTED`            |                           | ContinueOn2ndDevice |
| `timeout` if new status is `TIMEOUT`                   |                           | TimedOut            |
| `cancel` if new status is `CANCELLED`                  |                           | Cancelled           |
| `fail` if sse/polling fails                            | Error that fetch returned | Error               |

**When being in state `ContinueOn2ndDevice` or `ContinueInIrmaApp`:**

In this state we continue polling the IRMA server using the `state` options.

| Possible transitions                        | With payload              | Next state        |
|---------------------------------------------|---------------------------|-------------------|
| `succeed` if new status is `DONE`           |                           | Success           |
| `timeout` if new status is `TIMEOUT`        |                           | TimedOut          |
| `cancel` if new status is `CANCELLED`       |                           | Cancelled         |
| `fail` if sse/polling fails                 | Error that fetch returned | Error             |
| `fail` if fetching of result endpoint fails | Error that fetch returned | Error             |

**When being in state `Success` and `close()` is called**

When the `result` endpoint is enabled (so if `result` is not explicitly set to `false`),
then the `result` endpoint is fetched and returned as return value.
