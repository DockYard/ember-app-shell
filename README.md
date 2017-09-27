# ember-app-shell

Renders an App Shell based on your actual running Ember.js application using Headless Chrome!

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

This determines where the App Shell file is written to in your build. Specifying `index.html` will overwrite your existing `index.html`.

Default: `app-shell.html`

## Making sure your environment has Chrome

See the [README](https://www.npmjs.com/package/chrome-launcher#continuous-integration) of the `chrome-launcher` NPM package for more details.
