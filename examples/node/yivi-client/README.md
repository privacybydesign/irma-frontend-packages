# Nodejs Yivi client example

This package is an example for how to use the `yivi-client` plugin. The demo is
supposed to be run with `nodejs` in the terminal. See the source of `index.js`
for how we use the plugin.

Note that the way we initialize the session on the Yivi server is **not** a
recommended best practice for use in web browsers! See the
[yivi-client documentation](../../../plugins/yivi-client) for more information
on how to safely initialize your session.

To run this example, you need the [`yivi` CLI tool](https://github.com/privacybydesign/yivigo/releases/latest).
You first need to start an Yivi server locally.
```bash
yivi server
```

You can run this example by running the following commands in a separate terminal window.
The directory in which this README is located should be the working directory.

```bash
npm install
npm start
```