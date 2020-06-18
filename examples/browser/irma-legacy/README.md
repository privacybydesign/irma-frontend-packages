# Browser IRMA legacy example

This package is an example for how to use `irma-legacy` in the
web browser. See the source of `index.js` and `public/index.html` for how we use it.

This example uses the `irma-legacy` module from this repository. `irma-legacy` requires
its own installation and building steps. These steps have to be executed first before 
you can start this example. For an explanation how to do this you can check the README
of `irma-legacy`.

After having built `irma-legacy`, you can run this example by running
these commands in this directory:

```bash
npm install
npm run build
```

Then the public directory of this example can simply be hosted using an HTTP
server to run the example. You can for example use `serve` for this:

```bash
npm install serve
`npm bin`/serve ./public
```

The demo application will then run on the URL mentioned in the terminal output
(usually http://localhost:8080/).
