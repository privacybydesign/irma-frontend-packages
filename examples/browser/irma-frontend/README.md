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

To run this example, you need the [`irma` CLI tool](https://github.com/privacybydesign/irmago/releases/latest).
You can start the IRMA server to run this example in the following way:

```bash
irma server --static-path=.
```

It will be available in your browser at http://localhost:8088.

Did you make changes to one of the packages and do you want to test these changes
using this example? Please check the [development instructions](/README.md#development) first.
