# Browser IRMA frontend example

This package is an example for how to use the `irma-frontend` wrapper in the
web browser. See the source of `index.html` for how we use the wrapper.

Note that the way we initialize the session on the IRMA server is **not** a
recommended best practice for use in web browsers! See the
[irma-client documentation](../../../plugins/irma-client) for more information
on how to safely initialize your session.

You can run this example by installing this package:

```bash
npm install
npm run build
```

Then the root directory of this example can simply be hosted using an HTTP
server to run the example. You can for example use `serve` for this:
```bash
npm install serve
`npm bin`/serve .
```
