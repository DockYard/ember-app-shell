/* eslint-env node */
'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const chromeLauncher = require('chrome-launcher');
const chromeInterface = require('chrome-remote-interface');

const DEFAULT_OPTIONS = {
  visitPath: '/app-shell',
  outputFile: 'app-shell.html'
};

const PLACEHOLDER = '<!-- EMBER_APP_SHELL_PLACEHOLDER -->';

module.exports = {
  name: 'ember-app-shell',

  included(app) {
    this._super.included && this._super.included.apply(this, arguments);
    this.app = app;
    this.app.options = this.app.options || {};
    this.app.options['ember-app-shell'] = Object.assign({}, DEFAULT_OPTIONS, this.app.options['ember-app-shell']);
  },

  postBuild({ directory }) {
    let { outputFile, visitPath } = this.app.options['ember-app-shell'];

    return this._launchAppServer(directory)
      .then((server) => {
        return this._launchChrome().then((client) => {
          const { Page, Runtime } = client;

          const navigate = Page.enable()
            .then(() => Page.navigate({ url: `http://localhost:4321${visitPath}` }))
            .then(() => Page.loadEventFired());

          return navigate
            .then(() => Runtime.evaluate({ expression: "document.querySelector('.ember-view').outerHTML" }))
            .then((html) => {
              let indexHTML = fs.readFileSync(path.join(directory, 'index.html')).toString();
              let appShellHTML = indexHTML.replace(PLACEHOLDER, html.result.value.toString());
              fs.writeFileSync(path.join(directory, outputFile), appShellHTML);
              server.close();
            });

        });
      });
  },

  contentFor(type) {
    if (type === 'body-footer') {
      return PLACEHOLDER;
    }
  },

  _launchAppServer(directory) {
    return new Promise((resolve, reject) => {
      let app = express();
      let server = http.createServer(app);
      app.use(express.static(directory));
      app.get('*', function (req, res) {
        res.sendFile('/index.html', { root: directory });
      });

      server.listen(4321, () => {
        resolve(server);
      });
    });
  },

  _launchChrome() {
    return chromeLauncher.launch({
      chromeFlags: [ '--disable-gpu', '--headless' ]
    }).then(chrome => {
      return chromeInterface({ port: chrome.port });
    });
  },

  isDevelopingAddon: () => true
};
