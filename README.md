# ember-app-shell

**[ember-app-shell is built and maintained by DockYard, contact us for expert Ember.js consulting](https://dockyard.com/ember-consulting)**.

Renders an App Shell based on your actual running Ember.js application using Headless Chrome!

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

## Configuration

There are two things you can configure, here's an example of how it can look like:

```javascript
var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  var app = new EmberApp(defaults, {
    'ember-app-shell': {
      visitPath: '/my-app-shell',
      outputFile: 'my-app-shell.html'
    }
  });

  return app.toTree();
};
```

### `visitPath`

This determines which route in your application is used to render the app shell.

Default: `/app-shell`.

### `outputFile`

This determines where the App Shell file is written to in your build.
Specifying `index.html` will overwrite the existing `index.html`.

Default: `index.html`

## Legal

[DockYard](http://dockyard.com/), Inc. &copy; 2017

[@dockyard](http://twitter.com/dockyard)

[Licensed under the MIT license](http://www.opensource.org/licenses/mit-license.php)
