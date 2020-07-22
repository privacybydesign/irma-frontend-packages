# Browser IRMA legacy example

This package is an example for how to use `irma-legacy` (also known as `irmajs`) in the
web browser. See the source of `index.js` and `public/index.html` for how we use it.

Note that the way we initialize the session on the IRMA server is **not** a
recommended best practice for use in web browsers! Sessions can best be started
in the backend or one can use signed JWTs.

You can run this example by running these commands in this directory:

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

If you want to build one of the included `irma-frontend-packages` modules from
source, for example when testing, please make sure you run `./build.sh`
in the root directory of `irma-frontend-packages`.
You can link local versions of modules easily using `npm link`. There is
an explanation about how to use `npm link` in the README of the
`irma-frontend-packages` root directory.
