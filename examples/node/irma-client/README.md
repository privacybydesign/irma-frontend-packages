# Nodejs IRMA client example

This package is an example for how to use the `irma-client` plugin. The demo is
supposed to be run with `nodejs` in the terminal. See the source of `index.js`
for how we use the plugin.

Note that the way we initialize the session on the IRMA server is **not** a
recommended best practice for use in web browsers! See the
[irma-client documentation](../../../plugins/irma-client) for more information
on how to safely initialize your session.

You can run this example by running these commands in this directory:

```bash
npm install
npm start
```
