# IRMA web

This plugin contains a front-end for IRMA flows in the web browser.

It is designed to be used with [`irma-css`](https://github.com/privacybydesign/irma-frontend-packages/tree/master/irma-css),
but can be used with different styling. `irma-css` is not a dependency of this
package by design, so you are free to use other styling.

If you *do* want to use `irma-css` (which is recommended), you may want to use
[the `irma-frontend` package](https://github.com/privacybydesign/irma-frontend-packages/tree/master/irma-frontend)
instead for ease of use, or take a look at
[`irma-web`](https://github.com/privacybydesign/irma-frontend-packages/tree/master/examples/browser/irma-web)
for a more hands-on implementation example.

## Usage

```javascript
const IrmaCore = require('@privacybydesign/irma-core');
const Web      = require('@privacybydesign/irma-web');

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

_Note: the helper is supposed to be able to get triggered during the IRMA flow.
This is not possible yet. This makes it pretty useless right now. PRs and ideas
welcome._
