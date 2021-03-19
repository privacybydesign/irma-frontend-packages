# IRMA web

This plugin contains a front-end for IRMA flows in the web browser.

It is designed to be used with
[`irma-css`](https://github.com/privacybydesign/irma-frontend-packages/tree/master/plugins/irma-css). 
`irma-css` is not a dependency of this package by design. This means that the CSS must be imported
separately. How to do this, you can check in the README of `irma-css`. In this way you can also
adapt `irma-css` to your own design and import this custom style instead.

If you *do* want to use `irma-css` (which is recommended), you may also consider using
[the `irma-frontend` package](https://github.com/privacybydesign/irma-frontend-packages/tree/master/irma-frontend)
instead for ease of use, or take a look at
[the `irma-web` example](https://github.com/privacybydesign/irma-frontend-packages/tree/master/examples/browser/irma-web)
for a more hands-on implementation example.

## Usage

```javascript
const IrmaCore = require('@privacybydesign/irma-core');
const Web      = require('@privacybydesign/irma-web');

require('@privacybydesign/irma-css');

const irma = new IrmaCore({
  element: '#irma-web-form'
});

irma.use(Web);
irma.start();
```

## Options

### element

The `element` option should contain a selector that points to an element in
which to render the IRMA form. This is a required option.

### language

You can set the interface language by setting the `language` option. Currently
supported values: `en` and `nl`. Default is `nl`.

### fallbackDelay

You can set the delay in milliseconds that should be waited before the helper
message is shown as fallback. This only involves the mobile flow on Android.
This delay is measured from the point that the user presses the button to open
the IRMA app. A recommended value here is to double the polling interval.
Default is `1000` ms.

### translations

If you have more specific translation requirements, or if your use-case is not
logging a user in, you can override any of the strings in the interface using
the `translations` option. It is good practice to be specific in these texts to
avoid unnecessary confusion for your users.

```javascript
const irma = new IrmaCore({
  translations: {
    header:  'Sign the agreement with <i class="irma-web-logo">IRMA</i>',
    loading: 'Finding your agreement...'
  }
});
```

You can find the default values [in the translation files](https://github.com/privacybydesign/irma-frontend-packages/tree/master/plugins/irma-web/translations).

### showHelper

The option `showHelper` is a boolean that determines if the
[`irma-css` helper](https://privacybydesign.github.io/irma-frontend-packages/styleguide/section-examples.html#kssref-examples-helpers)
should be shown or not. Default is false.

_Note: the helper is also triggered during the mobile flow on Android. In that case, the helper
becomes visible when the user presses the button to open the IRMA app, and the app fails to open.
So, when `showHelper` is set to false, the helper is only visible as fallback and disappears
again as soon as the happy flow continues. When `showHelper` is set to true, the helper will
be visible unconditionally._
