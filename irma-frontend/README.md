# IRMA frontend

This is a thin wrapper around `irma-core`, `irma-web`, `irma-popup`,
`irma-client` and `irma-css`. The intended use of this package is to provide
an all-in-one Javascript file that developers can include to get started:

```html
<script src="assets/irma.js" type="text/javascript"></script>
```

or as JavaScript import:
```javascript
const irma = require('@privacybydesign/irma-frontend');
```

When you want to use an embedded web element,
then you can instantiate `irma-core` like so:

```javascript
const irmaCore = irma.newWeb({
  debugging: false,            // Enable to get helpful output in the browser console
  element:   '#irma-web-form', // Which DOM element to render to

  // Back-end options
  session: {
    // Configure your flow here, see code examples in root README file
  },

  ...
});
```

When you want to use a popup overlay that renders on top the content of
your website, then you can instantiate `irma-core` like so:

```javascript
const irmaCore = irma.newPopup({
  debugging: false,            // Enable to get helpful output in the browser console

  // Back-end options
  session: {
    // Configure your flow here, see code examples in root README file
  },

  ...
});
```

Finally, you can start your IRMA flow:

```javascript
irmaCore.start()
.then(result => console.log("Successful disclosure! 🎉", result))
.catch(error => console.error("Couldn't do what you asked 😢", error));
```

Be aware that you can start an instance of `irma-core` only once.
When you want to call `start()` again, you have to create a new instance.

## Download
A bundled JavaScript file can be found [here](https://gitlab.science.ru.nl/irma/github-mirrors/irma-frontend-packages/-/jobs/artifacts/master/browse/irma-frontend/dist?job=irma-frontend).
Please download this file and host it yourself. Versions can change and we do not want to break your website.
