# ember-app-shell

**[ember-app-shell is built and maintained by DockYard, contact us for expert Ember.js consulting](https://dockyard.com/ember-consulting)**.

Renders an App Shell based on your actual running Ember.js application using Headless Chrome! It also inlines the relevant minimal CSS using the [Critical](https://github.com/addyosmani/critical) tool.

## How does this work?

Near the end of Ember CLI's build process, this addon loads your app in a Headless Chrome session and takes the rendered HTML and replaces `index.html` with the output of the `/app-shell` route. This way you are able to serve some static html before Ember boots up in the browser, but not having to maintain that manually in the `index.html` file.

See _[The App Shell Model](https://developers.google.com/web/fundamentals/architecture/app-shell)_ on Google's Developer website for more information about what an App Shell is.

This addon is intended to be used with [Ember Service Worker](http://ember-service-worker.com) and the [ember-service-worker-index](https://github.com/DockYard/ember-service-worker-index) addon.

## Installation

```shell
ember install ember-app-shell
```

You also need to make sure that every environment that will build your app runs Google Chrome (Canary).

See the [README](https://www.npmjs.com/package/chrome-launcher#continuous-integration) of the `chrome-launcher` NPM package for more details on how to install Chrome on CI environments.

## Getting Started

This addon will visit `/app-shell` by default when the Ember app is built by Ember CLI, so we need to make sure that route exists. The easiest way is to generate one using Ember CLI:

```shell
ember generate route app-shell
```

Now let's assume your `application.hbs` and `app-shell.hbs` look like the following:

```handlebars
{{! application.hbs}}
<header>
  <h1>My App's Name</h1>
  <img src="/assets/images/logo.png" alt="My App's Name Logo">
</header>

<main>
  {{outlet}}
</main>
```

```handlebars
{{! app-shell.hbs}}
<div class="page-loading-spinner">
  <img class="loading-spinner" src="/assets/images/loading-spinner.gif" alt="loading...">
</div>
```

Then after building (e.g. `ember build`) the built `index.html` file (e.g. `dist/index.html`) will contain:

```html
<div id="ember377" class="ember-view">
  <header>
    <h1>My App's Name</h1>
    <img src="/assets/images/logo.png" alt="My App's Name Logo">
  </header>
  
  <main>
    <div id="ember422" class="ember-view">
      <div class="page-loading-spinner">
        <img class="loading-spinner" src="/assets/images/loading-spinner.gif" alt="loading...">
      </div>
    </div>
  </main>
</div>
```

If you now open up your app in the browser, you'll see the app shell content until the Ember.js app renders.

## Configuration

There are two things you can configure, here's an example of how it can look like:

```javascript
var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  var app = new EmberApp(defaults, {
    'ember-app-shell': {
      visitPath: '/my-app-shell',
      outputFile: 'my-app-shell.html',
      // https://github.com/addyosmani/critical#options
      criticalCSSOptions: {
        width: 1300,
        height: 900
      }
    }
  });

  return app.toTree();
};
```

### `visitPath`

This determines which route in your application is used to render the app shell. If you have your router configured with `locationType: 'hash'` then you might need to set `visitPath: '/#/app-shell'`.

Default: `/app-shell`.

### `outputFile`

This determines where the App Shell file is written to in your build.
Specifying `index.html` will overwrite the existing `index.html`.

Default: `index.html`

### `criticalCSSOptions`

The options passed to the [`critical`](https://github.com/addyosmani/critical) module.

Default: `{ minify: true }`

## Legal

[DockYard](http://dockyard.com/), Inc. &copy; 2017

[@dockyard](http://twitter.com/dockyard)

[Licensed under the MIT license](http://www.opensource.org/licenses/mit-license.php)
