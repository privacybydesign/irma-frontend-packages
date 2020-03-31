# IRMA frontend

This is a thin wrapper around `irma-core`, `irma-web`, `irma-client` and
`irma-css`. The intended use of this package is to provide an all-in-one
Javascript file that developers can include in the HEAD section of an HTML file
and get started:

```html
<script src="assets/irma.js" type="text/javascript"></script>
```

And then you can instantiate `irma-core` like so:

```javascript
irma.new({
  debugging: false,            // Enable to get helpful output in the browser console
  element:   '#irma-web-form', // Which DOM element to render to

  // Back-end options
  session: {
    // Configure your flow here, see code examples in root README file
  },

  ...
});
```

Finally, you can start your IRMA flow:

```javascript
irma.start()
.then(result => console.log("Successful disclosure! 🎉", result))
.catch(error => console.error("Couldn't do what you asked 😢", error));
```

## Download
A bundled JavaScript file can be found [here](https://gitlab.science.ru.nl/irma/github-mirrors/irma-frontend-packages/-/jobs/artifacts/master/browse/irma-frontend/dist?job=irma-frontend).
Please download this file and host it yourself. Versions can change and we do not want to break your website.
