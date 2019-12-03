# IRMA security

This plugin brings the JWT signing and token keys back to starting an IRMA
session on the IRMA server. It is intended to be used with [`irma-server`](../irma-server).

## Usage

This plugin is not a plugin in the traditional sense. You don't use it with
`irma.use(<plugin>)` but rather you use it to format your options:

```javascript
const IrmaCore = require('irma-core');
const Server   = require('irma-server');
const Security = require('irma-security');

const irma = new IrmaCore({
  session: {
    // Point this to your IRMA server:
    url: 'http://localhost:8088',

    start: Security(
      {
        // Sign the request using RS256
        method: 'publickey',
        key: 'dh897gh8....7fj76f9j6g',
        name: 'Sender name',
      },
      {
        // Define your disclosure request:
        body: {
          "@context": "https://irma.app/ld/request/disclosure/v2",
          "disclose": [
            [
              [ "pbdf.pbdf.email.email" ]
            ]
          ]
        }
      }
    )
  }
});

irma.use(Server);
irma.start(/* parameters */);
```

## Options

The first parameter to the method that `irma-security` exposes is an object that
defines the `method` of security you with to use and a `key` and optional
`name`.

The second parameter to the method is the object that you want to pass to the
`session.start` option of `irma-server`. Only the `headers` and the `body`
properties of this object will be touched by this method, the rest will be
passed through. Note that `body` should be an object, not stringified JSON.

### method

Method has three valid values:

* `token` ⸺ use `key` as a security token in the headers of the request
* `publickey` ⸺ sign the body of the request using RS256 and the supplied `key` and `name`
* `hmac` ⸺ sign the body of the request using HS256 and the supplied `key` and `name`
