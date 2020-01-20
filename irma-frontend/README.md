# IRMA frontend

This is a thin wrapper around `irma-core`, `irma-web`, `irma-server` and
`irma-css`. The intended use of this package is to provide an all-in-one
Javascript file that developers can include in the HEAD section of an HTML file
and get started:

```html
<script type="text/javascript" src="//cdn.jsdelivr.net/gh//privacybydesign/irma-frontend-packages/irma-frontend/dist/irma.js"></script>
```

And then you can instantiate `irma-core` like so:

```javascript
irma.new({
  // All your irma-core, irma-web and irma-server options go here
  debugging: true,
  ...
});
```

Finally, you can start your IRMA flow:

```javascript
irma.start()
.then(result => console.log("Successful disclosure! 🎉", result))
.catch(error => console.error("Couldn't do what you asked 😢", error));
```
