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
```

Then the root directory of this example can simply be hosted using an HTTP
server to run the example. You can for example use `serve` for this:
```bash
npm install serve
`npm bin`/serve .
```

If you want to build one of the included `irma-frontend-packages` modules from
source, for example when testing, please make sure you run `./build.sh`
in the root directory of `irma-frontend-packages`.
You can link local versions of modules easily using `npm link`. There is
an explanation about how to use `npm link` in the README of the
`irma-frontend-packages` root directory.
