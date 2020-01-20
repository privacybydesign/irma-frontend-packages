# IRMA frontend

This is a thin wrapper around `irma-core`, `irma-web`, `irma-server` and
`irma-css`. The intended use of this package is to provide an all-in-one
Javascript file that developers can include in the HEAD section of an HTML file
and get started<sup>[1](#fonts)</sup>:

```html
<script src="//cdn.jsdelivr.net/gh/privacybydesign/irma-frontend-packages/irma-frontend/dist/irma.1a4c459df9c4e83674c5.js" type="text/javascript"></script>
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

## Updates

We don't want to break your website. But we do want to release new versions of
this package and its dependencies regularly. For that reason, we have added a
hash to the Javascript's file name. So if you're using an old version and want
to upgrade, please check back to this README file to find the newest file name
and update your website accordingly.

## Fonts

We almost succeeded in our attempt to have an all-in-one import. The only thing
that's being picky is the fonts. This is an
unfortunate [known issue](https://github.com/privacybydesign/irma-frontend-packages/issues/24).

To render the right fonts, you currently need to host them yourself. Please
download the `*.ttf` files located in the
[dist folder](https://github.com/privacybydesign/irma-frontend-packages/tree/master/irma-frontend/dist)
and host them alongside your own website.

## Building a new release

When making a new release of this package, please make sure to update this
manual to link to the new hash. Also, please don't remove old versions of
`irma-frontend` from the `dist` folder, because people will still be linking to
old versions.
