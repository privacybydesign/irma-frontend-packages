# Browser IRMA frontend example

This package is an example for how to use the `irma-frontend` wrapper in the
web browser. See the source of `index.html` for how we use the wrapper.

This example uses the `irma-frontend` module from this repository. `irma-frontend` requires
its own installation and building steps. If you build this module from source,
please make sure you run `./build.sh` in the root directory of `irma-frontend-packages`.

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

The demo application will then run on the URL mentioned in the terminal output
(usually http://localhost:8080/).
