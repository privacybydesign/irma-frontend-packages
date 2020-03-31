# IRMA css

This is a package that contains all the necessary CSS to make IRMA flows look
pretty and have a standardized look and feel. See
[the style guide](https://privacybydesign.github.io/irma-frontend-packages/styleguide)
for visual examples and code snippets.

This package has been designed and tested to work with the browsers Chrome,
Firefox, Safari, Opera, Edge and IE11.

## Embedding in your application

This package only contains CSS. So basically you just include the CSS file(s)
and find the right HTML snippets [in the styleguide](https://privacybydesign.github.io/irma-frontend-packages/styleguide/section-examples.html).

### The old fashioned way

There is a [normal version and a minified version](https://gitlab.science.ru.nl/irma/github-mirrors/irma-frontend-packages/-/jobs/artifacts/master/browse/irma-css/dist?job=irma-css)
of the styles that you can include in your project. The CSS can be linked into
your website the regular way. You have to host the CSS file yourself.

```html
<link rel="stylesheet" href="assets/irma.css" />
```

### The way the cool kids do it

Alternatively, you can install it as an npm package. This can be useful if you
want to use (parts of) the SCSS behind it and override some variables, if you
need to package it in some complicated way and if you want more control over
updates.

```bash
$ npm install irma-css
```

You can then pull from the entire thing or just bits and pieces of it in your
SCSS/SASS files:

```scss
# The entire thing:
@import "~irma-css";

# Or just bits and pieces of it:
@import "~irma-css/src/components/irma-form";
```

Or require the CSS in your javascript if you use a tool like Webpack:

```javascript
require('@privacybydesign/irma-css/dist/irma.css');
```

## Contributing

### Compiling locally

Requires a working `git` and `npm` on your machine.

```bash
# Install dependencies
$ cd irma-css
$ npm install

# Run the compiler & dev server
$ npm run dev
```

You should now have the style guide running on
[http://localhost:8080](http://localhost:8080).

Any change you make to the stylesheets will trigger a rebuild of the style guide
and will be shown after a browser refresh.

### Making PRs

Please only commit your changes to the SCSS files, not any of the generated
files:

```bash
$ git add irma-css/src/
$ git commit -m "Update button shadows to reflect new design"
```

### Releasing

After merging one or more PRs, a new version can be released. First, update
`package.json` to reflect the new version number. Then:

```bash
$ cd irma-css
$ git add package.json

$ npm run clean # Build a clean style guide
$ git add ../docs/styleguide/

$ npm run release # Build a clean new version in dist
$ git add dist/

$ git commit -m "Releasing version xxx"
```
