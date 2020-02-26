# Browser IRMA web example

This package is an example for how to use the `irma-web` plugin in the
web browser. See the source of `index.js` and `public/index.html` for how we use
the plugin.

This example uses the `irma-css` module from this repository. `irma-css` requires
its own installation and building steps. If you build this module from source,
please make sure you run `./build.sh` in the root directory of `irma-frontend-packages`.

You can run this example by running these commands in this directory:

```bash
npm install
npm run dev
```

The demo application will then run on the URL mentioned in the terminal output
(usually http://localhost:8080/).
